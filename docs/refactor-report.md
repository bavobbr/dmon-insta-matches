# Modular refactor report

## Result

The server is now bootstrap/composition code. Services handle Twizzit, authentication, photos, generated media hosting and Instagram; routes retain the existing HTTP contract. Shared domain models and pure helpers contain no React, Express, Canvas or third-party HTTP dependencies. The browser has API adapters, a Canvas renderer behind `MediaRenderer`, a publication service and an Instagram adapter behind `MediaPublisher`.

The existing Canvas drawing algorithm was moved intact, with its pure time-grouping helper extracted. It retains its offscreen rendering, image cache, layouts, fonts, colors, dimensions and image encoding. The preview hook contains surface-specific React lifecycle code. PNG/JPEG export stays on demand and keeps existing filenames.

## Moves and significant changes

| Original | Destination / role |
| --- | --- |
| `server.ts` | Bootstrap; route/middleware/static composition moved to `src/server/app.ts` |
| `src/App.tsx` | `src/client/App.tsx`; original file is a compatibility re-export |
| `src/components/*.tsx` | `src/client/components/*.tsx`; UI markup retained |
| `src/types.ts` | Split into `src/shared/types/*`; original file re-exports public type names |
| `src/utils/canvasRenderer.ts` | `src/client/rendering/canvas/drawing.ts`; original file re-exports legacy utilities |
| `src/utils/dateFormatter.ts` | `src/shared/domain/dateFormatter.ts`; compatibility re-export retained |
| `src/utils/weekend.ts` | `src/shared/domain/weekend.ts`; compatibility re-export retained |
| `src/utils/photoStorage.ts` | `src/client/persistence/photoStorage.ts`; compatibility re-export retained |
| `package.json` | Added `npm test`; install/dev/build/start commands and dependencies retained |
| `README.md` | Updated module map, diagrams, verification instructions and scheduler/export descriptions |

The pre-existing Vite watcher exclusions, dotenv startup loading and current-date weekend behavior remain intact. Existing data, uploads, generated assets, environment files and the user's lockfile were not migrated.

## Files created or moved

- `src/client/App.tsx`
- `src/client/automation/weeklySimulationService.ts`
- `src/client/components/AutomationScheduler.tsx`
- `src/client/components/BrandKitView.tsx`
- `src/client/components/GraphicPreview.tsx`
- `src/client/components/InstagramPublisherModal.tsx`
- `src/client/components/LoginScreen.tsx`
- `src/client/components/Navbar.tsx`
- `src/client/components/PhotoPoolManager.tsx`
- `src/client/components/TwizzitSyncPanel.tsx`
- `src/client/hooks/useCanvasPreview.ts`
- `src/client/persistence/photoStorage.ts`
- `src/client/publishing/InstagramApiPublisher.ts`
- `src/client/rendering/CanvasRenderer.ts`
- `src/client/rendering/canvas/drawing.ts`
- `src/client/rendering/imageEncoding.ts`
- `src/client/services/authApi.ts`
- `src/client/services/instagramApi.ts`
- `src/client/services/photosApi.ts`
- `src/client/services/publicationService.ts`
- `src/client/services/renderingService.ts`
- `src/client/services/twizzitApi.ts`
- `src/server/app.ts`
- `src/server/auth/authService.ts`
- `src/server/config/env.ts`
- `src/server/errors/ServiceError.ts`
- `src/server/persistence/generatedMediaRepository.ts`
- `src/server/photos/photoRepository.ts`
- `src/server/photos/photoService.ts`
- `src/server/publishing/MediaPublisher.ts`
- `src/server/publishing/instagram/instagramClient.ts`
- `src/server/publishing/instagram/instagramPublisher.ts`
- `src/server/publishing/instagram/instagramService.ts`
- `src/server/publishing/publicMediaHosting.ts`
- `src/server/routes/authRoutes.ts`
- `src/server/routes/instagramRoutes.ts`
- `src/server/routes/photoRoutes.ts`
- `src/server/routes/twizzitRoutes.ts`
- `src/server/twizzit/twizzitAuth.ts`
- `src/server/twizzit/twizzitCache.ts`
- `src/server/twizzit/twizzitClient.ts`
- `src/server/twizzit/twizzitMapper.ts`
- `src/server/twizzit/twizzitService.ts`
- `src/server/twizzit/twizzitStats.ts`
- `src/server/twizzit/types.ts`
- `src/shared/domain/dateFormatter.ts`
- `src/shared/domain/matchGrouping.ts`
- `src/shared/domain/publicationBuilder.ts`
- `src/shared/domain/weekend.ts`
- `src/shared/types/auth.ts`
- `src/shared/types/automation.ts`
- `src/shared/types/index.ts`
- `src/shared/types/integrations.ts`
- `src/shared/types/match.ts`
- `src/shared/types/photos.ts`
- `src/shared/types/publication.ts`
- `src/shared/types/publishing.ts`
- `src/shared/types/rendering.ts`
- `tests/clientServices.test.ts`
- `tests/domain.test.ts`
- `tests/fixtures/render-baseline.json`
- `tests/fixtures/server-baseline.json`
- `tests/helpers/domainFixtures.ts`
- `tests/helpers/renderHarness.ts`
- `tests/helpers/scenarios.ts`
- `tests/helpers/serverHarness.ts`
- `tests/rendering.test.ts`
- `tests/run.ts`
- `tests/serverParity.test.ts`

