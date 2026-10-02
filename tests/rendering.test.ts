import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { compileDrawing, renderCases, renderTrace } from './helpers/renderHarness';
import { RenderingService } from '../src/client/services/renderingService';
import { generateWeekendPublication, publishWeekendPublication } from '../src/client/services/publicationService';
import { CanvasRenderer } from '../src/client/rendering/CanvasRenderer';
import { buildMatchPublication } from '../src/shared/domain/publicationBuilder';
import { settings } from './helpers/domainFixtures';

const baseline = JSON.parse(fs.readFileSync(new URL('./fixtures/render-baseline.json', import.meta.url), 'utf8'));
const drawingCode = compileDrawing();
for (const scenario of renderCases) test(`Canvas trace parity: ${scenario.name}`, async () => {
  assert.deepEqual(await renderTrace(await drawingCode, scenario.publication), baseline[scenario.name]);
});

test('publication pipeline uses renderer and publisher interfaces without Canvas details', async () => {
  const publication = buildMatchPublication([], settings);
  const media = { provider: 'test-renderer', mediaType: 'image' as const, mimeType: 'image/jpeg', dataUrl: 'data:image/jpeg;base64,abc' };
  const rendering = new RenderingService({ async render(input) { assert.equal(input, publication); return media; } });
  const result = await generateWeekendPublication(publication, rendering);
  assert.equal(result, media);
  const options = { caption: 'caption', mediaType: 'STORY' };
  const published = await publishWeekendPublication(result, { async publish(input, suppliedOptions) { assert.equal(input, media); assert.equal(suppliedOptions, options); return { success: true, id: 'published' }; } }, options);
  assert.deepEqual(published, { success: true, id: 'published' });
});

test('Canvas capture retains PNG/JPEG encoding and quality', () => {
  const calls: unknown[] = [];
  const canvas = { toDataURL(type: string, quality: number) { calls.push([type, quality]); return `data:${type};base64,abc`; } } as HTMLCanvasElement;
  const renderer = new CanvasRenderer(canvas);
  assert.equal(renderer.captureMedia('image/png').mimeType, 'image/png');
  assert.equal(renderer.captureMedia('image/jpeg').dataUrl, 'data:image/jpeg;base64,abc');
  assert.deepEqual(calls, [['image/png', 1.0], ['image/jpeg', 0.95]]);
});

test('obsolete renders do not overwrite the preview after a framing adjustment', async () => {
  const publication = buildMatchPublication([], { ...settings, photoZoom: 2, photoOffsetX: 0.5 });
  const cancelled = await renderTrace(await drawingCode, publication, () => false);
  assert.equal(cancelled.width, 0);
  assert.equal(cancelled.height, 0);
  const current = await renderTrace(await drawingCode, publication, () => true);
  assert.equal(current.width, 1080);
  assert.equal(current.height, 1920);
});
