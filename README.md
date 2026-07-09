# CloudKeeper

CloudKeeper is a dashboard for managing multiple cloud storage accounts (starting with MEGA). It securely stores account credentials, tracks maintenance history, and can run automated maintenance tasks.

## Architecture

This project is a monorepo built using [Turborepo](https://turbo.build/).

### Apps

- **web**: Next.js 15 (App Router) dashboard.
- **api**: Node.js/Express backend API.
- **worker**: Automation worker (Playwright).

### Packages

- **ui**: Shared UI components (shadcn/ui).
- **shared**: Shared utilities and logic.
- **types**: TypeScript shared definitions.

## Getting Started

1. Install dependencies: `npm install`
2. Develop: `npm run dev`

---
*Built with ❤️ for CloudKeeper*
