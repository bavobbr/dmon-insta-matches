export interface TwizzitEvent {
  id: string | number;
  name: string;
  start: string;
  end?: string;
  address?: string;
  'event-groups'?: Array<{ isHomeTeam?: boolean }>;
}

export interface TwizzitStats {
  month: string; // "2026-09"
  queriesCount: number;
  monthlyLimit: number;
  lastQueryAt?: string;
  defaultTtlMinutes: number;
  history: Array<{
    timestamp: string;
    endpoint: string;
    description: string;
  }>;
}

export interface TwizzitCacheStore {
  seasons?: {
    timestamp: number;
    ttlMinutes: number;
    data: any;
  };
  matches: Record<string, {
    timestamp: number;
    ttlMinutes: number;
    startDate: string;
    endDate: string;
    matches: import('../../shared/types/match').Match[];
    rawCount: number;
    homeMatchesCount: number;
  }>;
}
