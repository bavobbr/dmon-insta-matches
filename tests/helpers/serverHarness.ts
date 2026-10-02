import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
export const NOW = Date.parse('2026-10-02T10:00:00Z');
export const EVENTS = [
  { id: 2, name: 'D-Mon U12G-1 - Gantoise', start: '2026-10-04 12:15:00', end: '2026-10-04 13:15:00', address: 'Veld 2' },
  { id: 1, name: 'Dendermonde Heren 1 - Dragons', start: '2026-10-03 09:05:00' },
  { id: 3, name: 'Antwerp - D-Mon Dames 1', start: '2026-10-03 14:00:00' },
  { id: 4, name: 'Training', start: '2026-10-03 08:00:00' },
];
export const STATS = { month: '2026-10', queriesCount: 7, monthlyLimit: 500, defaultTtlMinutes: 240, history: [] };

export interface Scenario {
  name: string;
  requests: Array<{ method: string; path: string; query?: Record<string, unknown>; body?: unknown; params?: Record<string, string>; headers?: Record<string, string> }>;
  env?: Record<string, string>;
  files?: Record<string, unknown>;
  mode?: string;
  failWrite?: string;
}

export async function compileServer(baselineSource?: string) {
  const result = await build({
    stdin: { contents: baselineSource ?? fs.readFileSync('server.ts', 'utf8'), resolveDir: process.cwd(), sourcefile: 'server.ts', loader: 'ts' },
    bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  });
  return result.outputFiles[0].text;
}

// Execute real route registration with isolated files, clock and external HTTP.
// No sockets, credentials, live API calls or application data are used.
export async function runScenario(code: string, scenario: Scenario) {
  const routes = new Map<string, Function>();
  const calls: unknown[] = [];
  const logs: unknown[] = [];
  const writes: unknown[] = [];
  const files = new Map<string, string | Buffer>();
  for (const [name, value] of Object.entries({ 'data/twizzit-stats.json': STATS, ...scenario.files })) {
    files.set(path.join('/app', name), typeof value === 'string' ? value : JSON.stringify(value));
  }
  const statics: unknown[] = [];
  const app: any = {
    use(...args: any[]) { if (args.at(-1)?.staticPath) statics.push([typeof args[0] === 'string' ? args[0] : '/', args.at(-1).staticPath]); },
    listen(_port: number, _host: string, callback: Function) { callback(); },
  };
  for (const method of ['get', 'post', 'delete']) app[method] = (route: string, handler: Function) => routes.set(`${method.toUpperCase()} ${route}`, handler);
  const express = Object.assign(() => app, { json() {}, urlencoded() {}, static(staticPath: string) { return { staticPath }; } });
  const mockFs = {
    existsSync: (file: string) => !path.extname(file) || files.has(file),
    mkdirSync() {},
    readFileSync(file: string) { if (!files.has(file)) throw new Error('missing fixture file'); return files.get(file); },
    writeFileSync(file: string, data: string | Buffer) {
      if (scenario.failWrite && file.includes(scenario.failWrite)) throw new Error('fixture disk write failed');
      files.set(file, data); writes.push([file.replace('/app/', ''), Buffer.isBuffer(data) ? { base64: data.toString('base64') } : data]);
    },
    unlinkSync(file: string) { files.delete(file); writes.push(['delete', file.replace('/app/', '')]); },
  };
  class Clock extends Date {
    constructor(...args: any[]) { if (!args.length) super(NOW); else super(...args as [any]); }
    static now() { return NOW; }
  }
  const env = { NODE_ENV: 'production', APP_AUTH_USER: 'Staff', APP_AUTH_PASSWORD: 'secret', AUTH_SECRET_TOKEN: 'session', TWIZZIT_USERNAME: 'tw-user', TWIZZIT_PASSWORD: 'tw-pass', TWIZZIT_ORG_ID: '32037', INSTAGRAM_ACCOUNT_ID: 'ig-account', INSTAGRAM_ACCESS_TOKEN: 'ig-token', ...scenario.env };
  let authCount = 0;
  const mockFetch = async (input: any, init: any = {}) => {
    const url = String(input);
    let body: unknown = init.body;
    if (body instanceof URLSearchParams) body = [...body.entries()];
    if (body instanceof FormData) body = [...body.entries()].map(([key, value]) => [key, typeof value === 'string' ? value : { name: value.name, size: value.size, type: value.type }]);
    calls.push({ url, method: init.method || 'GET', headers: init.headers, body });
    let data: any; let status = 200;
    if (url.includes('/authenticate')) {
      authCount++;
      if (scenario.mode === 'auth-error') { status = 401; data = { error: 'Invalid credentials' }; }
      else if (scenario.mode === 'missing-token') data = {};
      else data = { token: 'tw-token', 'valid-till': scenario.mode === 'expired-token' && authCount === 1 ? NOW / 1000 + 59 : NOW / 1000 + 1800 };
    } else if (url.includes('/seasons')) data = [{ name: '2026-2027', 'current-organizations': ['32037'] }];
    else if (url.includes('/events')) {
      if (scenario.mode === 'events-error') { status = 503; data = { error: 'unavailable' }; }
      else data = scenario.mode === 'invalid-events' ? { error: 'unexpected' } : EVENTS;
    } else if (url.includes('uguu.se')) data = scenario.mode === 'cdn-fallback' ? { success: false } : { success: true, files: [{ url: 'https://cdn.example/image.jpg' }] };
    else if (url.includes('/media_publish')) {
      data = scenario.mode === 'publish-error' ? { error: { message: 'Publish rejected' } } : { id: 'ig-published' };
    } else if (url.includes('/media')) {
      data = scenario.mode === 'container-error' ? { error: { message: 'Container rejected' } } : scenario.mode === 'missing-container' ? {} : { id: 'ig-container' };
    } else data = scenario.mode === 'processing-error' ? { status_code: 'ERROR', status: 'Processing rejected' } : { status_code: scenario.mode === 'poll-timeout' ? 'IN_PROGRESS' : 'FINISHED' };
    return { ok: status < 400, status, json: async () => data, text: async () => JSON.stringify(data) };
  };
  const context = {
    require(name: string) {
      if (name === 'dotenv/config') return {};
      if (name === 'express') return express;
      if (name === 'fs') return mockFs;
      if (name === 'vite') return {};
      return require(name);
    },
    process: { env, cwd: () => '/app' }, Date: Clock,
    console: Object.fromEntries(['log', 'warn', 'error'].map(level => [level, (...args: any[]) => logs.push([level, ...args.map(arg => arg?.message && arg?.stack ? arg.message : arg)])])),
    fetch: mockFetch, URL, URLSearchParams, Buffer, Blob, FormData,
    setTimeout: (callback: Function) => { callback(); return 0; },
  };
  vm.runInNewContext(code, context);
  const responses: unknown[] = [];
  for (const request of scenario.requests) {
    const req = { query: request.query || {}, body: request.body, params: request.params || {}, headers: request.headers || {}, protocol: 'http', get(name: string) { return this.headers[name]; } };
    let status = 200; let body: unknown;
    const res = { status(value: number) { status = value; return this; }, json(value: unknown) { body = value; return this; } };
    try { await routes.get(`${request.method} ${request.path}`)!(req, res); responses.push({ status, body }); }
    catch (err: any) { responses.push({ unhandled: err.message }); }
  }
  return JSON.parse(JSON.stringify({ routes: [...routes.keys()], statics, responses, calls, writes, logs }));
}
