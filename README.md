# E-Commerce Monorepo

A full-stack e-commerce platform with a web storefront, mobile app, and headless backend. Built as a **loosely-coupled Turborepo monorepo** — each app is independently deployable and can be extracted into its own repository without changes.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Development Workflow](#development-workflow)
- [Database](#database)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Payments](#payments)
- [Production Build](#production-build)
- [Project Conventions](#project-conventions)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web frontend | Next.js 14 (App Router, React Server Components) |
| Mobile frontend | Expo (React Native, Expo Router) |
| Backend / API | Medusa.js v2 (Node.js) |
| Database | PostgreSQL 16 |
| ORM | Drizzle ORM (custom tables) + Medusa's built-in ORM |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Clerk |
| Payments | Stripe Elements |
| Monorepo tooling | Turborepo |
| Infrastructure | Docker / Docker Compose |

---

## Repository Structure

```
ecommerce/
├── apps/
│   ├── backend/           # Medusa.js v2 API server (port 9000)
│   ├── web/               # Next.js storefront (port 3000)
│   └── mobile/            # Expo React Native app
├── packages/
│   ├── types/             # Shared TypeScript types
│   └── utils/             # Shared pure utility functions
├── docker-compose.yml     # PostgreSQL + Redis for local dev
├── turbo.json
└── package.json
```

### `apps/backend`

```
apps/backend/
├── src/
│   ├── api/
│   │   ├── middlewares.ts              # Clerk token verification
│   │   └── store/
│   │       ├── wishlist/route.ts       # GET / POST / DELETE /store/wishlist
│   │       └── reviews/[productId]/   # GET / POST /store/reviews/:id
│   ├── db/
│   │   ├── schema.ts                  # Drizzle schema (custom tables)
│   │   └── index.ts                   # Drizzle client
│   └── scripts/
│       └── seed.ts                    # Product seed data
├── medusa-config.ts                   # Medusa project config
├── drizzle.config.ts                  # Drizzle Kit config
└── Dockerfile                         # Production image (build from repo root)
```

### `apps/web`

```
apps/web/src/
├── app/
│   ├── (auth)/                        # Sign-in / sign-up (Clerk)
│   ├── (store)/                       # Store layout with header
│   │   ├── products/                  # Product listing + detail
│   │   ├── cart/                      # Cart page (RSC)
│   │   ├── checkout/                  # Checkout page (RSC + Stripe)
│   │   └── orders/                    # Order history (protected)
│   ├── layout.tsx                     # Root layout — ClerkProvider
│   └── page.tsx                       # Landing page
├── actions/
│   ├── cart.ts                        # Server Actions: add / update / remove
│   └── checkout.ts                    # Server Action: complete order
├── components/
│   ├── layout/Header.tsx
│   ├── store/                         # ProductCard, AddToCartButton, etc.
│   └── ui/                            # shadcn/ui components
├── lib/
│   ├── api.ts                         # Fetch helpers for backend calls
│   └── utils.ts                       # cn() utility
└── middleware.ts                      # Clerk route protection
```

### `apps/mobile`

```
apps/mobile/
├── app/
│   ├── _layout.tsx                    # Root — ClerkProvider + expo-router
│   ├── (tabs)/                        # Tab navigator
│   │   ├── index.tsx                  # Products list
│   │   ├── cart.tsx                   # Cart
│   │   └── account.tsx                # Profile / sign-out
│   ├── (auth)/                        # Sign-in / sign-up screens
│   └── products/[id].tsx              # Product detail
└── src/hooks/
    └── useCart.ts                     # Cart data hook
```

### `packages/`

| Package | Purpose |
|---|---|
| `@ecommerce/types` | Shared TypeScript interfaces: `Product`, `Cart`, `Order`, `User`, `ApiResponse` |
| `@ecommerce/utils` | Pure functions: `formatPrice`, `formatDate`, `slugify`, `isValidEmail`, cart helpers |

---

## Architecture

### Strict network boundaries

`apps/web` and `apps/mobile` **never import files from `apps/backend`**. All communication is over HTTP. This is the key rule that keeps the apps independently deployable.

```
┌─────────────┐     HTTP      ┌──────────────────┐
│  apps/web   │ ──────────── ▶│  apps/backend    │
└─────────────┘               │  (Medusa v2)     │
                               │                  │
┌─────────────┐     HTTP      │  :9000           │
│ apps/mobile │ ──────────── ▶│                  │
└─────────────┘               └──────────────────┘
                                        │
                               ┌────────▼─────────┐
                               │   PostgreSQL      │
                               │   (Docker)        │
                               └──────────────────┘
```

### Shared packages are strictly limited

`packages/` contains **only**:
- TypeScript type definitions (no runtime behaviour)
- Pure utility functions (no framework dependencies)

No shared UI components. `shadcn/ui` components live in `apps/web/src/components/ui/` and are not shared with mobile.

### Each app is self-sufficient

Each app has its own `tsconfig.json`, `eslint` config, and `.env` file. Nothing is hoisted to the root that would prevent an app from being moved to its own repository.

### Custom Drizzle tables alongside Medusa

Medusa v2 manages its own ORM (MikroORM) for core e-commerce tables. Drizzle ORM is used for three additional tables that extend Medusa's model:

| Table | Purpose |
|---|---|
| `custom_customers` | Bridges a Clerk user ID to a Medusa customer ID |
| `wishlists` | Per-customer product wishlist (not in Medusa core) |
| `product_reviews` | Product ratings and reviews |

---

## Prerequisites

- **Node.js** ≥ 20 and **npm** ≥ 10
- **Docker** and **Docker Compose** (for the local database)
- A [Clerk](https://clerk.com) account (free tier is fine)
- A [Stripe](https://stripe.com) account in test mode

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url> ecommerce
cd ecommerce
npm install
```

### 2. Start the database

```bash
npm run db:up
```

This starts PostgreSQL on port `5432` and Redis on port `6379` via Docker Compose. Data is persisted in named Docker volumes between restarts.

### 3. Configure environment variables

Copy the templates and fill in your credentials:

```bash
# Backend
cp apps/backend/.env.template apps/backend/.env

# Web
cp apps/web/.env.local.template apps/web/.env.local

# Mobile
cp apps/mobile/.env.template apps/mobile/.env
```

See [Environment Variables](#environment-variables) for details on each value.

### 4. Run database migrations

```bash
cd apps/backend
npm run db:migrate      # Applies Medusa's built-in migrations
npm run db:push         # Applies custom Drizzle schema
```

### 5. Seed sample data (optional)

```bash
cd apps/backend
npm run seed
```

This creates two product categories and four product variants to get you started.

### 6. Start the apps

Open three terminal tabs from the monorepo root:

```bash
npm run dev:backend     # Medusa API on http://localhost:9000
npm run dev:web         # Next.js storefront on http://localhost:3000
npm run dev:mobile      # Expo dev server (scan QR to open on device)
```

The Medusa admin dashboard is available at `http://localhost:9000/app`.

---

## Environment Variables

### `apps/backend/.env`

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string. Default matches `docker-compose.yml`: `postgres://postgres:password@localhost:5432/ecommerce` |
| `JWT_SECRET` | Min 32-character secret for Medusa JWT tokens |
| `COOKIE_SECRET` | Min 32-character secret for Medusa session cookies |
| `CLERK_SECRET_KEY` | Clerk secret key (`sk_test_…`) — used to verify tokens from web/mobile |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key (`pk_test_…`) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_…`) |
| `REDIS_URL` | Redis connection string. Default: `redis://localhost:6379` |

### `apps/web/.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key (server-side only) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_…`) |
| `NEXT_PUBLIC_BACKEND_URL` | Backend URL for client-side fetches. Default: `http://localhost:9000` |
| `BACKEND_URL` | Backend URL for server-side fetches (RSC / Server Actions). Default: `http://localhost:9000` |

### `apps/mobile/.env`

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `EXPO_PUBLIC_BACKEND_URL` | Backend URL. Default: `http://localhost:9000` |

> **Note:** On a physical device, `localhost` resolves to the device itself, not your machine. Use your machine's local network IP (e.g. `http://192.168.1.x:9000`).

---

## Development Workflow

### All commands are run from the monorepo root

```bash
# Start infrastructure (database + redis)
npm run db:up

# Start individual apps
npm run dev:backend      # Medusa on :9000
npm run dev:web          # Next.js on :3000
npm run dev:mobile       # Expo

# Database management
npm run db:studio        # Drizzle Studio (visual DB browser)
npm run db:down          # Stop containers (data preserved)
npm run db:reset         # Stop containers AND wipe volumes
npm run db:logs          # Tail PostgreSQL container logs

# Build all apps
npm run build

# Lint all apps
npm run lint

# Run tests (pass a filename to target: npm run test -- cart.test.ts)
npm run test
```

### Turbo task graph

Turborepo caches task outputs and only re-runs tasks when inputs change. The dependency graph is:

```
build
  └── depends on ^build (shared packages build before apps)

test
  └── depends on ^build

lint
  └── depends on ^lint

dev / db:studio
  └── persistent (never cached)
```

---

## Database

### Local setup

PostgreSQL runs in Docker. The `docker-compose.yml` at the repo root defines the service:

- **Host:** `localhost:5432`
- **User:** `postgres`
- **Password:** `password`
- **Database:** `ecommerce`

Data is stored in the `postgres_data` named volume and survives container restarts. Use `npm run db:reset` to wipe it completely.

### Migrations

Medusa manages its own tables via its internal migration system:

```bash
cd apps/backend && npm run db:migrate
```

Custom Drizzle tables are managed separately:

```bash
# Generate a new migration after editing src/db/schema.ts
cd apps/backend && npm run db:generate

# Apply pending migrations
cd apps/backend && npm run db:push
```

### Custom schema (`apps/backend/src/db/schema.ts`)

```
custom_customers
  id            text  PK
  clerk_id      text  UNIQUE  ← Clerk user ID
  medusa_customer_id  text   ← Links to Medusa's customer record
  email         text  UNIQUE
  first_name    text
  last_name     text
  phone         text
  created_at    timestamp
  updated_at    timestamp

wishlists
  id            text  PK
  customer_id   text  FK → custom_customers.id  (CASCADE DELETE)
  product_id    text  ← Medusa product ID
  variant_id    text
  created_at    timestamp

product_reviews
  id            text  PK
  product_id    text  ← Medusa product ID
  customer_id   text  FK → custom_customers.id  (CASCADE DELETE)
  rating        integer  (1–5)
  title         text
  body          text
  is_verified_purchase  boolean
  metadata      jsonb
  created_at    timestamp
  updated_at    timestamp
```

### Seeding

```bash
cd apps/backend && npm run seed
```

The seed script (`src/scripts/seed.ts`) uses Medusa's product module service to create a "T-Shirts" category with two products (Classic White Tee, Essential Black Tee) in S/M/L variants at $25.00 each.

---

## API Reference

The backend exposes Medusa's full Store API at `/store/*` plus custom routes:

### Medusa Store API (built-in)

| Method | Path | Description |
|---|---|---|
| `GET` | `/store/products` | List products. Supports `?q=`, `?category_id=`, `?limit=`, `?offset=` |
| `GET` | `/store/products/:id` | Get a single product by ID |
| `GET` | `/store/products?handle=:handle` | Get a product by handle (slug) |
| `GET` | `/store/carts/me` | Get the current user's cart |
| `POST` | `/store/carts/me/line-items` | Add an item to cart |
| `PATCH` | `/store/carts/me/line-items/:id` | Update item quantity |
| `DELETE` | `/store/carts/me/line-items/:id` | Remove an item from cart |
| `POST` | `/store/orders` | Complete checkout and create an order |
| `GET` | `/store/orders` | List orders for the authenticated customer |
| `POST` | `/store/payment-intents` | Create a Stripe PaymentIntent |

### Custom routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/store/wishlist` | Required | Get wishlist for authenticated customer |
| `POST` | `/store/wishlist` | Required | Add a product to wishlist |
| `DELETE` | `/store/wishlist` | Required | Remove a product from wishlist |
| `GET` | `/store/reviews/:productId` | None | Get reviews + aggregate stats for a product |
| `POST` | `/store/reviews/:productId` | Required | Submit a review |

### Authentication header

Protected routes require a Clerk session token as a Bearer token:

```
Authorization: Bearer <clerk-session-token>
```

---

## Authentication

Authentication is handled by [Clerk](https://clerk.com) across all three apps.

### Web (`apps/web`)

- `ClerkProvider` wraps the root layout (`src/app/layout.tsx`)
- `clerkMiddleware` in `src/middleware.ts` protects `/checkout`, `/orders`, and `/account` — unauthenticated visitors are redirected to `/sign-in`
- Hosted Clerk UI components (`<SignIn />`, `<SignUp />`) are rendered at `/sign-in` and `/sign-up`
- `<UserButton />` in the header handles session management
- Server Components and Server Actions call `auth()` from `@clerk/nextjs/server` to get the session token, which is forwarded to the backend as a Bearer token

### Mobile (`apps/mobile`)

- `ClerkProvider` wraps the root layout (`app/_layout.tsx`)
- Session tokens are stored securely with `expo-secure-store` via a custom `tokenCache`
- `useAuth()` and `useUser()` hooks provide auth state throughout the app
- Sign-in and sign-up are custom screens (`app/(auth)/`) using Clerk's `useSignIn` / `useSignUp` hooks with email verification

### Backend (`apps/backend`)

- The backend does **not** use Clerk's hosted sessions — it only verifies tokens
- `requireClerkAuth` middleware (`src/api/middlewares.ts`) calls `clerk.verifyToken()` from `@clerk/backend` to validate the Bearer token
- The verified `clerkUserId` (`sub` claim) is attached to the request for downstream handlers
- **Never mock Clerk auth headers manually.** In tests, use Clerk's official testing tokens from `.env.local`

---

## Payments

Payments use [Stripe](https://stripe.com) with Stripe Elements.

### Flow

```
1. Checkout page (RSC) calls backend → creates a Stripe PaymentIntent
2. PaymentIntent clientSecret is passed as a prop to <CheckoutForm> (client component)
3. Stripe Elements renders the payment form client-side
4. On submit, stripe.confirmPayment() is called — Stripe handles the card data
5. On success, the completeCheckout Server Action is called with the PaymentIntent ID
6. Server Action calls backend → creates the Medusa order
```

### Security rules

- **Never store or log Stripe PANs (card numbers).** Raw card data never touches application code — it goes directly from the browser to Stripe's servers via Stripe Elements.
- Stripe webhook events are verified using the `STRIPE_WEBHOOK_SECRET` before processing.
- The Stripe secret key (`sk_*`) is server-side only and never exposed to the browser.

---

## Production Build

### Backend Docker image

The `Dockerfile` in `apps/backend/` uses a three-stage build. The build context must be the **monorepo root** because the backend depends on `packages/types` and `packages/utils`.

```bash
# Build from the repo root
docker build -f apps/backend/Dockerfile -t ecommerce-backend .

# Run (inject secrets via environment variables — never bake into image)
docker run \
  -e DATABASE_URL="postgres://..." \
  -e JWT_SECRET="..." \
  -e COOKIE_SECRET="..." \
  -e CLERK_SECRET_KEY="sk_live_..." \
  -e STRIPE_SECRET_KEY="sk_live_..." \
  -e STRIPE_WEBHOOK_SECRET="whsec_..." \
  -p 9000:9000 \
  ecommerce-backend
```

**Build stages:**

| Stage | Base | Purpose |
|---|---|---|
| `deps` | `node:20-alpine` | Installs all workspace dependencies. Layer is cached until a `package.json` changes. |
| `builder` | `deps` | Copies source, builds shared packages, runs `medusa build` → outputs self-contained bundle to `.medusa/server/` |
| `runner` | `node:20-alpine` | Copies only `.medusa/server/`, installs production deps, exposes port 9000 |

The final image contains no TypeScript compiler, no dev dependencies, and no source files outside the bundle.

### Web (`apps/web`)

```bash
cd apps/web
npm run build
npm run start
```

Or deploy directly to Vercel — the project root is `apps/web`.

### Mobile (`apps/mobile`)

```bash
cd apps/mobile
npx expo build       # Classic build
# or
npx eas build        # EAS Build (recommended)
```

---

## Project Conventions

### React Server Components first

All Next.js pages and layouts are Server Components by default. `'use client'` is added only at the lowest possible leaf component — typically interactive elements like buttons and forms that need `useState`, `useTransition`, or browser event handlers.

```
Page (RSC) → fetches data, passes to →
  Layout (RSC) →
    ProductCard (RSC) → static display
    AddToCartButton ('use client') → needs useTransition + Server Action
```

### Data mutation via Server Actions

Form submissions and cart mutations use Next.js Server Actions (`src/actions/`). These run on the server, call the backend API with the Clerk token, then call `revalidatePath()` to refresh the relevant RSC data.

### API calls from Server Components

`src/lib/api.ts` contains fetch helpers used by Server Components. They read `BACKEND_URL` (the private env var) so requests go directly server-to-server in production, bypassing the public internet.

### Type safety across the stack

Shared types in `@ecommerce/types` are the single source of truth for API request/response shapes. The backend routes, web `lib/api.ts`, and mobile fetch calls all import from the same types package.

### No cross-app imports

```
✅ apps/web imports from @ecommerce/types
✅ apps/web imports from @ecommerce/utils
✅ apps/web calls apps/backend via HTTP

❌ apps/web imports from apps/backend
❌ apps/mobile imports from apps/web
❌ packages/types imports from any app
```

### shadcn/ui components stay in `apps/web`

`apps/web/src/components/ui/` holds the shadcn/ui component library. These are not moved to `packages/` because they depend on React DOM and Tailwind — things the mobile app doesn't use.

### Environment variables are never shared

Each app manages its own `.env` file. There is no root `.env`. This ensures apps remain portable.
