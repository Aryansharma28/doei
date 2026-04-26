# Voice advisor — run it

Voice version of the chat advisor. LiveKit + Anthropic + Supabase. Frontend and token endpoint are TS (live in the existing app); the agent worker is a small Python sub-project under `voice-agent/` because LiveKit's Anthropic/Deepgram/Cartesia plugins only exist for Python today.

## What it does

User clicks "Call your advisor" on the Advisor screen → joins a LiveKit room → the Python agent worker connects, reads their debts/income from the room metadata, fetches their last 3 call summaries from Supabase, and starts a Dutch/English voice conversation. On hang-up, the transcript gets summarized by Sonnet 4.6 and saved to the `calls` table for next-call continuity. Near the end of the call the agent offers to book a recurring weekly 20-min follow-up on the user's Google Calendar.

## One-time setup

### 1. Run the migrations

Paste each into the Supabase SQL editor and run, in order:

- `supabase/calls.sql` — call records
- `supabase/scheduled_calls.sql` — booked follow-ups

### 2. Install JS deps (frontend + backend)

```bash
npm install
```

### 3. Install Python deps (voice agent worker)

WSL/Ubuntu may need `python3-venv` first:

```bash
sudo apt install python3-venv          # only if `python3 -m venv` fails
```

Then:

```bash
cd voice-agent
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

### 4. Env vars (already in your `.env`)

You confirmed all of these are set:

```
ANTHROPIC_API_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
APP_URL
GMAIL_CLIENT_ID
GMAIL_CLIENT_SECRET
LIVEKIT_URL
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
DEEPGRAM_API_KEY
CARTESIA_API_KEY
```

### 5. Enable Google Calendar API

In Google Cloud Console (the same project that powers Gmail OAuth): **APIs & Services → Library → Google Calendar API → Enable**. Same OAuth client, no new credentials.

### 6. Re-consent with Google (one-time per user)

The connect-Gmail button now requests the `calendar.events` scope alongside the existing Gmail scope. Existing users need to disconnect + reconnect Google to pick up the new scope.

## Run it (3 terminals)

```bash
# 1. Frontend
npm run dev

# 2. Backend (token endpoint + existing chat advisor)
npm run dev:backend

# 3. Voice agent worker — must have venv activated, or run with absolute path:
cd voice-agent && source .venv/bin/activate && python3 agent.py dev
# or, after `npm install`:
npm run dev:voice-agent     # only works if .venv is the active python
```

Open http://localhost:5173, sign in, go to the Advisor tab, click **Call your advisor**.

## Files

| File | Purpose |
|---|---|
| `voice-agent/prompts.py` | System prompt + summarization prompt. **Iterate here.** |
| `voice-agent/agent.py` | LiveKit Agents worker. Lifecycle, STT/LLM/TTS pipeline, function tools. |
| `voice-agent/tools.py` | Side-effecting tool implementations. |
| `voice-agent/requirements.txt` | Python deps for the worker. |
| `api/voice/token.ts` | Mints LiveKit tokens with debts/income in metadata. |
| `src/schuld/components/VoiceCallButton.jsx` | Call button + auto-open on `?voice=1`. |
| `src/schuld/components/VoiceCallModal.jsx` | In-call UI: mic, transcript, end button. |
| `supabase/calls.sql` | Call records table. |
| `supabase/scheduled_calls.sql` | Booked follow-ups table. |

## Models

- **Live conversation**: `claude-haiku-4-5` — chosen for latency. Voice can't tolerate Sonnet's pauses.
- **End-of-call summarization**: `claude-sonnet-4-6` — one-shot, latency irrelevant, quality matters most for next-call continuity.

Switch in `voice-agent/agent.py` (`anthropic.LLM(model=...)`) and `voice-agent/tools.py` (`summarize_transcript`).

## Iterating on the prompt

`voice-agent/prompts.py` → `build_voice_system_prompt`. Mirrors the chat advisor's prompt structure (situation injection, accuracy rules, Dutch context) but replaces the chat-format section with voice cadence rules and adds an empathy lead, crisis-handoff override, and follow-up booking instruction.

## Scheduled follow-up calls (the recurring weekly check-in)

1. Near the end of an inbound call, the agent offers a 20-min follow-up next week.
2. If the user agrees, the agent calls `schedule_followup_call` → creates a recurring weekly event on the user's Google Calendar with the location set to `<APP_URL>/app?voice=1`.
3. **Google Calendar handles the reminders for free** — email at T-60, push at T-10 and T-0.
4. At T-0, user taps the calendar notification → lands on the advisor page with `?voice=1` → modal auto-opens → connects to LiveKit → worker joins.
5. Same call lifecycle: transcript captured, summary written on hang-up.

Cost: $0 extra. Reuses the existing Gmail OAuth credentials and the `gmail_connections.refresh_token` already in Supabase.

## Known gaps for the demo

- **No real outbound phone call (PSTN).** "Outbound" here = calendar reminder rings the user's phone via the OS calendar app, they tap to join the in-app call. Real phone-call outbound (Twilio + LiveKit SIP) is out of scope.
- **Transcript display in the modal is best-effort.** Comes from LiveKit's transcription event; if the STT plugin shape changes, the call still works — you just won't see captions.
- **Financial data flows via room metadata, not a Supabase read.** Matches where the data actually lives today (localStorage). When debts/income move into Supabase tables, swap `get_user_financial_summary` to read from there.
- **Booking requires the user to have re-connected Google with the calendar scope.** Agent handles missing scope gracefully — tells the user and skips the booking.
- **First Python run may need 1–2 import tweaks.** LiveKit Agents 1.x event names occasionally change between minor versions. If `session.on("user_input_transcribed")` errors, check the installed package's available events and adjust.
