import type { Match } from '../types/match';

export function groupMatchesByTime(matches: Match[]): { time: string; items: Match[] }[] {
  const groups: { [time: string]: Match[] } = {};
  matches.forEach(m => {
    if (!groups[m.time]) {
      groups[m.time] = [];
    }
    groups[m.time].push(m);
  });

  // Sort times numerically
  return Object.keys(groups)
    .sort((a, b) => {
      const getMinutes = (t: string) => {
        const parts = t.replace('u', ':').split(':');
        return parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10);
      };
      return getMinutes(a) - getMinutes(b);
    })
    .map(time => ({ time, items: groups[time] }));
}
