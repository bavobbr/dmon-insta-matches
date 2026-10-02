import test from 'node:test';
import assert from 'node:assert/strict';
import { detectCategory, formatDutchDateStr, mapTwizzitEventToMatch, mapTwizzitEventsToMatches } from '../src/server/twizzit/twizzitMapper';
import { groupMatchesByTime } from '../src/shared/domain/matchGrouping';
import { buildMatchPublication } from '../src/shared/domain/publicationBuilder';
import { getWeekendRange } from '../src/shared/domain/weekend';
import { getMatchCacheKey, isMatchCacheValid } from '../src/server/twizzit/twizzitCache';

import { match, settings } from './helpers/domainFixtures';

test('Twizzit event parsing, home detection and padded time preserve existing fields', () => {
  const mapped = mapTwizzitEventToMatch({ id: 12, name: ' Dendermonde U12G-1 - Gantoise ', start: '2026-10-03 09:05:00', address: 'Veld 2' });
  assert.deepEqual(mapped, { ...match(), id: 'twizzit-12', twizzitId: '12', time: '09u05', homeTeam: 'Dendermonde U12G-1', displayMatchText: 'Dendermonde U12G-1 - Gantoise', field: 'Veld 2', rawEvent: { start: '2026-10-03 09:05:00', end: undefined, address: 'Veld 2' } });
  const away = mapTwizzitEventToMatch({ id: 13, name: 'Antwerp - D-Mon Dames 1', start: '2026-10-04 12:15:00' });
  assert.equal(away.isHome, false);
  assert.equal(away.homeTeam, 'D-Mon Dames 1');
  assert.equal(away.awayTeam, 'Antwerp');
  assert.equal(away.category, 'Seniors'); // Existing category detection uses team A first.
  assert.equal(away.field, 'Uitwedstrijd');
  assert.equal(away.day, 'Sunday');
  assert.equal(away.dateStr, 'Zo 4 oktober');
  const flagged = mapTwizzitEventToMatch({ id: 14, name: 'Antwerp - D-Mon', start: '2026-10-03 12:00:00', 'event-groups': [{ isHomeTeam: true }] });
  assert.equal(flagged.isHome, true);
  assert.equal(flagged.homeTeam, 'Antwerp');
  assert.equal(flagged.field, 'Veld 1 (Waterveld)');
});

test('category detection preserves age/division precedence and fallback', () => {
  for (const category of ['U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U14', 'U16', 'U19', 'Dames', 'Heren', 'Gents', 'Ladies']) assert.equal(detectCategory(`D-Mon ${category} 1`), category);
  assert.equal(detectCategory('D-Mon D-1'), 'Dames');
  assert.equal(detectCategory('D-Mon H-1'), 'Heren');
  assert.equal(detectCategory('Masters'), 'Seniors');
  assert.equal(formatDutchDateStr(new Date(2026, 9, 2)).day, 'Saturday'); // Weekdays deliberately retain current semantics.
});

test('mapping filters non-fixtures and sorts Saturday/Sunday then kickoff time', () => {
  const events = [
    { id: 1, name: 'D-Mon - A', start: '2026-10-04 08:00:00' },
    { id: 2, name: 'D-Mon - B', start: '2026-10-03 12:00:00' },
    { id: 3, name: 'D-Mon - C', start: '2026-10-03 09:00:00' },
    { id: 4, name: 'Training', start: '2026-10-03 08:00:00' },
  ];
  assert.deepEqual(mapTwizzitEventsToMatches(events).map(m => m.twizzitId), ['3', '2', '1']);
  assert.equal(events[0].id, 1);
});

test('time grouping sorts numerically while retaining input order within groups', () => {
  const matches = [match({ id: 'a', time: '12u15' }), match({ id: 'b', time: '9u00' }), match({ id: 'c', time: '12u15' }), match({ id: 'd', time: '10:30' })];
  const grouped = groupMatchesByTime(matches);
  assert.deepEqual(grouped.map(g => g.time), ['9u00', '10:30', '12u15']);
  assert.deepEqual(grouped[2].items.map(m => m.id), ['a', 'c']);
  assert.deepEqual(groupMatchesByTime([]), []);
  assert.equal(matches[0].id, 'a');
});

test('publication builder filters home fixtures and preserves day lists, ordering and settings', () => {
  const saturday = match({ id: 'sat' });
  const sunday = match({ id: 'sun', day: 'Sunday' });
  const away = match({ id: 'away', isHome: false });
  const publication = buildMatchPublication([sunday, away, saturday], settings);
  assert.deepEqual(publication.matches, [saturday, sunday]);
  assert.deepEqual(publication.saturdayMatches, [saturday]);
  assert.deepEqual(publication.sundayMatches, [sunday]);
  assert.equal(publication.settings, settings);
  assert.deepEqual(buildMatchPublication([saturday, sunday], { ...settings, selectedDay: 'Sunday' }).matches, [sunday]);
  assert.deepEqual(buildMatchPublication([away], settings).matches, []);
});

test('match cache keys, expiry boundary, entry TTL precedence and forced refresh', () => {
  assert.equal(getMatchCacheKey('2026-10-03', '2026-10-04', '32037'), '2026-10-03_2026-10-04_32037');
  const entry = { timestamp: 1000, ttlMinutes: 240, startDate: '', endDate: '', matches: [], rawCount: 0, homeMatchesCount: 0 };
  assert.equal(isMatchCacheValid(entry, 1000 + 240 * 60000 - 1, 15), true);
  assert.equal(isMatchCacheValid(entry, 1000 + 240 * 60000, 10080), false);
  assert.equal(isMatchCacheValid(entry, 1000, 240, true), false);
  assert.equal(isMatchCacheValid({ ...entry, ttlMinutes: 0 }, 1000 + 16 * 60000, 15), false);
});

test('weekend dates cover Friday, active weekend, month/year rollover and DST', () => {
  const cases = [
    [2026, 10, 2, 0, '2026-10-03', '2026-10-04'], [2026, 10, 2, -1, '2026-09-26', '2026-09-27'],
    [2026, 10, 2, 1, '2026-10-10', '2026-10-11'], [2026, 10, 4, 0, '2026-10-03', '2026-10-04'],
    [2026, 10, 30, 0, '2026-10-31', '2026-11-01'], [2026, 12, 31, 0, '2027-01-02', '2027-01-03'],
    [2026, 3, 29, 0, '2026-03-28', '2026-03-29'], [2026, 10, 25, 0, '2026-10-24', '2026-10-25'],
  ] as const;
  for (const [year, month, day, offset, start, end] of cases) {
    const result = getWeekendRange(new Date(year, month - 1, day, 0, 30), offset);
    assert.equal(result.startDate, start); assert.equal(result.endDate, end);
  }
});
