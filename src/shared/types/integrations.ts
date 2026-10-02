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
