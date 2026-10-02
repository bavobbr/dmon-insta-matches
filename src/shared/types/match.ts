export type MatchCategory = 
  | 'U7' | 'U8' | 'U9' | 'U10' | 'U11' | 'U12' | 'U14' | 'U16' | 'U19' 
  | 'Dames' | 'Heren' | 'Gents' | 'Ladies' | 'Masters' | 'Seniors';

export interface Match {
  id: string;
  twizzitId?: string;
  day: 'Saturday' | 'Sunday';
  dateStr: string; // e.g., "Za 5 september" or "Zo 6 september"
  time: string; // e.g., "10u00", "11u00", "12u15"
  homeTeam: string; // e.g., "D-Mon U10G-1" or "U10G-1"
  awayTeam: string; // e.g., "Baudouin"
  displayMatchText: string; // e.g., "U10G-1 - Baudouin"
  category: MatchCategory;
  isHome: boolean;
  field: string; // e.g., "Veld 1 (Waterveld)", "Veld 2"
  status?: 'scheduled' | 'cancelled' | 'postponed';
  rawEvent?: unknown;
}
