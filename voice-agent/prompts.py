"""Voice agent prompts. The system prompt is the most-iterated file in this
project — keep sections clearly labelled so edits are easy.

Mirrors the structure of the chat advisor's prompt in
src/schuld/components/Advisor.jsx (Dutch context, accuracy rules, situation
injection). Differs from the chat prompt in: (1) voice cadence — short turns,
no markdown, no PAY/PAYPLAN tags; (2) empathy lead-in; (3) past-call
continuity; (4) crisis hand-off override.
"""

from typing import Literal, TypedDict, Optional

Lang = Literal["nl", "en"]


class VoiceDebt(TypedDict, total=False):
    creditorType: str
    creditorName: str
    amount: float
    originalAmount: float
    stage: str
    dueDate: str
    notes: Optional[str]


class VoiceIncome(TypedDict, total=False):
    label: str
    amount: float
    day: int


class PastCall(TypedDict):
    started_at: str
    summary: str


def _format_debts(debts: list[VoiceDebt]) -> str:
    if not debts:
        return "(none on file)"
    lines = []
    for d in debts:
        lines.append(
            f"- id:{d.get('creditorType', '')} | {d.get('creditorName', '')} "
            f"({d.get('creditorType', '')}): €{d.get('amount', 0)} owed "
            f"(original €{d.get('originalAmount', 0)}), "
            f"stage: {d.get('stage', '')}, due: {d.get('dueDate', '')}, "
            f"notes: {d.get('notes') or 'none'}"
        )
    return "\n".join(lines)


def _format_income(income: list[VoiceIncome]) -> str:
    if not income:
        return "(none on file)"
    return "\n".join(
        f"- {i.get('label', '')}: €{i.get('amount', 0)}/month "
        f"(paid day {i.get('day', '')})"
        for i in income
    )


def _format_past_calls(calls: list[PastCall]) -> str:
    if not calls:
        return "(no previous calls — this is the first one)"
    return "\n".join(
        f"Call {idx + 1} ({c['started_at'][:10]}): {c['summary']}"
        for idx, c in enumerate(calls)
    )


def build_voice_system_prompt(
    lang: Lang,
    debts: list[VoiceDebt],
    income: list[VoiceIncome],
    past_calls: list[PastCall],
    first_name: Optional[str] = None,
) -> str:
    total_debt = sum(d.get("amount", 0) for d in debts)
    monthly_income = sum(i.get("amount", 0) for i in income)
    lang_name = "Dutch" if lang == "nl" else "English"
    name_line = f"The person's name is {first_name}." if first_name else ""
    debt_word = "debt" if len(debts) == 1 else "debts"

    return f"""You are a debt advisor on a live voice call with someone in the Netherlands. Respond in {lang_name}.

{name_line}

Speak in short, plain sentences. No markdown. Be helpful and honest.

Their situation:
Total debt: €{total_debt:.0f} across {len(debts)} {debt_word}. Monthly income: €{monthly_income:.0f}.

Debts:
{_format_debts(debts)}

Income:
{_format_income(income)}

Past calls (for continuity):
{_format_past_calls(past_calls)}

Only reference the numbers above. Don't invent figures. If they want a follow-up call, you can offer to schedule one.
"""


# End-of-call summarization. Run once on disconnect with the full transcript.
# The output is stored in calls.summary and surfaced to future calls via the
# PAST CALLS section above — write it for that purpose.
SUMMARIZATION_PROMPT = """You just finished a voice call with someone in the Netherlands working through their debts. Write a short summary of the call for future reference.

The summary will be shown to the same advisor on the NEXT call so they have continuity. Write it for that audience.

Include:
- The emotional state they were in (briefly, without labelling them)
- The specific concrete step they agreed to take (if any)
- Any commitments or deadlines mentioned
- Anything important left unresolved or worth following up on next time

Do NOT include:
- A blow-by-blow of the conversation
- Generic advice that was given
- Filler

Length: 3–5 sentences. Plain prose, no bullet points. Same language as the call."""


# Opening line fallbacks. The model generates its own open from the system
# prompt, but TTS pre-warming with a fixed line eliminates dead air on connect.
OPENING_FALLBACK = {
    "en": {
        "first_call": "Hey — thanks for picking up. Take your time. What's on your mind today?",
        "returning": "Hey, good to hear you again. How have things been since we last talked?",
    },
    "nl": {
        "first_call": "Hé, fijn dat je belt. Geen haast. Wat speelt er vandaag?",
        "returning": "Hé, fijn om je weer te spreken. Hoe is het gegaan sinds we elkaar laatst spraken?",
    },
}
