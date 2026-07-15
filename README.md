# QAVELIX

QAVELIX Phase 1 is the project foundation: a secure, localized, deployment-ready Next.js application.

## Included in Phase 1

- Next.js App Router with TypeScript
- Tailwind CSS
- ESLint and Prettier
- Locale routing for `en`, `pt-BR`, and `es`
- Environment validation with Zod
- Security headers in `next.config.ts`
- Docker-ready production image configuration
- Vercel-ready configuration
- Git-ready ignore rules and project structure

## Explicitly excluded from Phase 1

- FFmpeg or media compression logic
- Payments
- Ads
- User accounts or authentication

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The middleware redirects to the default locale route at `/en`.

## Environment

Copy `.env.example` to `.env.local` and update values as needed.

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Verification

```bash
npm run lint
npm run typecheck
npm run format:check
npm run build
```

## Docker

```bash
docker build -t qavelix .
docker run --rm -p 3000:3000 qavelix
```
