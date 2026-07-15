# Kensho — Operating System for Modern Martial Arts Dojos

## What is this project

Kensho is a full-stack SaaS platform designed to run a martial arts dojo end-to-end: student management, class scheduling, belt progression, payments, and analytics.

**Meaning of the name**: Kensho (見性) is a Japanese Zen term meaning "seeing one's true nature" or "clear vision". The app gives dojo owners clear visibility into every aspect of their business.

## Business context

- **Target user**: dojo owners, martial arts school administrators, sensei running their own studios
- **Primary use cases**: manage student lifecycle, track attendance, run classes, process payments, track belt progression, manage inventory
- **Business model**: This project is currently a portfolio showcase for Veridis Dev (veridisdev.com). Originally built for a real Colombian karate dojo, now rebranded as a generic demo product.

## Historical context (important)

This project was originally called **Budokan** and was built for a specific karate dojo (name kept confidential). It is now being **rebranded to Kensho** as part of the Veridis Dev portfolio launch. Some strings, files, and references may still say "Budokan" — these should be updated to "Kensho" as part of the current work.

**IMPORTANT**: This is a portfolio project. The original client's real data, branding, and identifying information must remain private. Use only fictional/demo data in seeds, examples, and public artifacts.

## Tech stack

### Frontend (`/frontend`)
- **React 19.2** with Vite 8
- **Tailwind CSS 3.4** (NOT v4 — don't upgrade)
- **React Router 7** for navigation
- **Zustand 5** for state management
- **React Hook Form + Zod** for forms
- **Axios** for HTTP requests
- **Lucide React** for icons
- **JavaScript** (NOT TypeScript — don't migrate)
- **Deployed on Vercel**

### Backend (`/backend`)
- **Node.js + Express 5** (latest major version)
- **Prisma 5.22 ORM** with PostgreSQL
- **JWT + bcryptjs** for authentication
- **Jest 30 + Supertest** for testing
- **JavaScript** (NOT TypeScript)
- **Deployed on Railway** (Nixpacks config)

### Infrastructure
- Frontend hosted on Vercel
- Backend hosted on Railway
- PostgreSQL database hosted on Railway
- CI/CD via GitHub Actions (see `.github/`)

## Current state (as of July 2026)

- Project is functional and deployed to production
- Has been running for ~4 months (last deploy 3 months ago at time of rebranding)
- Rebranded from Budokan to Kensho on July 15, 2026
- **Ready for**: agentic documentation, visual improvements, professionalization for portfolio
- **NOT ready for**: fundamental architecture changes, TypeScript migration, major refactors

## Agentic workflow

This project uses a specialized team of AI agents (see `.claude/agents/`). Each agent has a specific role:

### Engineering agents (8)
- `engineering-codebase-onboarding-engineer` — first-pass analysis of any unfamiliar code
- `engineering-software-architect` — evaluate architecture decisions
- `engineering-senior-developer` — implement features and improvements
- `engineering-frontend-developer` — frontend-specific work (React + Tailwind)
- `engineering-code-reviewer` — review any PR before merging
- `engineering-technical-writer` — documentation, README, ADRs
- `engineering-git-workflow-master` — branching, commits, PR strategy
- `engineering-security-engineer` — auditing auth, data handling, secrets

### Design agents (3)
- `design-ui-designer` — visual UI improvements
- `design-ux-architect` — user flows, interaction design
- `design-brand-guardian` — visual consistency across the product

### Product agents (1)
- `product-manager` — think from the dojo owner's perspective

### Testing agents (4)
- `testing-test-results-analyzer` — analyze test coverage and quality
- `testing-accessibility-auditor` — WCAG compliance
- `testing-performance-benchmarker` — measure and improve performance
- `testing-api-tester` — validate backend endpoints

### When to use which agent
Trust Claude Code to select the right agent based on task context. When in doubt, start with `engineering-codebase-onboarding-engineer` for any new analysis, or `product-manager` for anything customer-facing.

## Global skills available

The following skills are installed globally in `~/.claude/skills/` and available in any Claude Code session:

- **`frontend-design`** — enforces distinctive, non-generic UI decisions
- **`brand-guidelines`** — coherence across visual artifacts
- **`test-driven-development`** — RED-GREEN-REFACTOR discipline
- **`webapp-testing`** — Playwright-based testing for the frontend
- **`taste-skill`** — reference on aesthetic decisions

## Coding principles

1. **JavaScript first** — no TypeScript migration. Keep the current stack.
2. **Tailwind 3.4 only** — do NOT upgrade to Tailwind 4.x. Breaking changes.
3. **Prisma migrations** — never modify the database schema without a migration.
4. **Test before merging** — Jest tests must pass. Add tests when adding features.
5. **Small commits** — one logical change per commit, clear message.
6. **Minimal dependencies** — before adding a new library, justify why existing tools can't do the job.

## Constraints for AI agents

- **Do not migrate to TypeScript**. Explicitly rejected decision.
- **Do not upgrade Tailwind to 4.x**. Explicitly rejected.
- **Do not commit secrets**. Check `.gitignore` before committing anything from `.env` or credentials.
- **Do not include real dojo data**. All example data must be generic/fictional.
- **Do not break the existing production deploy**. Test locally before pushing to main.

## References

- **Parent agency**: Veridis Dev (https://veridisdev.com)
- **Repo**: https://github.com/dacq7/kensho
- **Related projects** (also part of Veridis portfolio):
  - Itza Beauty (private, e-commerce for beauty brand)
  - BarberOS (barbershop management)
  - Trucking CRM (fleet management)

## Common tasks and where to start

### If a user wants to understand the codebase
Start with `engineering-codebase-onboarding-engineer`. Read `/frontend/package.json`, `/backend/package.json`, and the Prisma schema first.

### If a user wants to improve visuals
Use `design-ui-designer` + `frontend-design` skill together. Focus on: consistency, professional aesthetics, mobile responsiveness. Do NOT introduce generic AI patterns (Inter font, purple gradients, generic cards).

### If a user wants to add tests
Use `test-driven-development` skill + `testing-test-results-analyzer` agent. Backend uses Jest + Supertest. Frontend testing may need setup (currently no test framework configured).

### If a user wants to document the project
Use `engineering-technical-writer` agent. Update README.md, create ADRs in `/docs/`, generate architecture diagrams.

### If a user wants to fix bugs or add features
Use `engineering-senior-developer`. Always: understand the context first, write tests, small commits, PR before merge to main.
