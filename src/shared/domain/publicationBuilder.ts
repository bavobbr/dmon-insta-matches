import type { Match } from '../types/match';
import type { GraphicSettings } from '../types/rendering';
import type { MatchPublication } from '../types/publication';

export function selectHomeMatches(matches: Match[]): Match[] {
  return matches.filter(match => match.isHome);
}

export function buildMatchPublication(matches: Match[], settings: GraphicSettings): MatchPublication {
  const homeMatches = selectHomeMatches(matches);
  const saturdayMatches = homeMatches.filter(match => match.day === 'Saturday');
  const sundayMatches = homeMatches.filter(match => match.day === 'Sunday');
  const activeMatches = settings.selectedDay === 'Sunday' ? sundayMatches
    : settings.selectedDay === 'Saturday' ? saturdayMatches : [...saturdayMatches, ...sundayMatches];
  return { matches: activeMatches, saturdayMatches, sundayMatches, settings };
}
