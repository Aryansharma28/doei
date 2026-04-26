# doei

> **Dutch for "bye" — as in, bye debt.**
> An AI debt coach for people in the Netherlands drowning in letters from Belastingdienst, CJIB, the gemeente, and incassobureaus.

**🎯 Try it live (mobile-first): [doei-alpha.vercel.app/app](https://doei-alpha.vercel.app/app)**

---

## The problem

In the Netherlands, **1 in 5 households** is in problematic debt. The system is fragmented by design — Belastingdienst, CJIB, DUO, CAK, the gemeente, your zorgverzekeraar, your verhuurder, and a parade of incassobureaus all send paper letters with their own deadlines, fees, and escalation paths. People miss aanmaningen, get hit with verhogingen and incassokosten, end up with bailiffs at the door.

There is no single screen that tells you: **"this is what you owe, this is what's most urgent, and this is the one thing you should do today."**

That's `doei`.

## What it does

- 📥 **Drop a debt letter** (PDF or photo) → Claude reads it → debt appears with creditor, amount, due date, and urgency level auto-filled. Lands you on the new debt's screen with the letter attached.
- 🚨 **Triage** — every debt is auto-classified by escalation signals: sommatie / overdue / fees added / public-creditor garnishment power / huur eviction risk / CAK wanbetalersregeling threshold. Critical debts surface to the top.
- 🧠 **"Wat is dit?" / "Wat moet ik doen?"** — for every debt, Claude reads the letter content and produces a 2-sentence plain-language explanation + a prominent CTA ("Bel Intrum vandaag op 088-7868911") + 2 supporting actions, quoting deadlines from the letter itself, not making them up.
- 💬 **Chat with Doei** — full context of your debts and income. Multi-debt pay plans get rendered as ranked iDEAL action cards. Speaks NL or EN.
- 📞 **Call Doei** — voice agent (LiveKit + Deepgram + Cartesia) names itself Doei, answers "Hey Doei", remembers past calls, can book a follow-up on your Google Calendar.
- 🏛️ **Recognizes Dutch debt vocabulary** — sommatie, aanmaning, beslagvrije voet, betalingsregeling, schuldhulpverlening, ontbinding, BKR-melding — all surfaced in plain spoken language.

## Wow moments worth demoing

| Moment | Why it lands |
|---|---|
| Drop a CJIB sommatie PDF on the screen → 3 seconds → debt detail page with letter attached, urgent CTA visible | The whole pipeline (storage → vision OCR → debt insert → linked document → AI summary) in one motion |
| "Hey Doei, what's my biggest debt right now?" on a voice call | Real voice-to-voice with full debt context |
| Open the Intrum debt → see "Sommatie van incassobureau voor T-Mobile vordering. Last warning before court — pay €445 before April 27 or bailiff action starts." | Compare against a generic "this is a debt" summary — this is reading the actual letter body |
| Switch language NL ↔ EN — every screen flips, including AI responses | Real i18n, not a half-job |

## How it works

```
Letter (PDF/photo)
  └── Supabase Storage (per-user folder)
       └── /api/document/analyze (Claude Sonnet 4.6 vision)
            └── { creditor, amount, dueDate, stage, notes, extracted_text }
                 ├── debts row inserted (Supabase, RLS-scoped to auth.uid)
                 └── documents row linked to debt + extracted_text saved

Debt detail screen
  └── reads debt + attached docs.extracted_text
       └── /api/advisor (Claude Haiku 4.5)
            ├── "What this is" (2 sentences, urgency-calibrated)
            └── "What to do" (CTA + 2 supporting actions, quoting letter deadlines)

Voice call
  └── /api/voice/token (issues LiveKit token)
       └── voice-agent/ Python worker (Deepgram STT + Claude + Cartesia TTS)
            ├── named "Doei", responds to wake-name
            ├── reads past_calls table for continuity
            └── can call schedule_followup_call → Google Calendar
```

## Stack

- **Frontend:** React 18 + Vite, no component library — bespoke design tokens in `src/schuld/styles/styles.js`
- **Backend:** Vercel serverless (Node) for HTTP routes, Python LiveKit worker for voice
- **Data:** Supabase Postgres with RLS on every table; Supabase Storage for letters
- **AI:** Anthropic Claude (Sonnet 4.6 vision for documents, Haiku 4.5 for fast per-debt cards, Sonnet 4.6 for chat + voice)
- **Voice:** LiveKit (transport) + Deepgram (STT) + Cartesia (TTS)
- **Observability:** LangWatch traces on every AI call
- **Integrations:** Google OAuth (Gmail readonly + Calendar.events) for letter ingest + follow-up booking

## Run it

```bash
npm install
npm run dev          # frontend on :5173
npx vercel dev       # frontend + API routes locally
```

For voice:

```bash
cd voice-agent
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python agent.py dev  # LiveKit worker
```

To regenerate the 13 mock Dutch debt letters used for the demo seed:

```bash
python3 scripts/generate_mock_debt_letters.py
```

## Env vars

```env
# AI
ANTHROPIC_API_KEY=
LANGWATCH_API_KEY=

# Supabase (server)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_MCP_TOKEN=

# Google OAuth (Gmail readonly + Calendar.events scopes)
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
CRON_SECRET=

# LiveKit voice
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
DEEPGRAM_API_KEY=
CARTESIA_API_KEY=

APP_URL=http://localhost:5173
```

## API routes

| Route | What it does |
|---|---|
| `POST /api/advisor` | Chat with Doei (system prompt has full debt + income context) |
| `POST /api/document/analyze` | Vision OCR → structured debt fields + extracted text |
| `POST /api/voice/token` | Mint LiveKit access token for an authenticated user |
| `POST /api/voice/end-call` | Persist transcript + AI-generated summary |
| `POST /api/gmail/connect` | Save user's Google refresh token after OAuth |
| `GET /api/gmail/status` | Is Gmail connected, with which email |
| `POST /api/gmail/sync` | Run Gmail MCP search → flag debt emails as suggested debts |
| `POST /api/gmail/disconnect` | Remove Google connection |
| `GET /api/cron/gmail-sync` | Daily 06:00 UTC sweep across all connected users |

## Supabase schema

| Table | Purpose |
|---|---|
| `debts` | Source of truth for user debts (RLS by `user_id`) |
| `documents` | Letter attachments per debt + extracted text (RLS by `user_id`) |
| `suggested_debts` | Pending suggestions from Gmail/bank ingest awaiting user accept |
| `bank_connections` | Mock PSD2 connection records |
| `gmail_connections` | Per-user Google refresh tokens |
| `calls` | Voice-call transcripts + AI summaries (powers continuity across calls) |
| `scheduled_calls` | Booked follow-up calls + Google Calendar event IDs |

RLS is on by default everywhere. Service role is only used in API routes; the browser client uses the anon key.

## What we built during the hackathon

- Migrated debts from `localStorage` → Supabase with RLS, refactored every read/write
- Added `documents.extracted_text` so the AI quotes letter body, not just metadata
- Generated 13 realistic Dutch vendor PDFs (8 distinct templates: government letter / utility bill / debt-collector sommatie / BNPL app-style / housing / bank / insurance / CJIB-yellow) for live demos
- Wired up the LiveKit voice worker, named the AI **Doei**, taught both chat and voice to recognize "Hey Doei"
- Per-debt urgency-signal engine that reads notes + letter body to flag sommatie / overdue / public-creditor garnishment / eviction / CAK 6-month threshold
- Restructured the debt detail screen around two cards: "Wat is dit?" (what + urgency, 2 sentences) and "Wat moet ik doen?" (CTA + supporting actions)
- Auto-navigate from add-debt → debt detail with the just-uploaded letter attached
- Pay-plan card refactor: each item is its own honest action (clickable iDEAL deeplink when one exists, "betaal via je bank" plain row otherwise)

## Roadmap (next 2 weeks)

- [ ] **"What if I do nothing" projection** — animated 90-day timeline showing fees compound on overdue debts
- [ ] **Debt-free simulator** — slider for monthly capacity, live snowball/avalanche chart
- [ ] **Real PSD2 bank connect** (currently mocked) via Tink or Salt Edge
- [ ] **DigiD + SchuldenWijzer + Vorderingenoverzicht Rijk** ingest for verified public-creditor debts
- [ ] **In-browser wake-word** ("Hey Doei" without tapping the call button) via Porcupine
- [ ] **Auto-draft hardship letter** for public creditors → downloadable PDF
- [ ] **Verified app status with Google** so the Gmail connect doesn't silently strip scopes for non-test users

## Codebase notes

- No component library, no Tailwind — design tokens in CSS vars (`--paper-0/1/2/3`, `--ink-0/1/2/3`, `--accent`, `--stable/warning/action-fg/bg/tint`)
- Page transitions via the `screen-in` class (CSS keyframes in `globalCSS`)
- Multi-creditor flow logic is centralized in `src/schuld/constants/creditors.js` — adding a new creditor type is one row
- The chat advisor's system prompt is the canonical place to evolve the AI's behavior; the voice prompt mirrors its structure in `voice-agent/prompts.py`

## Credits

Built for [hackathon name] — Aryan Sharma, with substantial pair-coding by Claude Sonnet 4.6 via Claude Code.

Inspired by everyone in NL who has ever opened a blue envelope and felt their stomach drop.
