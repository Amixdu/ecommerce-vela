# Vela — E-Commerce Monorepo

A full-stack e-commerce storefront with a Next.js web app, Expo mobile app, and Medusa.js v2 backend. Built as a **loosely-coupled Turborepo monorepo** — each app is independently deployable and can be extracted into its own repository without changes.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Medusa Admin Setup](#medusa-admin-setup)
- [Seeding](#seeding)
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
ecommerce-vela/
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
│       └── seed.ts                    # Product + admin seed script
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
│   │   ├── cart/                      # Cart page (RSC, cookie-based)
│   │   ├── checkout/                  # Checkout page (RSC + Stripe)
│   │   └── orders/                    # Order history (protected)
│   ├── layout.tsx                     # Root layout — ClerkProvider
│   └── page.tsx                       # Landing page with featured products
├── actions/
│   ├── cart.ts                        # Server Actions: add / update / remove
│   └── checkout.ts                    # Server Action: complete order
├── components/
│   ├── layout/
│   │   ├── Header.tsx                 # Sticky nav with cart badge
│   │   └── CartIcon.tsx               # Cart icon with item count bubble
│   ├── store/
│   │   ├── ProductCard.tsx
│   │   ├── AddToCartButton.tsx        # With "Added to Bag" success state
│   │   ├── FeaturedProducts.tsx       # Animated marquee on home page
│   │   ├── CartItemRow.tsx
│   │   └── CheckoutForm.tsx
│   └── ui/                            # shadcn/ui components
├── lib/
│   ├── api.ts                         # Fetch helpers + Medusa response transforms
│   └── utils.ts                       # cn() utility
└── middleware.ts                      # Clerk route protection
```

### `packages/`

| Package | Purpose |
|---|---|
| `@ecommerce/types` | Shared TypeScript interfaces: `Product`, `Cart`, `Order`, `User`, `ApiResponse` |
| `@ecommerce/utils` | Pure functions: `formatPrice`, `formatDate`, `slugify`, `truncateText` |

---

## Architecture

### Strict network boundaries

`apps/web` and `apps/mobile` **never import files from `apps/backend`**. All communication is over HTTP. This is the key rule that keeps the apps independently deployable.

```
┌─────────────┐     HTTP      ┌──────────────────┐
│  apps/web   │ ──────────── ▶│  apps/backend    │
└─────────────┘               │  (Medusa v2)     │
                               │  :9000           │
┌─────────────┐     HTTP      │                  │
│ apps/mobile │ ──────────── ▶│                  │
└─────────────┘               └──────────────────┘
                                        │
                               ┌────────▼─────────┐
                               │   PostgreSQL      │
                               │   (Docker)        │
                               └──────────────────┘
```

### Cart is anonymous and cookie-based

Medusa v2 carts are not tied to a user session. A cart is created on first "Add to Bag", and its ID is stored in a `medusa_cart_id` HTTP-only cookie. The cart persists for 7 days. Authentication is only required for checkout and order history.

### Prices are stored in major currency units

Medusa v2 stores and returns prices in the **major currency unit** (e.g. `25` = AUD 25.00), not cents. `formatPrice()` in `@ecommerce/utils` renders them directly without dividing by 100.

### Medusa response transforms

`apps/web/src/lib/api.ts` contains transform functions that map Medusa's snake_case API responses (with nested `prices` arrays, etc.) to the clean camelCase types in `@ecommerce/types`. Nothing else in the web app knows about Medusa's internal shape.

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
git clone <repo-url> ecommerce-vela
cd ecommerce-vela
npm install
```

### 2. Start the database

```bash
npm run db:up
```

Starts PostgreSQL on port `5432` and Redis on port `6379` via Docker Compose. Data persists in named Docker volumes between restarts.

### 3. Configure environment variables

```bash
cp apps/backend/.env.template apps/backend/.env
cp apps/web/.env.local.template apps/web/.env.local
```

Fill in your Clerk keys, Stripe keys, and Medusa secrets. See [Environment Variables](#environment-variables).

### 4. Run database migrations

```bash
cd apps/backend && npx medusa db:migrate
```

### 5. Start the apps

```bash
# From the monorepo root — open separate terminals for each
npm run dev:backend     # Medusa API + admin on http://localhost:9000
npm run dev:web         # Next.js storefront on http://localhost:3000
```

### 6. Complete Medusa admin setup

See [Medusa Admin Setup](#medusa-admin-setup) — required before the storefront works.

### 7. Seed products

```bash
cd apps/backend && SEED_CLEAN=true npx medusa exec ./src/scripts/seed.ts
```

See [Seeding](#seeding) for details.

---

## Medusa Admin Setup

The Medusa admin runs at `http://localhost:9000/app`. Several one-time steps are required after first launch.

### Create an admin account

```bash
cd apps/backend && npx medusa user -e your@email.com -p yourpassword
```

Or set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env` and run the seeder — it creates the admin automatically.

### Add AUD as a store currency

1. Admin → **Settings → Store → Currencies**
2. Search for **Australian Dollar (AUD)** and enable it

### Create a region

1. Admin → **Settings → Regions → Add Region**
2. Name: `Australia`, Currency: `AUD`, Countries: `Australia`

### Create a sales channel and publishable API key

1. Admin → **Settings → Sales Channels** → create a channel (e.g. "Web Store")
2. Admin → **Settings → API Keys** → create a publishable key → copy it
3. Add it to `apps/web/.env.local` as `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...`
4. Link the key to the sales channel: API Keys → select key → **Sales Channels** → toggle your channel on

Without these steps the storefront will return `Publishable API key required` errors.

---

## Seeding

The seed script (`apps/backend/src/scripts/seed.ts`) creates:

- An admin user (from `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` in `.env`)
- An Australia/AUD region (if none exists)
- 5 product categories: T-Shirts, Hoodies & Sweatshirts, Trousers, Outerwear, Accessories
- 12 products with size variants and AUD prices

### Normal run (idempotent — skips existing data)

```bash
cd apps/backend && npx medusa exec ./src/scripts/seed.ts
```

### Full clean + re-seed

Wipes all products and categories, then re-creates them. **Admin user and region are preserved.**

```bash
cd apps/backend && SEED_CLEAN=true npx medusa exec ./src/scripts/seed.ts
```

> After seeding, go to the Medusa admin and link the seeded products to your sales channel: **Products → select all → Sales Channels → toggle on**.

---

## Environment Variables

### `apps/backend/.env`

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string. Default matches `docker-compose.yml`: `postgres://postgres:password@localhost:5432/ecommerce` |
| `JWT_SECRET` | Min 32-char secret for Medusa JWT tokens |
| `COOKIE_SECRET` | Min 32-char secret for Medusa session cookies |
| `CLERK_SECRET_KEY` | Clerk secret key (`sk_test_…`) — used to verify tokens from web/mobile |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key (`pk_test_…`) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_…`) |
| `REDIS_URL` | Redis connection string. Default: `redis://localhost:6379` |
| `SEED_ADMIN_EMAIL` | Email for the admin account created by the seeder |
| `SEED_ADMIN_PASSWORD` | Password for the admin account created by the seeder |
| `SEED_CLEAN` | Set to `"true"` to wipe products/categories before seeding |

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
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Medusa publishable API key — generate in admin: Settings → API Keys |
| `NEXT_PUBLIC_STORE_CURRENCY` | Default currency code for price display (e.g. `aud`). Used to select the correct price when a product has multiple currencies. |

---

## Development Workflow

```bash
# Start infrastructure (PostgreSQL + Redis)
npm run db:up

# Start individual apps
npm run dev:backend      # Medusa on :9000 (includes admin at /app)
npm run dev:web          # Next.js on :3000
npm run dev:mobile       # Expo

# Database management
npm run db:studio        # Drizzle Studio (visual DB browser)
npm run db:down          # Stop containers (data preserved)
npm run db:reset         # Stop containers AND wipe volumes
npm run db:logs          # Tail PostgreSQL container logs

# Build / lint / test (run from monorepo root)
npm run build
npm run lint
npm run test             # Target a file: npm run test -- cart.test.ts
```

---

## Database

### Local setup

PostgreSQL runs in Docker:

- **Host:** `localhost:5432`
- **User:** `postgres` / **Password:** `password`
- **Database:** `ecommerce`

Use `npm run db:reset` to wipe all data and start fresh.

### Migrations

```bash
# Medusa's built-in tables
cd apps/backend && npx medusa db:migrate

# Custom Drizzle tables (after editing src/db/schema.ts)
cd apps/backend && npm run db:generate   # generate migration file
cd apps/backend && npm run db:push       # apply to database
```

### Custom Drizzle schema

Three tables extend Medusa's core model:

| Table | Purpose |
|---|---|
| `custom_customers` | Bridges a Clerk user ID to a Medusa customer ID |
| `wishlists` | Per-customer product wishlist |
| `product_reviews` | Product ratings and reviews |

---

## API Reference

The backend exposes Medusa's full Store API at `/store/*` plus custom routes.

All store API requests must include the publishable API key header:
```
x-publishable-api-key: pk_...
```

### Cart API

Carts are anonymous and identified by cart ID, not by user session.

| Method | Path | Description |
|---|---|---|
| `POST` | `/store/carts` | Create a new cart. Body: `{ region_id }` |
| `GET` | `/store/carts/:id` | Get cart by ID |
| `POST` | `/store/carts/:id/line-items` | Add item. Body: `{ variant_id, quantity }` |
| `POST` | `/store/carts/:id/line-items/:item_id` | Update item quantity. Body: `{ quantity }` |
| `DELETE` | `/store/carts/:id/line-items/:item_id` | Remove item |

### Product API

| Method | Path | Description |
|---|---|---|
| `GET` | `/store/products` | List products. Supports `?q=`, `?category_id=`, `?limit=`, `?offset=` |
| `GET` | `/store/products?handle=:handle` | Get product by URL handle |
| `GET` | `/store/regions` | List available regions |

Append `&fields=*variants.prices,*categories` to product requests to include prices and categories.

### Orders API (auth required)

| Method | Path | Description |
|---|---|---|
| `GET` | `/store/orders` | List orders for the authenticated customer |
| `POST` | `/store/orders` | Complete checkout and create an order |

### Custom routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/store/wishlist` | Required | Get wishlist for authenticated customer |
| `POST` | `/store/wishlist` | Required | Add a product to wishlist |
| `DELETE` | `/store/wishlist` | Required | Remove a product from wishlist |
| `GET` | `/store/reviews/:productId` | None | Get reviews + aggregate stats |
| `POST` | `/store/reviews/:productId` | Required | Submit a review |

### Authentication header (protected routes)

```
Authorization: Bearer <clerk-session-token>
```

---

## Authentication

Authentication is handled by [Clerk](https://clerk.com).

### Web (`apps/web`)

- `ClerkProvider` wraps the root layout
- `clerkMiddleware` in `src/middleware.ts` protects `/checkout`, `/orders`, `/account`
- `auth()` from `@clerk/nextjs/server` is called in Server Components and Server Actions to get the session token
- Clerk sends transactional emails automatically (sign-in alerts, verification). In development these come from `noreply@accounts.dev`. In production, configure a custom sender domain in the Clerk dashboard.

### Backend (`apps/backend`)

- `requireClerkAuth` middleware (`src/api/middlewares.ts`) calls `clerk.verifyToken()` to validate incoming Bearer tokens
- **Never mock Clerk auth headers manually.** Use Clerk's official testing tokens in `.env.local`.

---

## Payments

Payments use [Stripe](https://stripe.com) with Stripe Elements.

### Flow

```
1. Checkout page (RSC) → backend creates a Stripe PaymentIntent
2. clientSecret passed to <CheckoutForm> (client component)
3. Stripe Elements renders the payment UI client-side
4. stripe.confirmPayment() — card data goes directly to Stripe, never to app servers
5. On success → completeCheckout Server Action → backend creates Medusa order
```

**Never store or log card numbers (PANs).** Raw card data never touches application code.

---

## Production Build

### Backend Docker image

```bash
# Build from the repo root (monorepo context required)
docker build -f apps/backend/Dockerfile -t vela-backend .

docker run \
  -e DATABASE_URL="postgres://..." \
  -e JWT_SECRET="..." \
  -e COOKIE_SECRET="..." \
  -e CLERK_SECRET_KEY="sk_live_..." \
  -e STRIPE_SECRET_KEY="sk_live_..." \
  -e STRIPE_WEBHOOK_SECRET="whsec_..." \
  -p 9000:9000 \
  vela-backend
```

### Web

```bash
cd apps/web && npm run build && npm run start
```

Or deploy to Vercel with project root set to `apps/web`.

### Mobile

```bash
cd apps/mobile && npx eas build
```

---

## Project Conventions

### RSC first, `'use client'` at the leaves

All Next.js pages and layouts are Server Components by default. `'use client'` is added only to interactive leaf components (`AddToCartButton`, `CartItemRow`, `CheckoutForm`).

### Server Actions for mutations

Cart and checkout mutations use Next.js Server Actions (`src/actions/`). They call the backend, then call `revalidatePath()` to refresh the relevant page data.

### No cross-app imports

```
✅ apps/web   → @ecommerce/types, @ecommerce/utils, HTTP to apps/backend
✅ apps/mobile → @ecommerce/types, @ecommerce/utils, HTTP to apps/backend

❌ apps/web   → apps/backend  (direct file import)
❌ apps/mobile → apps/web
❌ packages/* → any app
```

### shadcn/ui stays in `apps/web`

`apps/web/src/components/ui/` holds the shadcn/ui components. They are not in `packages/` because they depend on React DOM and Tailwind — not usable in the mobile app.
