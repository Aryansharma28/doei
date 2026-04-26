"""Tool implementations for the voice agent.

These are the side-effecting calls the LLM can make mid-conversation:
financial summary lookup, past-call lookup, save-on-disconnect, and the
Google Calendar booking. Kept separate from agent.py so the LLM-glue and
the side effects are easy to read independently.
"""

import os
from datetime import datetime, timedelta, timezone

import httpx
from anthropic import Anthropic
from supabase import Client, create_client

from prompts import SUMMARIZATION_PROMPT, Lang, PastCall, VoiceDebt, VoiceIncome

_supabase: Client | None = None


def supabase() -> Client | None:
    global _supabase
    if _supabase is not None:
        return _supabase
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        return None
    _supabase = create_client(url, key)
    return _supabase


# 1. get_user_financial_summary
# Pure formatter over the snapshot already in room metadata. Exposed as a
# tool so the model can re-check a number mid-call without making one up.
def get_user_financial_summary(
    debts: list[VoiceDebt], income: list[VoiceIncome]
) -> dict:
    total_debt = sum(d.get("amount", 0) for d in debts)
    monthly_income = sum(i.get("amount", 0) for i in income)
    return {
        "total_debt_eur": round(total_debt),
        "monthly_income_eur": round(monthly_income),
        "debt_count": len(debts),
        "debts": [
            {
                "id": d.get("creditorType"),
                "creditor": d.get("creditorName"),
                "amount_eur": d.get("amount"),
                "original_amount_eur": d.get("originalAmount"),
                "stage": d.get("stage"),
                "due_date": d.get("dueDate"),
            }
            for d in debts
        ],
        "income": [
            {
                "label": i.get("label"),
                "amount_eur": i.get("amount"),
                "paid_day": i.get("day"),
            }
            for i in income
        ],
    }


# 2. get_past_call_summaries
async def get_past_call_summaries(user_id: str, limit: int = 3) -> list[PastCall]:
    sb = supabase()
    if not sb:
        return []
    resp = (
        sb.table("calls")
        .select("started_at, summary")
        .eq("user_id", user_id)
        .eq("status", "completed")
        .not_.is_("summary", "null")
        .order("started_at", desc=True)
        .limit(limit)
        .execute()
    )
    rows = resp.data or []
    return [{"started_at": r["started_at"], "summary": r["summary"] or ""} for r in rows]


# 3. start_call_record / save_call_record
async def start_call_record(user_id: str) -> str | None:
    sb = supabase()
    if not sb:
        return None
    resp = (
        sb.table("calls")
        .insert({"user_id": user_id, "status": "active"})
        .execute()
    )
    rows = resp.data or []
    return rows[0]["id"] if rows else None


async def save_call_record(
    call_id: str,
    user_id: str,
    transcript: str,
    status: str,
    lang: Lang,
) -> None:
    sb = supabase()
    if not sb:
        return

    summary: str | None = None
    if transcript.strip():
        try:
            summary = await summarize_transcript(transcript, lang)
        except Exception as exc:  # noqa: BLE001
            print(f"[voice-agent] summarization failed: {exc}")

    sb.table("calls").update(
        {
            "ended_at": datetime.now(timezone.utc).isoformat(),
            "status": status,
            "summary": summary,
            "full_transcript": transcript,
        }
    ).eq("id", call_id).execute()


async def summarize_transcript(transcript: str, lang: Lang) -> str:
    client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    lang_instr = (
        "Write the summary in Dutch."
        if lang == "nl"
        else "Write the summary in English."
    )
    resp = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=400,
        system=f"{SUMMARIZATION_PROMPT}\n\n{lang_instr}",
        messages=[{"role": "user", "content": f"Transcript:\n\n{transcript}"}],
    )
    text_blocks = [b.text for b in resp.content if getattr(b, "type", None) == "text"]
    return text_blocks[0].strip() if text_blocks else ""


# 4. schedule_followup_call
# Books a recurring weekly 20-min event on the user's Google Calendar. The
# event location is a deep link back into the app; tapping the calendar
# reminder at T-0 lands the user on the advisor page with ?voice=1 and
# auto-opens the call modal. Google handles the reminders for free, which
# is why this whole flow costs nothing extra to operate.
async def schedule_followup_call(
    user_id: str,
    start_iso: str,
    lang: Lang,
    duration_minutes: int = 20,
) -> dict:
    sb = supabase()
    if not sb:
        return {"ok": False, "error": "supabase not configured"}

    conn_resp = (
        sb.table("gmail_connections")
        .select("refresh_token")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    refresh_token = (conn_resp.data or {}).get("refresh_token")
    if not refresh_token:
        return {"ok": False, "error": "user has not connected Google"}

    access_token = await _refresh_google_access_token(refresh_token)
    if not access_token:
        return {"ok": False, "error": "could not refresh Google token"}

    start_dt = datetime.fromisoformat(start_iso.replace("Z", "+00:00"))
    end_dt = start_dt + timedelta(minutes=duration_minutes)
    app_url = os.environ.get("APP_URL", "http://localhost:5173").rstrip("/")
    join_url = f"{app_url}/app?voice=1"

    summary_text = (
        "Schuld-coach check-in (20 min)" if lang == "nl" else "Debt advisor check-in (20 min)"
    )
    description = (
        "Wekelijkse check-in met je adviseur. Klik op de link om mee te doen."
        if lang == "nl"
        else "Weekly check-in with your advisor. Click the link to join."
    )

    event = {
        "summary": summary_text,
        "description": f"{description}\n\n{join_url}",
        "location": join_url,
        "start": {"dateTime": start_dt.isoformat()},
        "end": {"dateTime": end_dt.isoformat()},
        "recurrence": ["RRULE:FREQ=WEEKLY"],
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "popup", "minutes": 10},
                {"method": "popup", "minutes": 0},
                {"method": "email", "minutes": 60},
            ],
        },
    }

    async with httpx.AsyncClient(timeout=15) as http:
        cal_resp = await http.post(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            json=event,
        )
    if cal_resp.status_code >= 400:
        return {"ok": False, "error": f"Google Calendar error: {cal_resp.text}"}

    event_id = cal_resp.json().get("id")
    sb.table("scheduled_calls").insert(
        {
            "user_id": user_id,
            "scheduled_for": start_dt.isoformat(),
            "google_event_id": event_id,
            "cadence": "weekly",
            "status": "scheduled",
        }
    ).execute()

    return {"ok": True, "event_id": event_id}


async def _refresh_google_access_token(refresh_token: str) -> str | None:
    # Reuse the same OAuth client the existing Gmail integration uses.
    client_id = os.environ.get("GMAIL_CLIENT_ID")
    client_secret = os.environ.get("GMAIL_CLIENT_SECRET")
    if not client_id or not client_secret:
        return None
    async with httpx.AsyncClient(timeout=15) as http:
        resp = await http.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
    if resp.status_code >= 400:
        return None
    return resp.json().get("access_token")
