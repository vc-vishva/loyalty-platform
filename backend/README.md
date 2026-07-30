# Co-working Booking — Backend API

REST API for the Co-working Space Desk & Room Booking System. Members book
desks / meeting rooms for time slots; admins manage inventory, approve/reject
bookings, block maintenance windows, and the system prevents double-booking
conflicts at the **database level**.

## Tech stack

| Concern     | Choice                                   |
| ----------- | ---------------------------------------- |
| Language    | TypeScript (ESM, `strict`, no `any`)     |
| Framework   | Express 5                                |
| ORM / DB    | Prisma 7 + PostgreSQL                    |
| Validation  | Zod                                      |
| Auth        | JWT access + refresh (rotating, DB-backed) |
| Passwords   | bcrypt                                   |
| Rate limit  | express-rate-limit (auth endpoints)      |
| Logging     | Winston + Morgan                         |

## Prerequisites

- Node.js >= 20
- PostgreSQL (a `docker-compose.yml` is included, or use a local instance)

## Quick start

```bash
# 1. Start PostgreSQL (or point DATABASE_URL at your own)
docker compose up -d

# 2. Install deps
npm install

# 3. Env
cp .env.example .env      # adjust DATABASE_URL / JWT_SECRET as needed

# 4. Generate client + apply migrations + seed demo data
npm run prisma:generate
npm run prisma:deploy     # applies migrations (incl. the exclusion constraint)
npm run prisma:seed       # demo admin + member + spaces

# 5. Run the API (http://localhost:3000, routes under /v1)
npm run dev
```

**Seed credentials** (password `Password123`): `admin@cowork.dev` (admin),
`member@cowork.dev` (member).

## Environment variables

| Variable                        | Description                             |
| ------------------------------- | --------------------------------------- |
| `NODE_ENV`                      | `development` \| `production` \| `test` |
| `PORT`                          | API port (default 3000)                 |
| `DATABASE_URL`                  | PostgreSQL connection string            |
| `JWT_SECRET`                    | Secret used to sign JWTs                |
| `JWT_ACCESS_EXPIRATION_MINUTES` | Access token lifetime (default 15)      |
| `JWT_REFRESH_EXPIRATION_DAYS`   | Refresh token lifetime (default 7)      |

Env vars are validated with Zod at startup (`src/config/config.ts`) — the app
refuses to boot if any required value is missing.

## npm scripts

| Script                   | Description                             |
| ------------------------ | --------------------------------------- |
| `npm run dev`            | API with reload (tsx watch)             |
| `npm run build`          | Generate client + compile to `dist/`    |
| `npm start`              | Run compiled API                        |
| `npm run typecheck`      | `tsc --noEmit` (strict, zero `any`)     |
| `npm run prisma:deploy`  | Apply migrations (prod-safe)            |
| `npm run prisma:migrate` | Create & apply a migration (dev)        |
| `npm run prisma:seed`    | Seed demo data                          |
| `npm run prisma:studio`  | Prisma Studio DB GUI                    |

## API

Base path `/v1`. Shared response envelope:

```json
{ "status": true, "statusCode": 200, "message": "...", "data": {}, "error": [] }
```

Roles: **visitor** = unauthenticated (public reads), **member**, **admin**.

### Auth (rate-limited)
| Method | Endpoint         | Access | Body |
| ------ | ---------------- | ------ | ---- |
| POST   | `/auth/register` | Public | `name, email, password, role?(member\|admin)` → user + tokens |
| POST   | `/auth/login`    | Public | `email, password` → user + tokens |
| POST   | `/auth/refresh`  | Public | `refreshToken` → new rotated token pair |
| POST   | `/auth/logout`   | Auth   | `refreshToken` → revoked |

Tokens are returned as `{ access: {token, expires}, refresh: {token, expires} }`.
Refresh tokens are persisted and **rotated** (single-use) on every refresh.

