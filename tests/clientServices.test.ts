import test from 'node:test';
import assert from 'node:assert/strict';
import { twizzitApi } from '../src/client/services/twizzitApi';
import { authApi } from '../src/client/services/authApi';
import { photosApi } from '../src/client/services/photosApi';
import { InstagramApiPublisher } from '../src/client/publishing/InstagramApiPublisher';
import { runWeeklySimulation } from '../src/client/automation/weeklySimulationService';
import { saveGraphicSettings, loadGraphicSettings, saveActivePhotoId, loadActivePhotoId } from '../src/client/persistence/photoStorage';
import { match, settings } from './helpers/domainFixtures';

test('frontend API services retain URLs, query flags and serialized request bodies', async t => {
  const requests: unknown[] = [];
  const response = { ok: true } as Response;
  t.mock.method(globalThis, 'fetch', async (url: unknown, init?: RequestInit) => { requests.push([url, init]); return response; });
  assert.equal(await twizzitApi.getMatches('2026-10-03', '2026-10-04'), response);
  await twizzitApi.getMatches('2026-10-03', '2026-10-04', true);
  await twizzitApi.getStatus(); await twizzitApi.clearCache(); await twizzitApi.updateDefaultTtl(240);
  await authApi.login(' staff ', ' password ');
  await photosApi.delete('photo with/slash');
  assert.deepEqual(requests, [
    ['/api/twizzit/matches?startDate=2026-10-03&endDate=2026-10-04', undefined],
    ['/api/twizzit/matches?startDate=2026-10-03&endDate=2026-10-04&force=true', undefined],
    ['/api/twizzit/status', undefined], ['/api/twizzit/cache/clear', { method: 'POST' }],
    ['/api/twizzit/cache/ttl', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"ttlMinutes":240}' }],
    ['/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"username":"staff","password":"password"}' }],
    ['/api/photos/photo%20with%2Fslash', { method: 'DELETE' }],
  ]);
});

test('browser publisher passes JPEG through unchanged and keeps existing error precedence', async t => {
  const media = { provider: 'canvas', mediaType: 'image' as const, mimeType: 'image/jpeg', dataUrl: 'data:image/jpeg;base64,YWJj' };
  const requests: any[] = [];
  let fail = false;
  t.mock.method(console, 'log', () => {});
  t.mock.method(globalThis, 'fetch', async (url: unknown, options: RequestInit) => {
    requests.push([url, JSON.parse(options.body as string)]);
    return { ok: !fail, json: async () => fail ? { success: false, error: 'Generic', metaError: { message: 'Meta detail' } } : { success: true, id: 'published' } } as Response;
  });
  const publisher = new InstagramApiPublisher();
  assert.deepEqual(await publisher.publish(media, { mediaType: 'STORY', caption: 'caption' }), { success: true, id: 'published' });
  assert.deepEqual(requests[0], ['/api/instagram/publish', { mediaType: 'STORY', caption: 'caption', imageDataUrl: media.dataUrl }]);
  fail = true;
  await assert.rejects(publisher.publish(media), /Meta detail/);
});

test('weekly simulation skips empty matches and never sends a publishing request', async t => {
  const urls: unknown[] = [];
  t.mock.method(globalThis, 'fetch', async (url: unknown) => { urls.push(url); return { json: async () => ({ matches: [] }) } as Response; });
  let randomized = 0;
  const result = await runWeeklySimulation({ startDate: '2026-10-03', endDate: '2026-10-04', fallbackMatches: [match()], randomizePhoto: () => randomized++ });
  assert.equal(result.log.decision, 'SKIPPED_NO_MATCHES');
  assert.equal(result.homeMatchesCount, 0);
  assert.equal(randomized, 0);
  assert.equal(result.log.details, '0 thuismatchen gedetecteerd in Twizzit voor weekend 2026-10-03. Publicatie geannuleerd/overgeslagen conform regel!');
  assert.deepEqual(urls, ['/api/twizzit/matches?startDate=2026-10-03&endDate=2026-10-04']);
});

test('weekly simulation retains fallback fixtures, photo randomization and synthetic POSTED log', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({ ok: false, json: async () => ({ success: false, error: 'Failed' }) }) as Response);
  let randomized = 0;
  const result = await runWeeklySimulation({ startDate: '2026-10-03', endDate: '2026-10-04', fallbackMatches: [match(), match({ isHome: false })], randomizePhoto: () => randomized++ });
  assert.equal(result.log.decision, 'POSTED');
  assert.equal(result.log.triggerType, 'manual_test');
  assert.equal(result.homeMatchesCount, 1);
  assert.equal(randomized, 1);
  assert.match(result.log.instagramPostId!, /^ig_\d+$/);
  assert.equal(result.log.details, '1 thuismatchen gedetecteerd in Twizzit. Story gegenereerd & gepost naar @dmon_hockey!');
});

test('browser settings retain localStorage keys and large data URL handling', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const stored = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { setItem: (key: string, value: string) => stored.set(key, value), getItem: (key: string) => stored.get(key) ?? null } });
  try {
    saveGraphicSettings(settings);
    assert.deepEqual(loadGraphicSettings(), settings);
    assert.ok(stored.has('dmon_graphic_settings'));
    saveActivePhotoId('photo-2');
    assert.equal(loadActivePhotoId(), 'photo-2');
    assert.equal(stored.get('dmon_active_photo_id'), 'photo-2');
    saveGraphicSettings({ ...settings, photoUrl: 'data:image/jpeg;base64,' + 'a'.repeat(50001) });
    assert.equal(loadGraphicSettings()?.photoUrl, '');
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
