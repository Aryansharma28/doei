"""LiveKit voice agent worker for the Dutch debt advisor.

Lifecycle
---------
1. Worker accepts a job for an incoming room.
2. Reads participant metadata: {user_id, lang, debts, income, firstName}.
   The metadata is signed into the LiveKit token by api/voice/token.ts so
   user_id is not spoofable.
3. Fetches past-call summaries from Supabase, builds the voice system
   prompt, opens an active row in the `calls` table.
4. Runs an AgentSession: Deepgram STT -> Anthropic Haiku 4.5 -> Cartesia
   TTS, with Silero VAD for turn detection.
5. On disconnect, summarizes the transcript with Sonnet 4.6 and writes
   everything back to the calls row.

Models
------
Live conversation: claude-haiku-4-5 (chosen for latency — voice cannot
                   tolerate Sonnet's pauses).
End-of-call summary: claude-sonnet-4-6 (one-shot, latency irrelevant,
                     quality matters most for next-call continuity).
"""

import asyncio
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from livekit import agents
from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions, cli, function_tool
from livekit.agents.stt import StreamAdapter
from livekit.plugins import anthropic, cartesia, reson8, silero

from prompts import OPENING_FALLBACK, build_voice_system_prompt
from tools import (
    get_past_call_summaries,
    get_user_financial_summary,
    save_call_record,
    schedule_followup_call,
    start_call_record,
)

# Load .env from the repo root, not the voice-agent/ subdir
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def _parse_metadata(raw: str | None) -> dict | None:
    if not raw:
        return None
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return None
    if not parsed.get("user_id"):
        return None
    parsed["lang"] = "nl" if parsed.get("lang") == "nl" else "en"
    parsed["debts"] = parsed.get("debts") or []
    parsed["income"] = parsed.get("income") or []
    return parsed


class FinancialAdvisor(Agent):
    """The agent personality. Tools are bound to the live session context
    (user_id, debts, income, lang) at construction time so the LLM can call
    them without us threading params through each call."""

    def __init__(
        self,
        instructions: str,
        user_id: str,
        debts: list,
        income: list,
        lang: str,
    ) -> None:
        super().__init__(instructions=instructions)
        self._user_id = user_id
        self._debts = debts
        self._income = income
        self._lang = lang

    @function_tool()
    async def get_financial_summary(self) -> dict:
        """Re-read the user's current financial snapshot (debts, income,
        totals). Useful if you've lost track of a specific number
        mid-conversation. The snapshot was already injected into your
        system prompt — call this only to verify before stating a number."""
        return get_user_financial_summary(self._debts, self._income)

    @function_tool()
    async def get_past_calls(self, limit: int = 5) -> list:
        """Fetch additional past call summaries beyond the 3 most recent
        already in your system prompt. Use only if the user references
        something further back. Max 10."""
        return await get_past_call_summaries(self._user_id, min(limit, 10))

    @function_tool()
    async def schedule_followup_call(self, start_iso: str) -> dict:
        """Book a recurring weekly 20-minute follow-up on the user's
        Google Calendar. Use this near the end of the call once they've
        agreed to a time. start_iso must be ISO 8601 with timezone
        (example: 2026-05-04T10:00:00+02:00). The user must have
        connected Google in the app — if not, returns ok:false and you
        should tell them they can connect from the dashboard."""
        return await schedule_followup_call(
            user_id=self._user_id,
            start_iso=start_iso,
            lang=self._lang,
            duration_minutes=20,
        )


async def entrypoint(ctx: JobContext) -> None:
    await ctx.connect()
    participant = await ctx.wait_for_participant()
    meta = _parse_metadata(participant.metadata)
    if not meta:
        print("[voice-agent] missing/invalid participant metadata, hanging up")
        await ctx.shutdown()
        return

    user_id: str = meta["user_id"]
    lang: str = meta["lang"]
    debts = meta["debts"]
    income = meta["income"]
    first_name = meta.get("firstName")

    past_calls = await get_past_call_summaries(user_id, 3)
    call_id = await start_call_record(user_id)

    system_prompt = build_voice_system_prompt(
        lang=lang,
        debts=debts,
        income=income,
        past_calls=past_calls,
        first_name=first_name,
    )

    vad = silero.VAD.load()
    session = AgentSession(
        stt=StreamAdapter(stt=reson8.STT(language="nl" if lang == "nl" else "en"), vad=vad),
        llm=anthropic.LLM(model="claude-haiku-4-5"),
        tts=cartesia.TTS(model="sonic-2", language="nl" if lang == "nl" else "en"),
        vad=vad,
    )

    advisor = FinancialAdvisor(
        instructions=system_prompt,
        user_id=user_id,
        debts=debts,
        income=income,
        lang=lang,
    )

    # Capture both sides of the conversation as we go so we can summarize
    # on disconnect even if the call drops mid-way.
    transcript_lines: list[str] = []

    @session.on("user_input_transcribed")
    def _on_user_speech(ev) -> None:  # type: ignore[no-redef]
        text = getattr(ev, "transcript", None) or getattr(ev, "text", None)
        if getattr(ev, "is_final", True) and text:
            transcript_lines.append(f"User: {text}")

    @session.on("conversation_item_added")
    def _on_agent_speech(ev) -> None:  # type: ignore[no-redef]
        item = getattr(ev, "item", None)
        if item is None:
            return
        if getattr(item, "role", None) == "assistant":
            content = getattr(item, "text_content", None) or str(getattr(item, "content", ""))
            if content:
                transcript_lines.append(f"Advisor: {content}")

    await session.start(agent=advisor, room=ctx.room)

    # Pre-warmed opening so TTS starts synthesizing immediately on connect.
    opening_key = "returning" if past_calls else "first_call"
    await session.say(OPENING_FALLBACK[lang][opening_key], allow_interruptions=True)

    saved = False

    async def finalize(status: str) -> None:
        nonlocal saved
        if saved or not call_id:
            return
        saved = True
        await save_call_record(
            call_id=call_id,
            user_id=user_id,
            transcript="\n".join(transcript_lines),
            status=status,
            lang=lang,
        )

    def _on_participant_disconnected(p) -> None:  # type: ignore[no-redef]
        if p.identity == participant.identity:
            asyncio.create_task(finalize("completed"))

    def _on_room_disconnected(*_args, **_kwargs) -> None:
        asyncio.create_task(finalize("failed"))

    ctx.room.on("participant_disconnected", _on_participant_disconnected)
    ctx.room.on("disconnected", _on_room_disconnected)


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
