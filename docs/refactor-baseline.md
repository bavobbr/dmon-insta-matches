# Refactor baseline (2 October 2026)

Baseline checks: `npm run lint` and `npm run build` pass before extraction.

## HTTP contract

Request bodies, response fields, status codes, logging and static paths are preserved.

- `POST /api/auth/login`
- `GET /api/auth/verify`
- `GET /api/health`
- `GET /api/twizzit/status`
- `GET /api/twizzit/matches`
- `POST /api/twizzit/cache/clear`
- `GET /api/twizzit/cache/stats`
- `POST /api/twizzit/cache/ttl`
- `GET /api/photos`
- `POST /api/photos`
- `DELETE /api/photos/:id`
- `POST /api/photos/reset`
- `GET /api/instagram/status`
- `POST /api/instagram/publish`

Static paths: `/generated`, `/uploads`, `/photos`, and the existing SPA fallback.

## Configuration and persistence

- `APP_AUTH_USER`, `APP_AUTH_PASSWORD`, `AUTH_SECRET_TOKEN` (existing fallback).
- `TWIZZIT_USERNAME`, `TWIZZIT_PASSWORD`, `TWIZZIT_ORG_ID` (default `32037`).
- `INSTAGRAM_ACCOUNT_ID`, `INSTAGRAM_ACCESS_TOKEN`, optional `APP_BASE_URL`.
- `NODE_ENV` controls frontend serving; `DISABLE_HMR` controls Vite watching.
- `.env` loads through dotenv; explicitly supplied environment values take precedence.
- Port 3000; existing `data/photos.json`, `data/twizzit-cache.json`, `data/twizzit-stats.json` formats.
- Existing localStorage keys, IndexedDB database/store, photo filenames and generated `story_<timestamp>.jpg` filenames.

## Manual parity checklist

- [ ] Start with `npm run dev`; log in and log out; refresh restores saved login.
- [ ] Select current/previous/next/custom weekend; sync cached and force-live matches.
- [ ] Inspect season/status, TTL update, cache clearing and monthly count/history.
- [ ] Upload/select/delete/reset photos; refresh restores active photo and settings.
- [ ] Preview Story and square layouts for Saturday, Sunday and Weekend, including empty matches.
- [ ] Download from preview (currently PNG); open Instagram modal with its JPEG payload.
- [ ] Publish a Story using real credentials; inspect existing status/error messages.
- [ ] Run weekly pipeline test with home matches and without home matches.
- [ ] `npm run build` and `npm start`; verify SPA and static image URLs.

Live Twizzit/Meta operations require the owner's credentials and are not invoked by automated tests.

## Existing behavior and technical debt deliberately preserved

- Scheduler is UI configuration and a manual simulation: its POSTED log does not publish through Meta.
- Monthly limit is reported as 500; the current server does not enforce a hard quota.
- Twizzit mapper labels every non-Sunday fixture Saturday, and preserves its existing team/home heuristics.
- Photos read as an empty array are reseeded; photo JSON write failures are logged and swallowed.
- Instagram publication uploads to uguu.se first and falls back to the configured/local public URL.
- Meta polls eight times at two-second intervals, then attempts publication even if readiness was never confirmed.
- PNG is the preview download format; JPEG is the Instagram modal/publishing payload format; there is no separate JPEG download button.
- Fixed sample data, caption dates and renderer fallback date strings remain wherever present.
- Authentication uses the existing static session secret; this task does not redesign authorization.

## Verification after extraction

- `npm run lint`, `npm run build`, and all 51 tests pass.
- All 28 captured server scenarios match responses, outbound calls, file writes and logs.
- All nine Canvas drawing traces match the pre-refactor renderer.
- Real HTTP smoke checks pass in both development and production modes: startup, health, login/verify/rejection, persisted cache hit and query count, TTL validation, photo upload/deletion, static image headers, frontend and SPA fallback. These checks used temporary data and fixture credentials on an ephemeral localhost port.
- No live Twizzit/CDN/Meta requests were made during verification. Account-dependent end-to-end publishing and a browser visual review remain manual checklist items.
