# DUTA AI

DUTA AI is a trusted digital platform for Indonesians living abroad. Phase 1
focuses on Indonesians living in Malaysia, while the foundation is designed to
support additional countries later.

## Current scope

This repository currently contains the production-ready application foundation
only. Advanced DUTA modules, database integration, authentication, and real
production data are intentionally deferred.

## Technology

- Next.js App Router and TypeScript
- Tailwind CSS
- PostgreSQL and Supabase (planned, not connected)
- Vercel (planned deployment)
- GitHub (planned source control remote)

## Local development

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Project structure

```text
docs/                 Project status and decisions
public/               Static assets
src/app/              Routes, metadata, and global styles
src/components/layout Shared page structure
src/components/ui     Reusable interface building blocks
src/config/            Central application configuration
```

Environment variables are documented in `.env.example`. Never commit `.env.local`
or credentials.
