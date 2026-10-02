import type { Scenario } from './serverHarness';
import { NOW, STATS } from './serverHarness';
const request = (method: string, path: string, body?: unknown, query?: Record<string, unknown>) => ({ method, path, body, query });
const matches = request('GET', '/api/twizzit/matches', undefined, { startDate: '2026-10-03', endDate: '2026-10-04' });
const publish = request('POST', '/api/instagram/publish', { imageDataUrl: 'data:image/jpeg;base64,YWJj', caption: 'Club caption' });
const cachedMatch = { id: 'cached', day: 'Saturday', time: '10u00', isHome: true };
const cache = (age: number) => ({ matches: { '2026-10-03_2026-10-04_32037': { timestamp: NOW - age * 60000, ttlMinutes: 240, startDate: '2026-10-03', endDate: '2026-10-04', matches: [cachedMatch], rawCount: 1, homeMatchesCount: 1 } } });
export const scenarios: Scenario[] = [
  { name: 'login and verification', requests: [request('POST', '/api/auth/login', { username: ' STAFF ', password: ' secret ' }), request('POST', '/api/auth/login', { username: 'staff', password: 'wrong' }), { ...request('GET', '/api/auth/verify'), headers: { authorization: 'Bearer session' } }, request('GET', '/api/auth/verify'), request('GET', '/api/health')] },
  { name: 'missing auth configuration', env: { APP_AUTH_USER: '' }, requests: [request('POST', '/api/auth/login', {})] },
  { name: 'live matches then cache hit then force refresh', requests: [matches, matches, { ...matches, query: { ...matches.query, force: 'true' } }, request('GET', '/api/twizzit/cache/stats')] },
  { name: 'default weekend', requests: [request('GET', '/api/twizzit/matches')] },
  { name: 'valid persisted match cache', files: { 'data/twizzit-cache.json': cache(239) }, requests: [matches] },
  { name: 'expired persisted match cache', files: { 'data/twizzit-cache.json': cache(240) }, requests: [matches] },
  { name: 'query counting after failed auth', mode: 'auth-error', requests: [matches, request('GET', '/api/twizzit/status')] },
  { name: 'missing Twizzit credentials', env: { TWIZZIT_PASSWORD: '' }, requests: [matches] },
  { name: 'missing Twizzit token', mode: 'missing-token', requests: [matches] },
  { name: 'token refresh buffer', mode: 'expired-token', requests: [matches, { ...matches, query: { ...matches.query, force: 'true' } }] },
  { name: 'events failure is counted', mode: 'events-error', requests: [matches] },
  { name: 'invalid event response', mode: 'invalid-events', requests: [matches] },
  { name: 'season cache and forced refresh', requests: [request('GET', '/api/twizzit/status'), request('GET', '/api/twizzit/status'), request('GET', '/api/twizzit/status', undefined, { force: 'true' })] },
  { name: 'monthly reset and TTL validation', files: { 'data/twizzit-stats.json': { ...STATS, month: '2026-09', queriesCount: 499 } }, requests: [request('GET', '/api/twizzit/cache/stats'), request('POST', '/api/twizzit/cache/ttl', { ttlMinutes: 15 }), request('POST', '/api/twizzit/cache/ttl', { ttlMinutes: 10080 }), request('POST', '/api/twizzit/cache/ttl', { ttlMinutes: 14 }), request('POST', '/api/twizzit/cache/ttl', { ttlMinutes: '240' }), request('POST', '/api/twizzit/cache/clear')] },
  { name: 'photo upload replacement deletion and reset', requests: [request('GET', '/api/photos'), request('POST', '/api/photos', { id: 'uploaded', url: 'data:image/png;base64,YWJj', title: 'Team' }), request('POST', '/api/photos', { id: 'uploaded', url: 'data:image/webp;base64,ZGVm' }), { ...request('DELETE', '/api/photos/:id'), params: { id: 'uploaded' } }, request('POST', '/api/photos/reset')] },
  { name: 'photo validation and empty pool reseeding', files: { 'data/photos.json': [] }, requests: [request('POST', '/api/photos', {}), request('GET', '/api/photos')] },
  { name: 'photo JSON write failures remain swallowed', failWrite: 'photos.json', requests: [request('POST', '/api/photos', { url: '/existing.jpg' }), request('POST', '/api/photos/reset')] },
  { name: 'Instagram status and Story publication', requests: [request('GET', '/api/instagram/status'), publish] },
  { name: 'Instagram feed publication', requests: [{ ...publish, body: { ...(publish.body as object), mediaType: 'POST' } }] },
  { name: 'Instagram missing credentials', env: { INSTAGRAM_ACCESS_TOKEN: '' }, requests: [request('GET', '/api/instagram/status'), publish] },
  { name: 'Instagram invalid images', requests: [request('POST', '/api/instagram/publish', {}), request('POST', '/api/instagram/publish', { imageDataUrl: 'data:image/jpeg,abc' })] },
  ...['container-error', 'missing-container', 'processing-error', 'poll-timeout', 'publish-error'].map(mode => ({ name: `Instagram ${mode}`, mode, requests: [publish] })),
  { name: 'CDN fallback forwarded origin', mode: 'cdn-fallback', requests: [{ ...publish, headers: { 'x-forwarded-host': 'club.example', 'x-forwarded-proto': 'https' } }] },
  { name: 'CDN fallback configured base URL', mode: 'cdn-fallback', env: { APP_BASE_URL: 'https://club.example/' }, requests: [publish] },
];
