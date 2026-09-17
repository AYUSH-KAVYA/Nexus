# Nexus — Coordination Intelligence System

A full-stack web application for multi-stakeholder construction and interior design project coordination. Nexus makes "what does this change affect?" a computable, automatic answer via a dependency graph — replacing manual coordination with an automated Impact Engine.

## Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Neon)

## Quick Start

### 1. Database Setup

Create a Neon project at [neon.tech](https://neon.tech) and get your connection string.

```bash
# Create the .env file
cp server/.env.example server/.env
# Edit server/.env and set your DATABASE_URL
```

Run the schema migration and seed data:
```bash
cd server
psql "$DATABASE_URL" -f migrations/001_schema.sql
psql "$DATABASE_URL" -f seeds/seed.sql
```

### 2. Backend

```bash
cd server
npm install
npm run dev   # Starts on http://localhost:5000
```

### 3. Frontend

```bash
cd client
npm install
npm run dev   # Starts on http://localhost:5173
```

### 4. Demo Login

The seed data includes three users (all with password `password123`):

| Email | Role | Access |
|-------|------|--------|
| `sarah@nexus.dev` | Admin | Full access — create projects, manage everything |
| `mike@nexus.dev` | PM | Project Manager — manage tasks, approve changes |
| `priya@nexus.dev` | Stakeholder | View only — can propose changes for review |

## Architecture

```
server/
├── src/
│   ├── index.js              # Express app entry
│   ├── config/db.js          # PostgreSQL pool (Neon)
│   ├── middleware/
│   │   ├── auth.js           # JWT verification
│   │   └── rbac.js           # Role + project access checks
│   ├── engine/
│   │   ├── impact.js         # BFS Impact Engine + blast radius
│   │   └── bottleneck.js     # Critical path detection
│   ├── routes/               # All API routes
│   └── utils/errors.js       # Error handling
├── migrations/001_schema.sql # Database DDL
├── seeds/seed.sql            # Whitfield Residence demo data
└── tests/impact.test.js      # Impact engine unit tests

client/
├── src/
│   ├── pages/                # 10 page components
│   ├── components/           # Reusable UI + feature components
│   ├── contexts/             # Auth context (JWT)
│   ├── hooks/                # useAuth, useApi
│   ├── layouts/              # App + Auth layouts
│   └── api/client.js         # Axios instance with JWT
└── tailwind.config.js        # Design tokens
```

## Core Concepts

### Impact Engine
When a change is committed, the engine runs BFS through the dependency graph to find all downstream tasks, stakeholders, and approval gates affected. The **Blast Radius Score** quantifies impact:

```
Score = directTasks + (indirectTasks × 0.5) + (approvalGatesReopened × 2)
```

- 🟢 **Low** (< 3): Minor, localized change
- 🟡 **Medium** (3–6): Moderate cross-team impact
- 🔴 **High** (> 6): Major cascading effect

### Change Workflow
- **PM/Admin**: Changes commit immediately → Impact Engine runs → alerts fire
- **Stakeholder**: Changes are proposed → PM reviews with "Preview Impact" → Approve/Reject

### RBAC
All authorization enforced at the API level:
- **Admin**: Full access to everything
- **PM**: Manage tasks, dependencies, approvals within their projects
- **Stakeholder**: View-only + propose changes

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login (returns JWT) |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project (admin) |
| GET | `/api/projects/:id/tasks` | List tasks |
| POST | `/api/projects/:id/tasks` | Create task (PM+) |
| POST | `/api/projects/:id/changes` | Propose/commit change |
| GET | `/api/projects/:id/changes/pending` | Pending changes |
| POST | `/api/projects/:id/changes/:id/approve` | Approve change |
| GET | `/api/projects/:id/impact/tasks/:taskId` | Preview impact (dry run) |
| GET | `/api/projects/:id/bottleneck` | Critical path owners |
| GET | `/api/alerts` | My alerts |

## Seed Data — Whitfield Residence

The demo scenario includes:
- **14 stakeholders** across all roles (Client, Architect, Interior Designer, PM, Contractors, Vendors, Consultants)
- **17 tasks** with branching dependencies spanning Living Room, Kitchen, Master Bedroom, Electrical, Plumbing
- **2 approval gates** (Client design approval, Compliance review)
- **2 sample changes** (1 committed with alerts, 1 proposed/pending)
- **23 dependency edges** forming a realistic project DAG

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->

<!-- build-step -->
