# Restaurant Management System

An all-in-one restaurant management application built with Next.js, Prisma,
PostgreSQL, and shadcn/ui.

## Application

- `apps/web`: Next.js frontend and backend at `http://localhost:3000`
- Next.js Route Handlers provide the API under `http://localhost:3000/api`
- Prisma reads and writes the PostgreSQL database directly on the server

## Setup

1. Copy `apps/web/.env.example` to `apps/web/.env`.
2. Update `DATABASE_URL` in `apps/web/.env` with your PostgreSQL connection.
3. Run `npm install`.
4. Sync the Prisma schema: `npm run db:push --workspace=apps/web`.
5. Create the first admin: `npm run db:seed --workspace=apps/web`.
6. Run `npm run dev`.

The default development admin is `admin@savor.com` with password
`ChangeMe123!`. Change `ADMIN_EMAIL` and `ADMIN_PASSWORD` before seeding.

Open `http://localhost:3000`. There is no second backend process or port.

## Project structure

```text
apps/
└── web/
    ├── prisma/              # Prisma ORM schema and database seed
    └── src/
        ├── app/             # Next.js pages and API Route Handlers
        ├── components/
        │   ├── layout/      # Sidebar and application shell
        │   └── ui/          # Reusable shadcn components
        ├── config/          # Values changed once and reused everywhere
        ├── features/
        │   ├── auth/        # Auth API, types, hook, and login form
        │   └── dashboard/   # Dashboard data and components
        └── lib/
            ├── server/      # Prisma, sessions, validation, and passwords
            └── api-client.ts
```

## Authentication flow

1. The login form calls `POST /api/auth/login`.
2. A Next.js Route Handler verifies the password through Prisma.
3. A random session token is stored in an HTTP-only cookie; only its hash is
   stored in the `Session` table.
4. The sidebar calls `GET /api/auth/me` to load the signed-in user.
5. Logout calls `POST /api/auth/logout`, deletes the database session, clears
   the cookie, and returns to `/login`.

## Reusing values and functions

Public application settings live in `apps/web/src/config/app-config.ts`. This
is the single place to change values such as:

- application name and description;
- support email;
- frontend routes;
- API base URL;
- session cookie name;
- restaurant names and locations.

The configuration uses `as const`, so TypeScript remembers the exact values
and catches invalid usage. Components import `appConfig` instead of repeating
strings:

```ts
import { appConfig } from "@/config/app-config";

router.replace(appConfig.routes.login);
```

Reusable behavior belongs in a function. For example,
`apps/web/src/lib/mailto.ts` creates all support email links, while
`apps/web/src/lib/api-client.ts` handles API URLs, cookies, JSON, and errors for
every feature.

Keep secrets out of `app-config.ts`. Database passwords and private settings
belong in `.env`; browser-safe environment variables must start with
`NEXT_PUBLIC_`.

## Merchant and store ownership

The Prisma hierarchy is:

```text
ADMIN user
└── creates and manages Merchant organizations
    ├── MerchantMember (OWNER, MANAGER, or STAFF)
    │   └── connects an application User to the Merchant
    └── Store
        └── always belongs to exactly one Merchant
```

- `User.role = ADMIN` gives platform-wide merchant management access.
- `User.role = MERCHANT` identifies a merchant-side account.
- `MerchantMember.role` controls what that user can do inside one merchant.
- A merchant owner can manage that merchant's members and stores.
- Every store query must include the authenticated user's `merchantId`; this
  prevents one merchant from accessing another merchant's stores.
- The same user can belong to more than one merchant without duplicating the
  user account.

Creating a merchant is implemented as one Prisma transaction:

1. create the merchant organization;
2. create or connect its owner user;
3. create an `OWNER` membership;
4. optionally create the merchant's first store.

This transaction is implemented in the admin interface at `/admin/users`.
Submitting the form creates the merchant owner account, merchant organization,
`OWNER` membership, and optional first store together. The corresponding API
is protected by both a session guard and an `ADMIN` role guard:

```text
GET  /api/admin/merchant-users
POST /api/admin/merchant-users
```

## Merchant storefront

Merchant owners and managers configure their stores at `/merchant/stores`.
Store updates are scoped through `MerchantMember`, so a merchant cannot read or
change another merchant's stores. The settings include:

- store name, description, contact details, logo, and cover image;
- Facebook, Instagram, Telegram, and TikTok links;
- display currency and exchange rate;
- storefront publishing;
- a copyable customer link and storefront preview.

Published stores are public at `/store/:merchantSlug/:storeSlug`. Only active,
available products belonging to that store are returned to customers.
# Digital-Menu
