# QAVELIX

QAVELIX is being built in phases. Phase 1 created the secure technical foundation, Phase 2 added the responsive design system, Phase 3 added secure upload validation with FFprobe metadata analysis, and Phase 4 adds queued FFmpeg compression.

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

## Included in Phase 3

- Drag-and-drop video upload validation UI
- Client-side prechecks for size, extension, MIME type, empty files, and single-file upload
- Server-side validation for extension, MIME type, binary file signature, and upload size
- FFprobe metadata extraction for duration, bitrate, container, codecs, resolution, and frame rate
- Random temporary file naming and cleanup after analysis
- Structured upload errors for recoverable failure states

## Included in Phase 4

- FFmpeg compression job API
- Fixed compression presets for balanced, smaller, and higher-quality output
- In-memory single-worker queue
- Progress reporting from FFmpeg
- Queued/running job cancellation
- Secure FFmpeg execution through argument arrays with `shell: false`
- Temporary random input/output paths with cleanup after each job

## Explicitly excluded from current phases

- Arbitrary media conversion settings outside the fixed presets
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
