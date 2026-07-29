# Multi-Tenant Loyalty Platform API

A backend REST API for a white-label loyalty platform where **multiple businesses**
(tenants) run on the same backend. Each business has its own products, customers and
purchases, and **no business can ever see another's data**. When a customer makes a
purchase, a reward job is queued and processed **asynchronously** by a BullMQ worker.

Built with **TypeScript (strict, no `any`)**, **Express**, **Prisma + PostgreSQL**,
**Redis** (caching), **BullMQ** (async jobs) and **Zod** (validation).

---

## Tech stack

| Concern     | Choice                                  |
| ----------- | --------------------------------------- |
| Language    | TypeScript (ESM, `strict`, no `any`)    |
| Framework   | Express 5                               |
| ORM / DB    | Prisma 7 + PostgreSQL                   |
| Caching     | Redis (ioredis)                         |
| Job queue   | BullMQ (Redis-backed)                   |
| Validation  | Zod                                     |
| Auth        | JWT (admin / customer, tenant-scoped)   |
| Passwords   | bcrypt                                  |
| Logging     | Winston + Morgan                        |

---

## Prerequisites

- Node.js >= 20
- PostgreSQL and Redis — the easiest path is Docker (a `docker-compose.yml` is included).

---

## Quick start

```bash
# 1. Start PostgreSQL + Redis
docker compose up -d

# 2. Install dependencies
npm install

# 3. Create your .env (see the table below)
cp .env.example .env
#    then fill it in — for the bundled docker-compose the values are:
#    NODE_ENV=development
#    PORT=3000
#    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/loyalty_platform?schema=public
#    REDIS_URL=redis://localhost:6379
#    JWT_SECRET=supersecret
#    JWT_ACCESS_EXPIRATION_MINUTES=30
#    JWT_REFRESH_EXPIRATION_DAYS=30

# 4. Generate the Prisma client and run migrations
npm run prisma:generate
npm run prisma:migrate      # or: npx prisma migrate deploy

# 5. Run the API AND the reward worker together (single command)
npm run dev
```

`npm run dev` starts **both** the Express API and the BullMQ worker (via
`concurrently`). The API listens on `http://localhost:3000`; all routes are under
`/v1`.

For production: `npm run build` then `npm start` (also runs API + worker).

---

## Environment variables

| Variable                        | Description                                  |
| ------------------------------- | -------------------------------------------- |
| `NODE_ENV`                      | `development` \| `production` \| `test`      |
| `PORT`                          | API port (default 3000)                      |
| `DATABASE_URL`                  | PostgreSQL connection string (Prisma)        |
| `REDIS_URL`                     | Redis connection string (cache + BullMQ)     |
| `JWT_SECRET`                    | Secret used to sign JWTs                      |
| `JWT_ACCESS_EXPIRATION_MINUTES` | Access token lifetime (minutes)              |
| `JWT_REFRESH_EXPIRATION_DAYS`   | Refresh token lifetime (days)                |

`.env.example` is committed with empty values. Env vars are validated with Zod at
startup (`src/config/config.ts`) — the app refuses to boot if any are missing.

---

## npm scripts

| Script                    | Description                                    |
| ------------------------- | ---------------------------------------------- |
| `npm run dev`             | API + worker with reload (tsx + concurrently)  |
| `npm run build`           | Generate Prisma client + compile to `dist/`    |
| `npm start`               | Run compiled API + worker                      |
| `npm run typecheck`       | `tsc --noEmit` (strict, zero `any`)            |
| `npm run prisma:migrate`  | Create & apply a migration (dev)               |
| `npm run prisma:studio`   | Prisma Studio DB GUI (:5555)                   |

---

## API

Base path: `/v1`. All responses share one envelope:

```json
{ "status": true, "statusCode": 200, "message": "...", "data": {}, "error": [] }
```

### Auth
| Method | Endpoint         | Access | Notes |
| ------ | ---------------- | ------ | ----- |
| POST   | `/auth/register` | Public | `businessId, name, email, password, role(admin\|customer)` → returns JWT (with `businessId`) |
| POST   | `/auth/login`    | Public | `businessId, email, password` → returns JWT |
| POST   | `/auth/logout`   | Public | `refreshToken` |

### Businesses
| Method | Endpoint          | Access | Notes |
| ------ | ----------------- | ------ | ----- |
| POST   | `/businesses`     | Public | `name, slug, rewardUnitValue` |
| GET    | `/businesses/:id` | Public | Cached in Redis (10 min) |

