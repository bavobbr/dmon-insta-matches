import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { compileServer, runScenario } from './helpers/serverHarness';
import { scenarios } from './helpers/scenarios';

// Captured from the original server before extraction; do not regenerate from new code.
const baseline = JSON.parse(fs.readFileSync(new URL('./fixtures/server-baseline.json', import.meta.url), 'utf8'));
const code = compileServer();
for (const scenario of scenarios) {
  test(`API parity: ${scenario.name}`, async () => {
    assert.deepEqual(await runScenario(await code, scenario), baseline[scenario.name]);
  });
}
