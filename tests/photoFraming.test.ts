import test from 'node:test';
import assert from 'node:assert/strict';
import { getPhotoPlacement, getPhotoSplit, normalizePhotoFraming, panPhoto, zoomPhotoAtPoint } from '../src/shared/domain/photoFraming';

const centered = { photoZoom: 1, photoOffsetX: 0, photoOffsetY: 0 };
const image = { width: 1600, height: 1200 };
const pane = { width: 475, height: 1920 };
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-8, `${a} differs from ${b}`);

test('legacy settings default to centered cover; framing and split values stay within bounds', () => {
  assert.deepEqual(normalizePhotoFraming({}), centered);
  assert.deepEqual(normalizePhotoFraming({ photoZoom: 9, photoOffsetX: -5, photoOffsetY: 4 }), { photoZoom: 3, photoOffsetX: -1, photoOffsetY: 1 });
  assert.deepEqual(normalizePhotoFraming({ photoZoom: NaN, photoOffsetX: Infinity }), centered);
  assert.equal(getPhotoSplit({ format: 'story', splitRatio: 0 }), 0.44);
  assert.equal(getPhotoSplit({ format: 'square', splitRatio: 0 }), 0.42);
  assert.equal(getPhotoSplit({ format: 'story', splitRatio: 0.1 }), 0.35);
  assert.equal(getPhotoSplit({ format: 'square', splitRatio: 0.9 }), 0.55);
});

test('cover rule holds at every framing extreme across image shapes, formats, split widths and zooms', () => {
  for (const dimensions of [{ width: 1600, height: 1200 }, { width: 600, height: 2400 }, { width: 900, height: 900 }]) {
    for (const height of [1080, 1920]) for (const split of [0.35, 0.42, 0.44, 0.55]) {
      const bounds = { width: Math.round(1080 * split), height };
      for (const photoZoom of [1, 1.1, 2, 3]) for (const photoOffsetX of [-1, 0, 1]) for (const photoOffsetY of [-1, 0, 1]) {
        const placement = getPhotoPlacement(dimensions, bounds, { photoZoom, photoOffsetX, photoOffsetY });
        assert.ok(placement.x <= 1e-8 && placement.y <= 1e-8);
        assert.ok(placement.x + placement.width >= bounds.width - 1e-8);
        assert.ok(placement.y + placement.height >= bounds.height - 1e-8);
      }
    }
  }
});

test('panning follows drag direction and clamps instead of revealing gaps', () => {
  const input = { ...centered, photoZoom: 2 };
  const before = getPhotoPlacement(image, pane, input);
  const moved = panPhoto(image, pane, input, { x: 30, y: -50 });
  const after = getPhotoPlacement(image, pane, moved);
  close(after.x - before.x, 30); close(after.y - before.y, -50);
  const edge = panPhoto(image, pane, moved, { x: 1e6, y: -1e6 });
  assert.equal(edge.photoOffsetX, -1); assert.equal(edge.photoOffsetY, 1);
  const bounds = getPhotoPlacement(image, pane, edge);
  close(bounds.x, 0); close(bounds.y + bounds.height, pane.height);
  // Dragging back from a clamped edge responds immediately.
  assert.ok(panPhoto(image, pane, edge, { x: -5, y: 5 }).photoOffsetX > -1);
});

test('zoom keeps the pointed image location anchored and honors 100–300% limits', () => {
  const anchor = { x: 200, y: 900 };
  const before = getPhotoPlacement(image, pane, centered);
  const zoomed = zoomPhotoAtPoint(image, pane, centered, 2, anchor);
  const after = getPhotoPlacement(image, pane, zoomed);
  close((anchor.x - before.x) / before.width, (anchor.x - after.x) / after.width);
  close((anchor.y - before.y) / before.height, (anchor.y - after.y) / after.height);
  assert.equal(zoomPhotoAtPoint(image, pane, zoomed, 10, anchor).photoZoom, 3);
  assert.equal(zoomPhotoAtPoint(image, pane, zoomed, 0.5, anchor).photoZoom, 1);
});

test('framing presets align image edges; center/reset restore the center crop', () => {
  const enlarged = { ...centered, photoZoom: 2 };
  close(getPhotoPlacement(image, pane, { ...enlarged, photoOffsetX: -1 }).x, 0);
  const right = getPhotoPlacement(image, pane, { ...enlarged, photoOffsetX: 1 });
  close(right.x + right.width, pane.width);
  close(getPhotoPlacement(image, pane, { ...enlarged, photoOffsetY: -1 }).y, 0);
  const bottom = getPhotoPlacement(image, pane, { ...enlarged, photoOffsetY: 1 });
  close(bottom.y + bottom.height, pane.height);
  const reset = getPhotoPlacement(image, pane, centered);
  close(reset.x, (pane.width - reset.width) / 2); close(reset.y, (pane.height - reset.height) / 2);
});

test('relative coordinates survive Story/square changes without opening gaps', () => {
  const framing = { photoZoom: 1.7, photoOffsetX: 0.6, photoOffsetY: -0.4 };
  for (const height of [1920, 1080]) {
    const placement = getPhotoPlacement(image, { width: 475, height }, framing);
    close(-2 * placement.x / placement.overflowX - 1, framing.photoOffsetX);
    close(-2 * placement.y / placement.overflowY - 1, framing.photoOffsetY);
  }
});
