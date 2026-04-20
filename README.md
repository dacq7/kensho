# Budokan SKIF — Dojo Management System

Production-ready full-stack web application for managing a karate dojo — students, attendance, payments, insurance policies and equipment inventory.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-budokan--app.vercel.app-black?style=flat-square)](https://budokan-app.vercel.app) [![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev) [![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org) [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-budokan--app.vercel.app-black?style=flat-square)](https://budokan-app.vercel.app) [![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev) [![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org) [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org) [![Tests](https://img.shields.io/badge/Tests-26%20passing-brightgreen?style=flat-square)](https://github.com/dacq7/budokan-app) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
---

## Screenshots

<table>
  <tr>
    <td align="center">
      <img src=".github/screenshots/screenshot-login.png" alt="Login" /><br/>
      <sub>Login Page</sub>
    </td>
    <td align="center">
      <img src=".github/screenshots/screenshot-login-mobile.png" alt="Login Mobile" /><br/>
      <sub>Mobile View</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src=".github/screenshots/screenshot-sensei-dashboard.png" alt="Sensei Dashboard" /><br/>
      <sub>Sensei Dashboard</sub>
    </td>
    <td align="center">
      <img src=".github/screenshots/screenshot-karateca-dashboard.png" alt="Karateca Dashboard" /><br/>
      <sub>Karateca Dashboard</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src=".github/screenshots/screenshot-sensei-karatecas.png" alt="Karatecas" /><br/>
      <sub>Student Management</sub>
    </td>
    <td align="center">
      <img src=".github/screenshots/screenshot-sensei-mensualidades.png" alt="Mensualidades" /><br/>
      <sub>Payment Tracking</sub>
    </td>
  </tr>
</table>

---

## Overview

Budokan SKIF is a production-ready management system built for a real karate dojo and actively used by its sensei and students. It supports two authenticated roles — Sensei (administrator) and Karateca (student) — each with a dedicated dashboard and scoped feature set. The system covers the full operational lifecycle of a dojo: student enrollment, kyu/dan progression tracking, attendance management, monthly fee control, insurance policy monitoring with expiry alerts, and equipment inventory.

---

## Features

<table>
  <tr>
    <td valign="top" width="50%">

**Sensei (Admin)**

- Live dashboard: attendance averages, payment alerts, policy expiry status, inventory warnings
- Student management: full CRUD, kyu/dan rank progression, pre-exam authorization toggle, soft delete (active/inactive)
- Attendance: per-date recording for all students, monthly history with present/absent counts
- Payments: monthly fee registration and void, global fee amount config, mora (overdue) detection after day 5
- Insurance policies: create/edit/delete per student, expiry alerts at 30 days, full policy history per student
- Inventory: equipment tracking with category (protection/instrument) and condition (good/fair/poor)
- Role-based access: all write endpoints are SENSEI-only at the API level

  </td>
  <td valign="top" width="50%">

**Karateca (Student)**

- Personal dashboard: attendance percentage with animated progress bar, payment status, active policy
- Attendance history grouped by month with collapsible detail view
- Full payment history with mora status and pending amount
- Insurance policy with days-remaining countdown and status badge
- Technical content: kata, kumite and kihon requirements specific to current kyu level
- Self-service password change

  </td>
  </tr>
</table>

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + Vite 6 | UI framework and build tool |
| Frontend | Tailwind CSS 3 | Utility-first styling with custom dojo design tokens |
| Frontend | Zustand 5 | Lightweight auth state management with localStorage persistence |
| Frontend | React Hook Form 7 + Zod 4 | Form handling with runtime schema validation |
| Frontend | React Router v7 | Client-side routing with protected route guards |
| Frontend | Lucide React | Consistent icon system |
| Frontend | @fontsource/inter | Self-hosted Inter typeface |
| Backend | Node.js + Express 5 | REST API server |
| Backend | Prisma ORM 5 | Type-safe database client with migration support |
| Backend | PostgreSQL | Relational database |
| Backend | JSON Web Tokens | Stateless authentication |
| Backend | bcryptjs | Secure password hashing |
| Testing | Jest + Supertest | Backend unit and integration tests with mocked Prisma |
| DevOps | Vercel | Frontend hosting with SPA rewrite rules |
| DevOps | Railway | Backend API and PostgreSQL hosting |

---

## Architecture

### Project Structure

```
budokan-app/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Route handlers (auth, karateca, asistencia, mensualidad, poliza, inventario, dashboard, config)
│   │   ├── middlewares/      # JWT auth guard, role-based access control
│   │   ├── routes/           # Express routers
│   │   ├── tests/            # Jest + Supertest test suites
│   │   └── utils/            # JWT helpers, seed scripts
│   ├── docs/
│   │   └── API.md            # Full API reference
│   └── prisma/
│       └── schema.prisma     # 6-model relational schema
└── frontend/
    └── src/
        ├── components/
        │   ├── karatecas/    # KaratecasTable, KaratecasCards, NuevoKaratecaModal, EditarKaratecaModal
        │   └── ui/           # Design system: Input, Button, Badge, Card, Modal, Skeleton, EmptyState
        ├── lib/              # API client (axios), kyu utilities, date utilities
        ├── pages/
        │   ├── karateca/     # Dashboard, Asistencia, Mensualidades, Poliza, Tecnico
        │   └── sensei/       # Dashboard, Karatecas, Asistencia, Mensualidades, Polizas, Inventario
        └── store/            # Zustand auth store
```

### Database Schema

6 Prisma models with the following relationships:

- `User` (1) → (1) `Karateca`
- `Karateca` (1) → (N) `Asistencia`, `Mensualidad`, `Poliza`
- `User` (1) → (N) `Asistencia` (as `registradoPor` — the sensei who recorded attendance)

Enums: `Rol` (`SENSEI` | `KARATECA`), `CategoriaInventario` (`PROTECCION` | `INSTRUMENTO`), `EstadoInventario` (`BUENO` | `REGULAR` | `MALO`)

Notable patterns: soft delete on `Karateca` (`activo` boolean), computed `poliza` `estado` field (`activa` | `por_vencer` | `vencida`) derived at query time, `mesInicioMensualidades` for per-student fee tracking start date.

### Design System

A custom component library was built from scratch under `src/components/ui/`:

- **Design tokens**: three brand colors (negro `#111111`, rojo `#CC0000`, dorado `#C9A84C`) extended into Tailwind config as `dojo.negro` / `dojo.rojo` / `dojo.dorado` / `dojo.surface` / `dojo.subtle`
- **Typography**: Inter (self-hosted via `@fontsource/inter`, weights 400/500/600/700) set as Tailwind's default sans font
- **Components**: `Input` (labeled, error state), `Button` (primary/secondary/ghost, sm/md), `Badge` (gold/success/danger/warning/muted), `Card` (hover lift animation when clickable), `Modal` (focus trap, Escape-to-close, mobile full-screen), `Skeleton` + `SkeletonCard` (pulse animation), `EmptyState` (icon + title + description + optional action)
- All components use only Tailwind utility classes — zero inline styles

### Security

- JWT Bearer authentication on all protected endpoints
- Role-based access control enforced at the middleware level — SENSEI-only routes reject KARATECA tokens with 403
- Passwords hashed with bcryptjs (10 rounds) — never returned in API responses
- Password reset flow requires SENSEI authorization with target `userId`
- Frontend protected routes redirect unauthenticated users to `/login`
- Auth state hydrated from localStorage with a `hydrated` flag to prevent flash of unauthenticated content

### Key Engineering Decisions

- **Monorepo structure**: frontend and backend in a single repo for easier portfolio review and coordinated deploys
- **Prisma over raw SQL**: type-safe queries, automatic migrations, and generated TypeScript types reduce runtime errors
- **Zustand over Redux**: auth state is simple (user + token); Zustand's minimal API avoids boilerplate without sacrificing reactivity
- **Zod on both ends**: frontend forms validate with the same schema constraints as backend — consistent error messages without duplication
- **Timezone-safe date parsing**: a custom `dateUtils.js` parses ISO strings by slicing `YYYY-MM-DD` and constructing `Date(y, m-1, d)` to avoid UTC→local day-shift bugs (UTC-5 Colombia)
- **SPA routing**: `vercel.json` rewrite rule sends all routes to `index.html`, fixing 404 on browser refresh
- **Component split**: `Karatecas.jsx` (originally 617 lines) was split into 4 focused components — `KaratecasTable`, `KaratecasCards`, `NuevoKaratecaModal`, `EditarKaratecaModal` — each under 150 lines

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Git

### Installation

```bash
git clone https://github.com/dacq7/budokan-app.git
cd budokan-app
```

**Backend:**

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npm run dev
```

**Frontend:**

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Environment Variables

**Backend (`.env`):**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `PORT` | Server port (default: 3001) |

**Frontend (`.env`):**

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |

### Demo Seed

```bash
cd backend
node src/utils/seedDemo.js
```
**[→ Open Live Demo](https://budokan-app.vercel.app)**

| Role | Document | Password |
|------|----------|----------|
| Sensei | 11111111 | demo2025 |
| Karateca | 22222222 | demo2025 |

---

## API Documentation

Full API reference: [`backend/docs/API.md`](backend/docs/API.md)

9 route groups — Auth, Karatecas, Asistencia, Mensualidades, Pólizas, Inventario, Dashboard, Config, Health. All protected endpoints require `Authorization: Bearer <token>`. Role enforcement: SENSEI for write operations, both roles for reads.

---

## Testing

```bash
cd backend
npm test
```

26 tests across 2 suites (`auth.test.js` and `karateca.test.js`). Prisma is fully mocked — tests run without a database connection. Covers: input validation, authentication flows, role-protected routes, Prisma error code mapping (`P2002` → 409 Conflict, `P2025` → 404 Not Found), and transaction rollback scenarios.

---

## License

MIT

---

*Built by Diego Correa — [Veridis Dev](https://veridisdev.com) · El Carmen de Viboral, Antioquia, Colombia*
