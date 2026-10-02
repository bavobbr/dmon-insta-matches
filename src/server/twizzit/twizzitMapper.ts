import type { Match, MatchCategory } from '../../shared/types/match';
import type { TwizzitEvent } from './types';

// Format Dutch date string: e.g. "Za 12 september"
export function formatDutchDateStr(date: Date): { day: 'Saturday' | 'Sunday'; dateStr: string } {
  const dayNum = date.getDay(); // 0 is Sunday, 6 is Saturday
  const isSunday = dayNum === 0;
  const day: 'Saturday' | 'Sunday' = isSunday ? 'Sunday' : 'Saturday';

  const dayPrefix = isSunday ? 'Zo' : 'Za';
  const dayOfMonth = date.getDate();
  const months = [
    'januari', 'februari', 'maart', 'april', 'mei', 'juni',
    'juli', 'augustus', 'september', 'oktober', 'november', 'december'
  ];
  const monthName = months[date.getMonth()];

  return {
    day,
    dateStr: `${dayPrefix} ${dayOfMonth} ${monthName}`
  };
}

// Categorize team by age or division
export function detectCategory(teamStr: string): MatchCategory {
  const t = teamStr.toUpperCase();
  if (t.includes('U7')) return 'U7';
  if (t.includes('U8')) return 'U8';
  if (t.includes('U9')) return 'U9';
  if (t.includes('U10')) return 'U10';
  if (t.includes('U11')) return 'U11';
  if (t.includes('U12')) return 'U12';
  if (t.includes('U14')) return 'U14';
  if (t.includes('U16')) return 'U16';
  if (t.includes('U19')) return 'U19';
  if (t.includes('DAMES') || t.includes(' D-')) return 'Dames';
  if (t.includes('HEREN') || t.includes(' H-')) return 'Heren';
  if (t.includes('GENTS') || t.includes(' G-')) return 'Gents';
  if (t.includes('LADIES') || t.includes(' L-')) return 'Ladies';
  return 'Seniors';
}

export function mapTwizzitEventToMatch(event: TwizzitEvent): Match {
  const parts = event.name.split(' - ').map((s: string) => s.trim());
  const teamA = parts[0] || '';
  const teamB = parts[1] || '';

  // Check if D-Mon is the home team
  const hasHomeGroupFlag = (event['event-groups'] || []).some((g: any) => g.isHomeTeam);
  const isTeamAHome = teamA.toLowerCase().includes('dendermonde') || teamA.toLowerCase().includes('d-mon');
  const isHome = hasHomeGroupFlag || isTeamAHome;

  // Extract time e.g. "2026-09-12 13:15:00" -> "13u15"
  const dateObj = new Date(event.start.replace(' ', 'T'));
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const mins = dateObj.getMinutes().toString().padStart(2, '0');
  const timeFormatted = `${hours}u${mins}`;

  const { day, dateStr } = formatDutchDateStr(dateObj);
  const category = detectCategory(teamA || teamB);

  // Home and away teams formatted
  const homeTeam = isHome ? teamA : teamB;
  const awayTeam = isHome ? teamB : teamA;
  const displayMatchText = `${teamA} - ${teamB}`;

  return {
    id: `twizzit-${event.id}`,
    twizzitId: String(event.id),
    day,
    dateStr,
    time: timeFormatted,
    homeTeam,
    awayTeam,
    displayMatchText,
    category,
    isHome,
    field: isHome ? (event.address || 'Veld 1 (Waterveld)') : 'Uitwedstrijd',
    status: 'scheduled' as const,
    rawEvent: {
      start: event.start,
      end: event.end,
      address: event.address
    }
  };
}

export function mapTwizzitEventsToMatches(rawEvents: TwizzitEvent[]): Match[] {
  const matchEvents = rawEvents.filter(e => e.name && e.name.includes(' - '));
  const matches = matchEvents.map(mapTwizzitEventToMatch);
  // Sort chronologically
  matches.sort((a, b) => {
    if (a.day !== b.day) {
      return a.day === 'Saturday' ? -1 : 1;
    }
    return a.time.localeCompare(b.time);
  });

  return matches;
}
