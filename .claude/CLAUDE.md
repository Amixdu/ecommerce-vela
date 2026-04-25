# E-commerce App Context
An e-commerce app with a web and mobile frontend and a separate backend

# Stack
- **Web Frontend:** Next.js (App Router, React Server Components)
- **Mobile Frontend:** Expo (React Native)
- **Backend/API:** Medusa.js (Node.js)
- **Database & ORM:** PostgreSQL with Drizzle ORM
- **Styling:** Tailwind CSS + shadcn/ui
- **Auth & Payments:** Clerk (Auth) + Stripe Elements (Payments)

# Architecture: Loosely Coupled Monorepo
We are using a Turborepo monorepo, but with strict boundaries to allow future Polyrepo separation.
- **Rule 1:** Strict Network Boundaries. `web` and `mobile` MUST NEVER directly import files from `backend`. Communication is strictly via HTTP/API.
- **Rule 2:** Restrict `packages/`. DO NOT create shared UI component libraries in `packages/`. Keep `packages/` strictly limited to shared TypeScript types (`packages/types`) and pure utility functions (`packages/utils`).
- **Rule 3:** Independent Tooling. Do not hoist `.env`, `eslint`, or `tsconfig` entirely to the root. Each app must be self-sufficient so it can be dragged out into its own repository later without breaking.

# Build & Run Commands
- Web Dev Server: `npm run dev:web` (Next.js on port 3000)
- Mobile Dev Server: `npm run dev:mobile` (Expo)
- E-commerce Backend: `npm run dev:backend` (Medusa/API layer)
- Database Studio: `npm run db:studio` (Drizzle/Prisma)

# Code Style & UI
- **Next.js App Router:** Default to React Server Components (RSC). Use `'use client'` only at the lowest possible leaf components.
- **Styling:** Use Tailwind CSS. Leverage `shadcn/ui` components inside `apps/web/components/ui/` (do not put these in `packages/`).
- **Data Mutation:** Use Next.js Server Actions for web form submissions.

# Security & Gotchas
- Never mock Clerk authentication headers manually; use the Clerk testing tokens in `.env.local`.
- Never store or log Stripe PANs. Rely strictly on Stripe Elements.

# Workflow
- Run targeted tests over full suites: `npm run test -- <filename>`

# Important
Doo not try to read env files under any circumstance