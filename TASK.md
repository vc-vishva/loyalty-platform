# Loyalty Platform — Build Task List

Multi-tenant loyalty platform REST API. Built feature-by-feature; each feature is one
meaningful commit. Target: **≥ 8 commits**, feature branch `feature/loyalty-platform-api`,
PR to `main`.

## Non-negotiable rules (from the assignment)
- [ ] Node + Express + **TypeScript strict**, **no `any`** anywhere
- [ ] **PostgreSQL** + **Prisma** (no raw SQL / other ORMs)
- [ ] **Redis** caching with correct TTL + invalidation
- [ ] **BullMQ** async reward processing (never sync in the request), retry ×3, dead-letter
- [ ] **Zod** for all request-body validation
- [ ] Tenant isolation: every query scoped to `businessId` **from the JWT** (not body/params)
- [ ] Passwords hashed (bcrypt)
- [ ] `.env.example` committed with **empty values**; `.env` never committed
- [ ] README explains how to run (incl. worker) + tenant-isolation approach
- [ ] ≥ 8 meaningful commits; branch + PR to `main`

## Features (in order)

- [x] **F1 — Swap Joi → Zod** ✅ DONE (keeps existing folder structure)
  All request validations (`validations/*`) and the `validate` middleware moved to Zod;
  env validation in `config/config.ts` moved to Zod. Added deps: zod, bullmq, ioredis.
  _commit: `refactor: replace Joi with Zod for request and env validation`_

- [x] **F2 — Prisma schema & migration** ✅ DONE
  Added `Business`, `Product`, `Purchase`, `Reward` models + `RewardStatus` enum,
  wired relations, `businessId` on `User` (nullable for now → required in F3).
  Migration `add_loyalty_models` applied. Money stored as integer rupees.
  _commit: `feat: add multi-tenant Prisma schema (business, product, purchase, reward)`_

- [x] **F3 — Auth module** ✅ DONE
  Register + login are tenant-aware: `businessId` required, roles `admin|customer`,
  email unique per business, JWT payload embeds `id` + `businessId` + `role`.
  Migration `tenant_aware_auth` applied. Verified register + login end-to-end.
  _commit: `feat: add auth with JWT embedding businessId for tenant scoping`_

- [x] **F4 — Auth & tenant-isolation middleware** ✅ DONE
  `authenticate` verifies the Bearer JWT and sets `req.auth = { userId, businessId, role }`
  (businessId taken from the token, never body/params). `requireRole(...)` guard.
  `/users` now admin-only with businessId from the JWT. Verified 201/401/403.
  _commit: `feat: add JWT authenticate + requireRole tenant-scope middleware`_

- [x] **F5 — Business module** ✅ DONE
  `POST /businesses` (unique slug), `GET /businesses/:id` cached in Redis
  (key `business:<id>`, 10 min TTL). Added Redis client + `REDIS_URL` env.
  `.env.example` rewritten with empty values (assignment rule). Cache verified
  (survives DB row deletion). Redis runs via Docker (`redis:7` on 6379).
  _commit: `feat: add business module with Redis-cached lookup`_

- [x] **F6 — Products module** ✅ DONE
  Full CRUD, all tenant-scoped by JWT businessId. `GET /products` cached per
  business (`products:<businessId>`, 5 min TTL) with invalidation on create/update/delete.
  `GET /products/:id` returns 404 across tenants (never 403). Admin-only writes.
  Verified: CRUD, cross-tenant 404 (GET+PUT), role 403, cache invalidation.
  _commit: `feat: add tenant-scoped products with Redis cache + invalidation`_

- [x] **F7 — Purchases module + reward queue** ✅ DONE
  `POST /purchases` (customer-only): same-tenant product check, atomic stock
  decrement (conditional UPDATE), create purchase, enqueue BullMQ job on
  `reward-processing` (attempts:3, exp backoff, removeOnFail:false), returns
  immediately. `GET /purchases/my`, `GET /purchases/:id` (own only → 404 else).
  Verified: 201/amount, stock decrement, job enqueued, 404 cross-customer, 400
  insufficient stock, 403 admin.
  _commit: `feat: add purchases with atomic stock decrement and queued reward job`_

- [x] **F8 — BullMQ reward worker** ✅ DONE
  Worker on `reward-processing`: `points = floor(amount / rewardUnitValue)`,
  upserts Reward `completed`; on failure marks `failed` + rethrows (retry ×3,
  then dead-letter via removeOnFail:false); logs job id/customer/business/points/status.
  Runs as its own process; `npm run dev`/`start` run API + worker together (concurrently).
  Verified: purchase → worker computed points=2, status=completed (DB confirmed).
  _commit: `feat: add BullMQ reward worker with retry and dead-letter handling`_

- [x] **F9 — Rewards module** ✅ DONE
  `GET /rewards/my` (customer, with source purchase), `GET /rewards/summary`
  (earned = completed points, pending = pending points, net = earned),
  `GET /rewards/customer/:id` (admin, tenant-scoped so no cross-business access).
  Verified: my=2, summary {5,0,5}, admin sees 2, role guards 403.
  _commit: `feat: add rewards endpoints with per-customer summary`_

- [x] **F10 — README & docs** ✅ DONE
  Full README: quick start (docker compose deps + single-command run of API+worker),
  env table, API reference, tenant-isolation explanation, BullMQ job structure,
  reward calc, caching strategy, folder structure + justified deviations.
  Added `docker-compose.yml` (Postgres + Redis).
  _commit: `docs: add README, env table and docker-compose for local run`_

## Bonus (optional, if time)
- [ ] GitHub Actions running `tsc --noEmit` on push
- [ ] Jest integration tests (reward calc; custom reward_unit_value)
- [ ] Bull Board UI at `/admin/queues`
- [ ] Rate limit `POST /auth/login` (5/min/IP)

## Folder structure (keep existing, add as needed)
Existing structure is preserved:
```
src/
  config/        controllers/    services/
  middlewares/   routes/v1/      validations/
  utils/         types/
prisma/schema.prisma
```
New folders added only when their feature lands: `queues/` and `workers/` (F7–F8).
Redis/BullMQ clients go under `config/` next to the existing `prisma` client.
