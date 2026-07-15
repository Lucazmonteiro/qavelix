# QAVELIX

QAVELIX is being built in phases. Phase 1 created the secure technical foundation, and Phase 2 adds the responsive design system, landing page, navigation, footer, language selector, theme controls, and accessibility basics.

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

## Included in Phase 2

- Complete responsive landing page
- Reusable design-system components
- Semantic color tokens for light and dark themes
- Persistent dark/light/system theme selector
- Responsive header navigation and footer navigation
- Localized language selector for `en`, `pt-BR`, and `es`
- Accessibility basics: semantic landmarks, skip link, keyboard focus states, labels, contrast-aware tokens, and reduced-motion handling

## Explicitly excluded from current phases

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
