# Co-working Space Desk & Room Booking System

A full-stack app where **members** book desks / meeting rooms for time slots and
**admins** manage inventory, approve/reject bookings, block maintenance windows,
and the system **prevents double-booking conflicts** at the database level.

```
backend/    Node + Express + TypeScript REST API (Prisma + PostgreSQL)
frontend/   React + Vite + Axios single-page app
```

## Quick start

### Option A — one command (Docker)

```bash
docker compose up --build
```

- Frontend → http://localhost:8080
- Backend  → http://localhost:3000/v1

Migrations are applied automatically. Register the first user as an **admin**
(the register form lets you pick a role), then create spaces and book them.

### Option B — run locally

**Backend**
```bash
cd backend
docker compose up -d          # PostgreSQL only
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed           # demo admin/member + spaces
npm run dev                   # http://localhost:3000
```

**Frontend** (in a second terminal)
```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173 (proxies /v1 to :3000)
```

**Seed credentials** (password `Password123`):
`admin@cowork.dev` (admin) · `member@cowork.dev` (member).

## Features

**Visitor (public)** — browse spaces with capacity/type/amenities, search by
name, filter by type/capacity/date, paginate, view a space's availability
calendar for any date.

**Member** — register/login (JWT + refresh), book a space for a date + time
slot, view own bookings with status, cancel future pending/approved bookings.

**Admin** — space CRUD, block maintenance windows, view all bookings filtered by
status/date/space, approve/reject requests (approving auto-rejects overlapping
pending requests).

## How double-booking is prevented

A PostgreSQL **GiST exclusion constraint** forbids two *approved* bookings for
the same space from overlapping in time, and approval runs in a **serializable
transaction**. Even under simultaneous requests, a slot ends up with at most one
approved booking. See [`backend/README.md`](./backend/README.md#concurrency--double-booking-prevention)
for the full design.

## Tech

- **Backend:** TypeScript (strict, no `any`), Express 5, Prisma 7 + PostgreSQL,
  Zod validation, JWT access + rotating refresh tokens, rate limiting, centralized
  errors, notification stub on status change.
- **Frontend:** React 18, Vite, React Router, Axios (with refresh-token
  interceptor), responsive custom UI.

## Docs

- Backend API reference & design notes: [`backend/README.md`](./backend/README.md)
- Build plan / checklist: [`TASK.md`](./TASK.md)

## License

MIT
# cowork-booking-system
