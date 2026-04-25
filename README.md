# doei

A mobile-first debt management app for people dealing with debt collection in the Netherlands. The name "doei" (Dutch for "bye") reflects the goal: get out of debt and say goodbye to it.

## What we're building

A simple, friendly tool that helps users:

- **Track all their debts** — creditor, amount, due date, status, and escalation stage
- **Upload documents** — scan letters or take photos of debt collection notices directly from your phone
- **Get AI-powered advice** — a built-in financial advisor (powered by Claude) that understands your full debt situation and gives personalised guidance in Dutch or English
- **Stay on top of deadlines** — alerts for upcoming due dates and escalating debts
- **Log creditor communications** — keep a mail/letter history per debt

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + React Router v7 + Vite |
| Backend / DB | Supabase (PostgreSQL + Storage) |
| AI advisor | Anthropic Claude (claude-sonnet) |
| AI observability | LangWatch |
| i18n | Dutch + English |

## Getting started

```bash
npm install
npm run dev
```

Set the following environment variables (create a `.env` file):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ANTHROPIC_API_KEY=
VITE_LANGWATCH_API_KEY=
```

## Key features

- **Camera capture on mobile** — tap "Foto nemen" inside a debt to open your camera and photograph a letter directly
- **Debt escalation tracking** — debts move through stages (aanmaning → incasso → deurwaarder → rechtbank) with visual indicators
- **AI advisor** — chat with a Claude-powered assistant that knows your debts, income, and situation
- **Responsive** — works on phone and desktop; bottom nav on mobile, sidebar on desktop
