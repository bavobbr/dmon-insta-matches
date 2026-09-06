export type MatchCategory = 
  | 'U7' | 'U8' | 'U9' | 'U10' | 'U11' | 'U12' | 'U14' | 'U16' | 'U19' 
  | 'Dames' | 'Heren' | 'Gents' | 'Ladies' | 'Masters';

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
}

export type GraphicFormat = 'story' | 'square'; // 1080x1920 or 1080x1080

export interface GraphicSettings {
  format: GraphicFormat;
  selectedDay: 'Saturday' | 'Sunday' | 'Weekend';
  customTitle: string; // e.g. "Thuismatches"
  customSubtitle?: string; // e.g. "Za 5 & Zo 6 september"
  photoUrl: string;
  volunteerBadgeText: string; // "Bar open dankzij onze vrijwilligers"
  showVolunteerBadge: boolean;
  showFieldLines: boolean;
  showLogo: boolean;
  accentColor: string; // #B62C17
  primaryColor: string; // #06478D
  gradientOverlay: boolean;
  splitRatio: number; // 0.40 to 0.55
  weekendLayout?: 'stacked' | 'columns'; // for Square format when showing both days
}

export interface PhotoPoolItem {
  id: string;
  url: string;
  title: string;
  photographer?: string;
  isUserUploaded?: boolean;
  aspectRatio?: string;
}

export interface TwizzitCacheInfo {
  isCached: boolean;
  cachedAt?: string;
  expiresAt?: string;
  remainingMinutes?: number;
  ttlMinutes: number;
  monthlyQueriesUsed: number;
  monthlyLimit: number;
}

export interface TwizzitConfig {
  clientId: string;
  clientSecret: string;
  apiKey: string;
  organizationId: string;
  clubName: string;
  homeVenueKeyword: string; // "D-Mon", "Dendermonde", "Sint-Gillis"
  useOAuth: boolean;
  isConnected: boolean;
  lastSyncedAt?: string;
  cacheInfo?: TwizzitCacheInfo;
}

export interface InstagramConfig {
  accountId: string;
  accessToken: string;
  pageId: string;
  isConnected: boolean;
  autoPublish: boolean;
  captionTemplate: string;
}

export interface SchedulerConfig {
  enabled: boolean;
  dayOfWeek: number; // 5 = Friday
  timeOfDay: string; // "10:00"
  skipIfNoMatches: boolean;
  notifyOnSkip: boolean;
  lastRunTimestamp?: string;
  lastRunStatus?: 'success' | 'skipped' | 'failed';
  lastRunMessage?: string;
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  triggerType: 'scheduled_weekly' | 'manual_test';
  homeMatchesCount: number;
  decision: 'POSTED' | 'SKIPPED_NO_MATCHES' | 'FAILED_AUTH' | 'PREVIEW_GENERATED';
  details: string;
  graphicUrl?: string;
  instagramPostId?: string;
}

export interface AuthUser {
  username: string;
  displayName: string;
  token: string;
}

