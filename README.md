# TeamOne Digital-Menu

A full-stack restaurant menu and management platform built for merchants,
restaurant teams, and their customers. TeamOne Digital-Menu combines a
responsive merchant dashboard with a premium public storefront inspired by
Cambodian hospitality and Khmer visual culture.

The application runs as a single Next.js service. Pages, API Route Handlers,
authentication, and database access all live in `apps/web`.

## Features

### Public digital menu

- Premium mobile-first Cambodian storefront
- Store cover, logo, description, contact details, and social links
- Search and horizontally scrollable category navigation
- Products grouped by category with availability and image fallbacks
- Store-controlled currency and price formatting
- English and Khmer menu switching with per-language store, category, product,
  and modifier content
- Light and dark themes
- Store information drawer
- Optional promotion popup with title, message, and image
- Public table ordering through QR-linked menus
- Product choices and add-ons with required and multi-select rules

Published menus use this route:

```text
/store/:merchantSlug/:storeSlug
```

### Merchant workspace

- Responsive restaurant overview and sales analytics
- Seven-day and 30-day sales trends
- Store profile, branding, publication, and promotion settings
- Product and category management
- Product modifier groups, add-on pricing, and prominent sold-out controls
- Dining-table and QR-code management
- Live order alerts, order tracking, and status updates
- Kitchen board organized by preparation stage
- Multiple stores under one merchant organization
- Owner, manager, and staff membership roles

### Administration

- Platform overview
- Merchant and merchant-user management
- Store and order oversight
- Administrator management
- User activation and password reset controls
- Platform settings and system health
- Administrative audit history

## Technology

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui and Base UI
- Lucide icons
- Prisma ORM
- PostgreSQL
- HTTP-only database-backed sessions
- Railway deployment configuration

No separate API server is required. Next.js Route Handlers expose the API
under `/api`, and Prisma accesses PostgreSQL on the server.

## Project structure

```text
.
├── apps/
│   └── web/
│       ├── prisma/
│       │   ├── schema.prisma       # Database models
│       │   └── seed.mjs            # Initial administrator seed
│       ├── public/                 # Static assets
│       └── src/
│           ├── app/                # Pages and API Route Handlers
│           ├── components/
│           │   ├── layout/         # Application shell and sidebar
│           │   └── ui/             # Shared UI primitives
│           ├── config/             # Application-wide configuration
│           ├── features/           # Domain components, APIs, and types
│           └── lib/                # Shared client and server utilities
├── package.json                    # Workspace commands
└── railway.json                   # Production build and deployment
```

Feature code is organized by domain:

```text
features/
├── admin-support/
├── administrators/
├── auth/
├── dashboard/
├── merchant-users/
├── orders/
├── storefront/
├── stores/
└── team/
```

## Requirements

- Node.js 22 or newer
- npm
- PostgreSQL

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template:

   ```bash
   cp apps/web/.env.example apps/web/.env
   ```

3. Configure `apps/web/.env`:

   ```dotenv
   DATABASE_URL="postgresql://postgres:password@localhost:5432/restaurant_management?schema=public"
   ADMIN_NAME="TeamOne Administrator"
   ADMIN_EMAIL="admin@example.com"
   ADMIN_PASSWORD="replace-with-a-strong-password"
   ```

4. Synchronize the database schema:

   ```bash
   npm run db:push --workspace=apps/web
   ```

5. Create or update the initial administrator:

   ```bash
   npm run db:seed --workspace=apps/web
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000).

> Never use the example administrator password in production. Set a unique,
> strong password before running the seed command.

## Environment variables

| Variable         | Required    | Purpose                                    |
| ---------------- | ----------- | ------------------------------------------ |
| `DATABASE_URL`   | Yes         | PostgreSQL connection used by Prisma       |
| `ADMIN_NAME`     | For seeding | Display name for the initial administrator |
| `ADMIN_EMAIL`    | For seeding | Login email for the initial administrator  |
| `ADMIN_PASSWORD` | For seeding | Password for the initial administrator     |

Keep secrets in `apps/web/.env` or the production environment. Do not place
database credentials or private values in `src/config/app-config.ts`.

## Commands

Run these commands from the repository root:

| Command                                | Purpose                              |
| -------------------------------------- | ------------------------------------ |
| `npm run dev`                          | Start the Next.js development server |
| `npm run build`                        | Create a production build            |
| `npm run lint`                         | Run ESLint across workspaces         |
| `npm run typecheck`                    | Run TypeScript validation            |
| `npm run format`                       | Format the repository with Prettier  |
| `npm run db:push --workspace=apps/web` | Synchronize the Prisma schema        |
| `npm run db:seed --workspace=apps/web` | Seed the administrator account       |

Before publishing a change, run:

```bash
npm run typecheck
npm run lint
npm run build
```

## Authentication and authorization

1. The login form sends credentials to `POST /api/auth/login`.
2. The server verifies the password against the Prisma user record.
3. A random session token is returned in an HTTP-only cookie.
4. Only the token hash is stored in the `Session` table.
5. Middleware protects private routes and safely clears invalid sessions.
6. Server-side role and membership checks scope every protected operation.

Platform roles are `ADMIN`, `MERCHANT`, and `STAFF`. Merchant memberships add
organization-level `OWNER`, `MANAGER`, and `STAFF` permissions.

Every merchant store query must be scoped through the authenticated user's
membership. A merchant must never be able to access another merchant's stores,
products, tables, or orders.

## Core data model

```text
User
├── Session
├── AdminAuditLog
└── MerchantMember
    └── Merchant
        └── Store
            ├── Category
            ├── Product
            ├── DiningTable
            └── Order
                └── OrderItem
```

A store owns its catalog, tables, orders, branding, social links, currency,
publication state, and optional promotion content.

## Shared configuration

Application-wide values belong in:

```text
apps/web/src/config/app-config.ts
```

Storefront-specific copy, colors, and reusable asset paths belong in:

```text
apps/web/src/features/storefront/constants.ts
```

Prefer updating these shared values once instead of repeating strings or style
values across components. Secrets must remain in environment variables.

## Deployment with Railway

The included `railway.json` defines the production lifecycle:

1. Install dependencies with `npm ci`.
2. Generate the Prisma client.
3. Build the Next.js application.
4. Run `prisma db push` before deployment.
5. Start the `apps/web` workspace.
6. Verify `/api/health`.

Configure at least `DATABASE_URL` in the Railway service environment. Configure
the administrator seed variables only when the production administrator needs
to be created or updated.

The Railway service runs:

```text
npm run start --workspace=apps/web
```

Database schema synchronization is additive, but production data should still
be backed up before significant schema changes.

## Development guidelines

- Keep server-only database and session logic out of client components.
- Add `"use client"` only when a component needs browser interaction or state.
- Reuse existing domain APIs, types, constants, and UI primitives.
- Preserve route structure and merchant ownership checks.
- Do not commit `.env` files or credentials.
- Do not replace real store data with hardcoded storefront content.
- Keep the public menu usable from 320px through large desktop widths.
- Maintain visible focus states, semantic labels, and reduced-motion support.

## Branding

The product name is **TeamOne Digital-Menu**. The public storefront uses a
modern Khmer-inspired visual direction with warm sand surfaces, palm green,
restrained temple-gold accents, and Romdoul-inspired ornamentation.

Crafted with Khmer hospitality.
