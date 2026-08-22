# Fresh15 Platform — Next.js

Next.js 16 App Router migration of the Fresh15 Platform/Admin Hub.

## Commands

```bash
npm i
npm run dev
npm run build
npm start
```

## Configuration

Copy `.env.example` to `.env.local` and update:

```env
NEXT_PUBLIC_API_BASE_URL=https://fresh15-main.onrender.com
```

## Architecture

- Next.js App Router
- React 19 + TypeScript
- Tailwind CSS v4 via `@tailwindcss/postcss`
- TanStack Query for client data/caching
- Centralized API base/error handling
- Next route navigation with a small compatibility layer for the original route modules
- Route-level `Suspense` for URL search params
- App-level error and 404 boundaries
- Smooth, reduced-motion-aware page transitions
