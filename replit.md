# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts in this project

### `resume-analyzer` (web app) — AI Resume Analyzer "ResumeCoach"
React + Vite frontend at `/`. Authenticated experience for job seekers: upload a PDF resume, get an honest ATS score, AI-written improvements, and a personalized 3-week roadmap toward best-fit roles.

- **Auth**: Clerk (Replit-managed) — Google OAuth + email OTP via standard Clerk sign-in/up flow. Sign-in/up at `/sign-in` and `/sign-up` with custom theming.
- **Pages**: `/` landing (signed-out) → `/dashboard` (stats), `/upload` (drag-drop PDF), `/resumes` (list), `/resumes/:id` (full analysis report with radial ATS chart, sub-scores, missing keywords, weak areas, improved bullets, top role matches with 3-week roadmaps).
- **Charts**: recharts (RadialBarChart for ATS, horizontal bar charts for role matches and sub-scores).
- **Frontend deps of note**: `@clerk/react`, `@clerk/themes`, `recharts`, `react-dropzone`.

### Backend (`api-server`)
- **AI**: OpenAI via Replit AI Integrations proxy (`gpt-5.4`, structured JSON output). Two-call pipeline: (1) full resume analysis (scoring, skills extraction, improved bullets, top role picks), (2) targeted 3-week roadmaps for the top 5 roles.
- **PDF parsing**: `unpdf` (no native deps).
- **DB**: `resumes` table with all analysis fields stored as JSONB. Per-user filtering by Clerk `userId`.
- **API endpoints (under `/api`)**:
  - `GET/POST /resumes`, `GET/DELETE /resumes/:id`, `POST /resumes/:id/analyze`
  - `GET /jobs/roles` — predefined catalog of 10 job roles with core/nice-to-have skills
  - `GET /stats/summary` — dashboard aggregates (totals, averages, top role matches across user's resumes)
  - `GET /healthz`
- **Auth middleware**: `requireAuth` enforces Clerk session on all `/resumes` and `/stats` routes.

### Predefined job role catalog (`artifacts/api-server/src/lib/jobRoles.ts`)
10 roles spanning Engineering, Data, AI/ML, Infrastructure, Product, Design, Mobile. Used both for AI role recommendations and for the `/jobs/roles` endpoint surfaced on the landing page and upload screen.