### Products (all tenant-scoped)
| Method | Endpoint        | Access     | Notes |
| ------ | --------------- | ---------- | ----- |
| GET    | `/products`     | Authenticated | List own business's products (Redis cache 5 min, key per business) |
| GET    | `/products/:id` | Authenticated | 404 if it belongs to another tenant |
| POST   | `/products`     | Admin      | Invalidates list cache |
| PUT    | `/products/:id` | Admin      | Invalidates list cache |
| DELETE | `/products/:id` | Admin      | Invalidates list cache |

### Purchases
| Method | Endpoint         | Access   | Notes |
| ------ | ---------------- | -------- | ----- |
| POST   | `/purchases`     | Customer | `productId, quantity` — atomic stock decrement, then **queues** a reward job and returns immediately |
| GET    | `/purchases/my`  | Customer | Own purchases |
| GET    | `/purchases/:id` | Customer | Own purchase only (404 otherwise) |

### Rewards
| Method | Endpoint                  | Access   | Notes |
| ------ | ------------------------- | -------- | ----- |
| GET    | `/rewards/my`             | Customer | Own rewards with source purchase |
| GET    | `/rewards/summary`        | Customer | `totalEarned`, `totalPending`, `netAvailable` |
| GET    | `/rewards/customer/:id`   | Admin    | Any customer **in the admin's business** only |

---

## Multi-tenant isolation (how it is enforced)

Tenant isolation is the core requirement, enforced consistently:

1. **`businessId` is embedded in the JWT.** On register/login the signed token
   payload contains `{ id, businessId, role }`.
2. **The `authenticate` middleware reads `businessId` from the verified token** and
   attaches it to `req.auth = { userId, businessId, role }`. It is taken from the JWT
   **only** — never from the request body or URL params.
3. **Every service query filters by that `businessId`.** Controllers pass
   `req.auth.businessId` into the service layer; products, purchases and rewards are
   all queried with `where: { businessId, ... }`.
4. **Cross-tenant reads return 404, not 403** (e.g. `GET /products/:id` for another
   tenant's product) — we never reveal that another tenant's record exists.
5. **Role checks** via `requireRole('admin' | 'customer')` sit on top of the tenant
   scope (e.g. only admins write products; only customers make purchases).
6. **Email is unique per business** (`@@unique([businessId, email])`), so the same
   email can exist in different tenants; login therefore requires `businessId`.

Net effect: a valid JWT from Business A can never read or mutate Business B's data,
and a customer can never see another customer's purchases/rewards.

## Async reward processing (BullMQ)

- On `POST /purchases` the API validates the product, **atomically** decrements stock
  (a conditional `UPDATE ... WHERE stock >= qty`), creates the purchase, then
  **enqueues** a job on the `reward-processing` queue and returns immediately — reward
  points are **not** calculated in the request.
- **Job payload:** `{ customerId, businessId, purchaseId, purchaseAmount }`.
- **Worker** (`src/workers`) computes `points = floor(purchaseAmount / business.rewardUnitValue)`
  and writes a `Reward` with status `completed`.
- **Failure handling:** on error the reward is marked `failed` and the error is
  rethrown → BullMQ retries up to **3 times** (exponential backoff). After the final
  failed attempt the job stays in the failed / dead-letter set (`removeOnFail: false`)
  and is **not** deleted. Each job logs `job id / customer / business / points / status`.
- The worker runs as its own process alongside the API (`npm run dev` / `npm start`
  start both).

## Reward calculation

`reward_points = floor(purchase_amount / business.reward_unit_value)`. Money
(`price`, `amount`, `rewardUnitValue`) is stored as **integer rupees** so this stays
exact — e.g. ₹100/point with a ₹200 purchase → 2 points.

## Caching strategy

- `GET /businesses/:id` → `business:<id>`, TTL 10 min.
- `GET /products` → `products:<businessId>`, TTL 5 min. **The key includes the
  businessId**, so tenants never share a cache entry. The key is invalidated on every
  product create/update/delete and on purchase (stock changes).

---

## Project structure

```
src/
  config/        env (Zod-validated), prisma & redis clients, logger, messages, tokens
  controllers/   request/response handling only
  services/      business logic + all data access (tenant-scoped)
  middlewares/   authenticate, requireRole, validate, error handler
  validations/   Zod schemas
  queues/        BullMQ connection + reward queue (producer)
  workers/       BullMQ reward worker (consumer)
  utils/         ApiError, catchAsync, response + auth helpers
  types/         per-module TypeScript types
prisma/
  schema.prisma  Business, User, Product, Purchase, Reward
  migrations/
```

**Deviations from the suggested layout (justified):**
- Redis/Prisma clients live in `config/` (next to other config) instead of a separate
  `lib/` — they are configuration singletons.
- `middlewares/` (plural) and additional `validations/` + `utils/` folders are used
  for clarity and to keep controllers thin.
- Routes are versioned under `/v1` (API-versioning best practice); endpoints otherwise
  match the spec.

---

## License

MIT
