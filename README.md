# ADHD Learning Companion

A structured, cyclical AI learning companion: explanation → feedback → interest-based
personalization → technical question → answer evaluation → next-stage expansion, repeating.
Originally a Streamlit prototype, rebuilt as a Next.js app deployable on Vercel.

**Live:** https://adhd-learning-companion.vercel.app

## Why this is a *bounded* conversational agent, not a chatbot

The model never drives the conversation. A fixed client-side state machine (`app/page.tsx`)
decides which of five stages is active — `question → feedback → interest → questionPhase →
answer → (back to feedback)` — and only calls the model with a stage-specific system prompt
for that one turn. The LLM produces content within a stage; it never chooses the next stage.

## Stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS
- OpenRouter chat completions API (`google/gemini-2.5-flash-lite`), called **server-side only**
  from `app/api/chat/route.ts` — the API key never reaches the browser.

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in OPENROUTER_API_KEY
npm run dev
```

Open http://localhost:3000.

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import it at https://vercel.com/new.
3. Add environment variable `OPENROUTER_API_KEY` in Project Settings → Environment Variables.
4. Deploy.

## Security note

`OPENROUTER_API_KEY` is read only inside `app/api/chat/route.ts` (a server-side route
handler) and is never sent to the client. `.env.local` is gitignored.

## Disclaimer

Educational tool only. Not a clinical diagnostic system, psychological assessment tool, or
medical intervention platform.
