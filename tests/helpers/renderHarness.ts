import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import type { RenderRequest } from '../../src/shared/types/rendering';
import { match, settings } from './domainFixtures';
import { buildMatchPublication } from '../../src/shared/domain/publicationBuilder';

export const renderCases = [
  ...(['story', 'square'] as const).flatMap(format => (['Saturday', 'Sunday', 'Weekend'] as const).map(selectedDay => ({ name: `${format} ${selectedDay}`, publication: buildMatchPublication([match(), match({ id: '2', day: 'Sunday', dateStr: 'Zo 4 oktober', time: '12u15' })], { ...settings, format, selectedDay }) }))),
  { name: 'square stacked weekend', publication: buildMatchPublication([match(), match({ day: 'Sunday' })], { ...settings, format: 'square' as const, weekendLayout: 'stacked' as const, gradientOverlay: true }) },
  { name: 'empty weekend', publication: buildMatchPublication([], settings) },
  { name: 'crowded weekend', publication: buildMatchPublication(Array.from({ length: 22 }, (_, i) => match({ id: String(i), day: i % 2 ? 'Sunday' : 'Saturday', time: `${String(8 + i % 9).padStart(2, '0')}u00`, category: i % 3 ? 'U12' : 'Dames', displayMatchText: i % 3 ? `U12G-${i} - A long opponent name` : 'Dames 1 - Dragons' })), settings) },
];

export async function compileDrawing(baselineSource?: string) {
  return (await build({
    stdin: { contents: baselineSource ?? fs.readFileSync('src/client/rendering/canvas/drawing.ts', 'utf8'), resolveDir: path.resolve(baselineSource ? 'src/utils' : 'src/client/rendering/canvas'), loader: 'ts' },
    bundle: true, platform: 'node', format: 'cjs', write: false,
  })).outputFiles[0].text;
}

export async function renderTrace(code: string, publication: RenderRequest, shouldCommit?: () => boolean) {
  const trace: unknown[] = [];
  let nextCanvas = 0;
  const hash = (value: string) => createHash('sha256').update(value).digest('hex');
  const simplify = (value: any): any => value?._canvasId ? { canvas: value._canvasId, width: value.width, height: value.height }
    : value?._image ? { image: hash(value.src) } : value;
  const createCanvas = () => {
    const id = ++nextCanvas;
    const context = new Proxy({} as any, {
      get(_target, name) {
        if (name === 'measureText') return (text: string) => { trace.push([id, name, text]); return { width: text.length * 10 }; };
        if (name === 'createLinearGradient') return (...args: any[]) => { trace.push([id, name, ...args]); return { addColorStop: (...values: any[]) => trace.push([id, 'addColorStop', ...values]) }; };
        return (...args: any[]) => trace.push([id, name, ...args.map(simplify)]);
      },
      set(_target, name, value) { trace.push([id, name, typeof value === 'object' ? 'gradient' : value]); return true; },
    });
    return { _canvasId: id, width: 0, height: 0, getContext: () => context };
  };
  class Image {
    _image = true;
    width = 1600; height = 1200; naturalWidth = 1600; naturalHeight = 1200; complete = true;
    onload?: Function;
    _src = '';
    get src() { return this._src; }
    set src(value: string) { this._src = value; this.onload?.(); }
  }
  const module = { exports: {} as any };
  vm.runInNewContext(code, { module, exports: module.exports, Image, document: { createElement: createCanvas }, console });
  const canvas = createCanvas();
  await module.exports.renderGraphicToCanvas({ canvas, ...publication, shouldCommit });
  return { width: canvas.width, height: canvas.height, operations: trace.length, hash: hash(JSON.stringify(trace)) };
}
