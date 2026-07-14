# CloudKeeper: Setup & Run Instructions

This document outlines the steps required to install dependencies, configure the environment, and run the CloudKeeper application in a development environment.

## 1. Prerequisites
- Node.js (v20+)
- pnpm (v11+)
- PostgreSQL database (Supabase or local instance)

## 2. Environment Configuration
Copy the `.env.example` file to `.env` in the root directory:

```bash
cp .env.example .env
```

Update the `.env` file with your actual credentials:
- `DATABASE_URL`: Your database connection string.
- `MASTER_ENCRYPTION_KEY`: A 32-byte hex key for encryption.
- `RESEND_API_KEY`: API key for email notifications.
- `JWT_SECRET` / `JWT_REFRESH_SECRET`: Secure random strings for JWT.

## 3. Installation
Install all dependencies for the monorepo:

```bash
pnpm install
```

## 4. Database Setup
Push the schema to your database (ensure `DATABASE_URL` is correctly set in `.env`):

```bash
cd packages/database
pnpm prisma db push
pnpm prisma generate
cd ../..
```

## 5. Running the Application
To run the full development stack (API, Web, and Worker), use TurboRepo from the root directory:

```bash
pnpm turbo dev
```

The application will be accessible at:
- **Web App**: `http://localhost:3000`
- **API Server**: `http://localhost:5001`

## 6. Worker Execution
The worker is included in the `pnpm turbo dev` process, but it can also be run independently for debugging:

```bash
cd apps/worker
pnpm dev
```