### Spaces
| Method | Endpoint                      | Access | Notes |
| ------ | ----------------------------- | ------ | ----- |
| GET    | `/spaces`                     | Public | `page, limit, search, type, capacity, date`; pagination |
| GET    | `/spaces/:id`                 | Public | details |
| GET    | `/spaces/:id/availability?date=YYYY-MM-DD` | Public | calendar feed (bookings + maintenance for the day) |
| POST   | `/spaces`                     | Admin  | `name, type, capacity, description, amenities?` |
| PUT    | `/spaces/:id`                 | Admin  | partial update |
| DELETE | `/spaces/:id`                 | Admin  | |
| POST   | `/spaces/:id/maintenance`     | Admin  | `startTime, endTime, reason` |

### Bookings
| Method | Endpoint                 | Access | Notes |
| ------ | ------------------------ | ------ | ----- |
| POST   | `/bookings`              | Member | `spaceId, startTime, endTime` → pending |
| GET    | `/bookings/my`           | Member | own bookings |
| GET    | `/bookings/:id`          | Member | own booking (404 otherwise) |
| PATCH  | `/bookings/:id/cancel`   | Member | cancel own future pending/approved |
| GET    | `/bookings`              | Admin  | filter `status, date, spaceId`; pagination |
| PATCH  | `/bookings/:id/approve`  | Admin  | approve → auto-reject overlapping pendings |
| PATCH  | `/bookings/:id/reject`   | Admin  | `reason?` |

### Maintenance
| Method | Endpoint            | Access | Notes |
| ------ | ------------------- | ------ | ----- |
| DELETE | `/maintenance/:id`  | Admin  | remove a block (creation is under `/spaces/:id/maintenance`) |

## Concurrency & double-booking prevention

This is the core requirement, enforced at the **database level**:

- A PostgreSQL **GiST exclusion constraint** (`bookings_no_overlap`, migration
  `20260730000100_booking_no_overlap`) forbids two **approved** bookings for the
  same space from having overlapping `[startTime, endTime)` ranges. Even under two
  simultaneous approval requests, at most one can commit — the other fails with
  SQLSTATE `23P01`, which the service translates to `409 Conflict`.
- Approval runs inside a **Serializable transaction** that flips the booking to
  `approved` and auto-rejects every other overlapping pending booking.
- **Booking model (deliberate design):** multiple members may hold overlapping
  *pending* requests for the same slot; the admin approves one, which auto-rejects
  the rest. Creating a booking that overlaps an already-**approved** slot is
  rejected up front with `409`. This resolves the spec's two rules
  (“can’t overlap an approved slot” + “approving auto-rejects overlapping
  pendings”) into one coherent, demonstrable workflow.

## Validation, errors, security

- **Input validation** on every write endpoint via Zod (`src/validations`),
  including `startTime < endTime` and no past-dated bookings.
- **Centralized error handling** (`src/middlewares/error.ts`) → consistent JSON.
- **Rate limiting** on `/auth/*` (20 requests / 15 min per IP; successful logins
  are not counted).
- **Indexes** on space `type`/`capacity` and booking `spaceId+startTime+endTime`,
  `memberId`, `status` for search/filter/date-range queries.
- Passwords hashed with bcrypt; `helmet`, `cors`, `compression` enabled.

## Notification stub (bonus)

`src/services/notification.service.ts` is invoked on every booking status change
(create/approve/reject/cancel) and logs the message that would be emailed — a
clean seam to later swap for a real transport.

## Project structure

```
src/
  config/        env (Zod-validated), prisma client, logger, messages, token types
  controllers/   request/response handling only
  services/      business logic + data access
  middlewares/   authenticate, requireRole, validate, error, rateLimiter
  validations/   Zod schemas
  utils/         ApiError, catchAsync, response + auth helpers
  types/         per-module TypeScript types
  routes/v1/     versioned routes
prisma/
  schema.prisma  User, RefreshToken, Space, Booking, MaintenanceBlock
  migrations/    init + booking_no_overlap (exclusion constraint)
  seed.ts        demo data
```
