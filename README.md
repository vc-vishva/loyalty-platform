# Loyalty Platform API

A RESTful authentication & user API built with **TypeScript**, **Express 5**, **Prisma ORM**, and **PostgreSQL**. It provides JWT-based authentication (register / login / logout) and user management, written in strict TypeScript with no `any`.

## Tech Stack

| Concern        | Technology                          |
| -------------- | ----------------------------------- |
| Language       | TypeScript (ESM, strict mode)       |
| Runtime        | Node.js (>= 20)                     |
| Web framework  | Express 5                           |
| ORM / Database | Prisma 7 + PostgreSQL               |
| Auth           | Passport JWT + jsonwebtoken         |
| Validation     | Joi                                 |
| Security       | Helmet, CORS                        |
| Logging        | Winston + Morgan                    |

## Features

- User registration with hashed passwords (bcrypt)
- Login issuing short-lived **access** and long-lived **refresh** JWTs
- Logout (refresh-token invalidation)
- Protected routes via a reusable JWT auth middleware
- Centralized error handling and a consistent JSON response envelope
- Request body validation with Joi
- Fully typed data layer via Prisma-generated types (no `any`)

## Project Structure

```
src/
├── app.ts                # Express app: middleware & route wiring
├── index.ts              # Entry point: DB connect + server bootstrap
├── config/               # env config, Prisma client, passport, logger, etc.
├── controllers/          # request handlers
├── middlewares/          # auth, validate, error handlers
├── routes/v1/            # versioned route definitions
├── services/             # business logic + data access
├── utils/                # ApiError, catchAsync, response helpers
├── validations/          # Joi schemas
└── types/                # ambient / Express type augmentation
prisma/
├── schema.prisma         # database schema (User, Token)
└── migrations/           # generated SQL migrations
prisma.config.ts          # Prisma 7 CLI config (datasource URL)
```

## Getting Started

### 1. Prerequisites

- Node.js >= 20
- PostgreSQL running locally (or a reachable connection string)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy the example file and adjust the values to match your setup:

```bash
cp .env.example .env
```

`.env`:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/loyalty_platform?schema=public"
JWT_SECRET=thisisasamplesecret
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=30
```

### 4. Set up the database

```bash
# create the database (once)
createdb -U postgres loyalty_platform      # or: psql -U postgres -c "CREATE DATABASE loyalty_platform;"

# generate the Prisma client and apply migrations
npm run prisma:generate
npm run prisma:migrate
```

### 5. Run

```bash
# development (auto-reload)
npm run dev

# production
npm run build
npm start
```

The server starts at **http://localhost:3000**.

## NPM Scripts

| Script                    | Description                               |
| ------------------------- | ----------------------------------------- |
| `npm run dev`             | Start in dev mode with auto-reload (tsx)  |
| `npm run build`           | Generate Prisma client + compile to `dist`|
| `npm start`               | Run the compiled app                      |
| `npm run typecheck`       | Type-check without emitting               |
| `npm run prisma:generate` | Generate the Prisma client                |
| `npm run prisma:migrate`  | Create & apply a migration (dev)          |
| `npm run prisma:studio`   | Open Prisma Studio (DB GUI on :5555)      |
| `npm run lint`            | Lint the source                           |

## API

Base path: `/v1`

### Auth

| Method | Endpoint         | Auth | Body                          | Description              |
| ------ | ---------------- | ---- | ----------------------------- | ------------------------ |
| POST   | `/auth/register` | No   | `name, email, password`       | Register a new user      |
| POST   | `/auth/login`    | No   | `email, password`             | Login, returns tokens    |
| POST   | `/auth/logout`   | No   | `refreshToken`                | Invalidate refresh token |

### Users

| Method | Endpoint  | Auth        | Body                          | Description      |
| ------ | --------- | ----------- | ----------------------------- | ---------------- |
| POST   | `/users`  | Bearer JWT  | `name, email, password, role` | Create a user    |

### Response envelope

All responses share a consistent shape:

```json
{
  "status": true,
  "statusCode": 200,
  "message": "User logged in successfully.",
  "data": { },
  "error": []
}
```

### Example

```bash
# Register
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Vishva","email":"vishva@test.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vishva@test.com","password":"password123"}'

# Access a protected route
curl -X POST http://localhost:3000/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"name":"New User","email":"new@test.com","password":"password123","role":"user"}'
```

## License

MIT
