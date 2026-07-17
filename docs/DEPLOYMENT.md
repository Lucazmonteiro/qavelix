# QAVELIX Deployment

This guide covers the production deployment path for the current QAVELIX phases.

## Production target

- Frontend and API routes: Vercel, using the Next.js framework preset.
- DNS and edge protection: Cloudflare.
- CI/CD verification: GitHub Actions.
- Media execution: the current implementation runs FFmpeg and FFprobe from the server runtime and stores compression jobs in process memory.

## Required environment variables

Set these variables in Vercel for Production, Preview, and Development as appropriate.

```bash
NEXT_PUBLIC_APP_URL=https://qavelix.com
```

Rules:

- `NEXT_PUBLIC_APP_URL` is required when `NODE_ENV=production`.
- Production public URLs must use HTTPS.
- `http://localhost` and `http://127.0.0.1` are allowed only for local production verification.
- The value must be the canonical public origin with no trailing slash.

This URL is used for metadata, canonical links, language alternates, `sitemap.xml`, and `robots.txt`.

## Vercel configuration

The project is configured in `vercel.json`:

- Framework: Next.js.
- Install command: `npm ci`.
- Build command: `npm run build`.
- Development command: `npm run dev`.
- Region: `iad1`.
- Explicit cache headers for `/favicon.svg`, `/site.webmanifest`, `/robots.txt`, and `/sitemap.xml`.

Recommended Vercel project settings:

- Node.js version: 24.x.
- Build command: keep `npm run build`.
- Install command: keep `npm ci`.
- Output directory: leave empty and let Vercel detect Next.js.
- Environment variable: set `NEXT_PUBLIC_APP_URL` to the final HTTPS production origin.

## Cloudflare DNS

Use Cloudflare as DNS for the production domain.

Recommended records:

| Type       | Name      | Target                                         |
| ---------- | --------- | ---------------------------------------------- |
| CNAME      | `www`     | Vercel-assigned canonical host                 |
| A or CNAME | apex/root | Configure through Vercel's domain instructions |

Recommended Cloudflare settings:

- SSL/TLS mode: Full (strict).
- Always Use HTTPS: enabled.
- Automatic HTTPS Rewrites: enabled.
- HSTS: only enable after verifying the production domain and Vercel certificate.
- Cache level: Standard.
- Do not cache API routes.
- Do not modify CSP headers at Cloudflare unless the same policy is mirrored from `next.config.ts`.

## Security headers

Production security headers are configured in `next.config.ts`.

Production CSP must not include `'unsafe-eval'`. It includes `upgrade-insecure-requests`.

Development CSP may include `'unsafe-eval'` only to support React development mode.

Verify production headers after deployment:

```bash
curl -I https://qavelix.com/en
```

Check for:

- `Content-Security-Policy`
- `Strict-Transport-Security`
- `Referrer-Policy`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Cross-Origin-Opener-Policy`
- `Cross-Origin-Resource-Policy`
- `Permissions-Policy`

## Static assets, SEO, and metadata

Verify after deployment:

```bash
curl -I https://qavelix.com/favicon.svg
curl -I https://qavelix.com/site.webmanifest
curl https://qavelix.com/robots.txt
curl https://qavelix.com/sitemap.xml
curl https://qavelix.com/en
```

Expected:

- Favicon is reachable.
- Web manifest is reachable.
- `robots.txt` disallows `/api/` and points to the production sitemap.
- `sitemap.xml` includes all supported locales and legal/content pages.
- Localized pages include canonical, alternate language, Open Graph, and Twitter metadata.

## API routes

Verify API routes after deployment without uploading production customer data:

```bash
curl -i -X POST https://qavelix.com/api/upload/analyze
curl -i -X POST https://qavelix.com/api/compression/jobs
```

Expected:

- Same-origin protection rejects cross-origin state-changing requests.
- Missing multipart uploads return validation errors only for same-origin requests.
- API responses include `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.

## Worker deployment guide

The current phase keeps compression execution in the Next.js server runtime with an in-memory queue. That is suitable for local verification and a single runtime instance, but it is not horizontally durable.

Before scaling production compression traffic, deploy a dedicated worker architecture:

1. Move job state from process memory to durable storage.
2. Move uploaded source and compressed output files from local temporary files to private object storage.
3. Run FFmpeg and FFprobe in a worker runtime that explicitly supports those binaries.
4. Have the web app enqueue jobs and poll durable job state instead of owning the compression process.
5. Keep signed download URLs short-lived and scoped to completed outputs.
6. Keep cleanup as an explicit worker task for source files, output files, expired jobs, deleted jobs, and failed jobs.

Recommended production worker targets:

- Container worker on a platform with persistent FFmpeg/FFprobe support.
- Private object storage for inputs and outputs.
- Managed queue for compression jobs.
- Durable database or key-value store for job state.

Do not run multi-instance production compression with the current in-memory queue because job state and output paths are instance-local.

## CI/CD

GitHub Actions runs on pushes to `main` and pull requests:

```bash
npm ci
npm run lint
npm run typecheck
npm run build
npm run test
```

Vercel should deploy only commits that pass CI.

## Manual deployment checklist

Before the first production deployment:

1. Create the Vercel project from the repository.
2. Set `NEXT_PUBLIC_APP_URL` to the final HTTPS production origin.
3. Connect the production domain in Vercel.
4. Configure Cloudflare DNS to point to Vercel.
5. Verify Vercel has issued a valid certificate.
6. Run the post-deployment checks in this document.
7. Confirm `sitemap.xml`, `robots.txt`, metadata, favicon, and manifest use the production origin.
