# QAVELIX

QAVELIX is being built in phases. Phase 1 created the secure technical foundation, Phase 2 added the responsive design system, Phase 3 added secure upload validation with FFprobe metadata analysis, Phase 4 added queued FFmpeg compression, Phase 5 added secure downloads with cleanup lifecycle handling, and Phase 6 hardened the application security layer.

## Included in Phase 1

- Next.js App Router with TypeScript
- Tailwind CSS
- ESLint and Prettier
- Locale routing for `en`, `pt-BR`, and `es`
- Centralized UTF-8 localization dictionaries for English, Brazilian Portuguese, and European Spanish
- Environment validation with Zod
- Security headers in `next.config.ts`
- Docker-ready production image configuration
- Vercel-ready configuration
- Git-ready ignore rules and project structure

## Included in Phase 2

- Complete responsive landing page
- Reusable design-system components
- Semantic color tokens for light and dark themes
- Persistent light/dark theme selector with Dark as the first-visit default
- Responsive header navigation and footer navigation
- Localized language selector for `en`, `pt-BR`, and `es`
- Native-quality product, validation, compression, accessibility, metadata, and footer copy in all supported locales
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

## Included in Phase 5

- Signed download URLs for completed compression jobs
- Temporary output retention with automatic expiration
- Manual delete for completed output files
- Lifecycle states for completed, expired, deleted, cancelled, and failed jobs
- Private no-store download responses with safe attachment filenames
- Cleanup of input files after compression and output files after deletion or expiration

## Included in Phase 6

- Hardened CSP and security headers
- Same-origin enforcement for state-changing API routes
- In-memory rate limiting for upload, compression, status, delete, and download routes
- Request size preflight before multipart parsing
- UUID and signed token validation before job/download lookups
- Bounded compression queue and retained job lifecycle storage
- Structured server-side security logging with request IDs

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
