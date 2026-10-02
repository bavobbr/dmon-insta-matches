import type { Match, GraphicSettings } from '../../src/shared/types';

export const settings: GraphicSettings = {
  format: 'story', selectedDay: 'Weekend', customTitle: 'Thuismatches', customSubtitle: 'Weekend 03/10 & 04/10',
  photoUrl: '/photos/photo-1.jpg', volunteerBadgeText: 'Bar open dankzij onze\nvrijwilligers', showVolunteerBadge: true,
  showFieldLines: true, showLogo: true, accentColor: '#B62C17', primaryColor: '#06478D', gradientOverlay: false,
  splitRatio: 0.46, weekendLayout: 'columns',
};
export function match(overrides: Partial<Match> = {}): Match {
  return { id: '1', day: 'Saturday', dateStr: 'Za 3 oktober', time: '10u00', homeTeam: 'D-Mon U12G-1', awayTeam: 'Gantoise', displayMatchText: 'D-Mon U12G-1 - Gantoise', category: 'U12', isHome: true, field: 'Veld 1 (Waterveld)', status: 'scheduled', ...overrides };
}