Additional documentation: `docs/refactor-baseline.md` and this report.

## Behavior parity and verification limits

No intentional functional change was introduced, and no discrepancy remains in the tested scenarios. Existing endpoint paths, status codes, JSON response shapes, external HTTP requests, persistence formats, storage keys, default TTL/accounting and diagnostic logging match the captured baseline.

Verification: 51 passing tests, TypeScript check, production build and isolated HTTP smoke checks for both frontend serving modes. Nine Canvas trace snapshots were captured from the original renderer before extraction. They test drawing operations with mock image/text metrics, not real-browser pixel equality. Live Twizzit and Instagram publication were not repeated against accounts; the manual checklist records those remaining verification steps.

## Intentionally retained technical debt

- Weekly automation remains a UI/manual simulation with synthetic POSTED logs and no background scheduler.
- Monthly Twizzit accounting reports 500 but has no hard quota enforcement.
- Existing Twizzit home/team/category heuristics, weekday-to-Saturday mapping and time/date interpretation remain.
- Existing sample fixtures, caption dates and renderer fallback date strings remain.
- Empty persisted photo arrays are reseeded; JSON write failures are logged and swallowed.
- Auth keeps its static token/fallback secret and existing endpoint authorization behavior.
- Generated media is uploaded to uguu.se first, with local/configured URL fallback; no cleanup/storage redesign was added.
- Meta polls eight times at two-second intervals and attempts publication after polling timeout.
- Preview download remains PNG; Instagram receives JPEG. No new JPEG download button was added.
- Browser API adapters return Response where needed to retain the existing status and JSON parsing order.

## Future renderer integration point

Implement `MediaRenderer.render(MatchPublication): Promise<RenderedMedia>` and inject it into `RenderingService` at the client preview/composition adapter. The shared publication builder and publication service use normalized matches/settings and have no Canvas drawing dependencies. Canva configuration/OAuth and any required export transport belong in new integration modules. For the existing publishing endpoint, the adapter must provide a JPEG data URL in RenderedMedia.

The Twizzit client/mapper/cache/statistics, photo repository, Meta client/publisher and weekly decision logic need no restructuring. Canvas surface presentation is isolated in `useCanvasPreview`; a future external renderer can add its own preview adapter without moving orchestration back into React components. No Canva code is active or implemented in this refactor.
