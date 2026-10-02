import { getTwizzitConfig } from '../config/env';
import { getWeekendRange } from '../../shared/domain/weekend';
import { ServiceError } from '../errors/ServiceError';
import { getTwizzitStats, recordTwizzitQuery, DEFAULT_TTL_MINUTES, saveDefaultTtl } from './twizzitStats';
import { readTwizzitCache, writeTwizzitCache, clearTwizzitCache, getMatchCacheKey, isMatchCacheValid } from './twizzitCache';
import { getTwizzitToken } from './twizzitAuth';
import { fetchSeasons, fetchEvents } from './twizzitClient';
import { mapTwizzitEventsToMatches } from './twizzitMapper';

export async function getStatus(options: { force?: boolean } = {}) {
  const config = getTwizzitConfig();
  const cache = readTwizzitCache();
  const now = Date.now();
  const stats = getTwizzitStats();
  const force = options.force;

  // Query active season from cache if available (24h TTL = 1440 min)
  if (!force && cache.seasons && (now - cache.seasons.timestamp) < cache.seasons.ttlMinutes * 60000) {
    return {
      success: true,
      orgId: config.orgId,
      username: config.username,
      connected: true,
      tokenActive: true,
      currentSeason: cache.seasons.data,
      cached: true,
      cachedAt: new Date(cache.seasons.timestamp).toISOString(),
      monthlyQueriesUsed: stats.queriesCount,
      monthlyLimit: stats.monthlyLimit
    };
  }

  // Otherwise fetch live from Twizzit (consumes 1 query)
  const token = await getTwizzitToken();
  recordTwizzitQuery('/v2/api/seasons', 'Actief seizoen ophalen');

  const seasons = await fetchSeasons(token, config.orgId);
  const currentSeason = Array.isArray(seasons)
    ? seasons.find((s: any) => s['current-organizations'] && s['current-organizations'].includes(config.orgId)) || seasons[seasons.length - 1]
    : null;

  // Cache seasons for 24h (1440 min)
  cache.seasons = {
    timestamp: now,
    ttlMinutes: 1440,
    data: currentSeason
  };
  writeTwizzitCache(cache);

  const updatedStats = getTwizzitStats();

  return {
    success: true,
    orgId: config.orgId,
    username: config.username,
    connected: true,
    tokenActive: !!token,
    currentSeason,
    cached: false,
    cachedAt: new Date(now).toISOString(),
    monthlyQueriesUsed: updatedStats.queriesCount,
    monthlyLimit: updatedStats.monthlyLimit
  };
}

export async function getMatches(options: { force?: boolean; ttl?: unknown; startDate?: string; endDate?: string } = {}) {
  const config = getTwizzitConfig();
  const stats = getTwizzitStats();
  const cache = readTwizzitCache();
  const forceRefresh = options.force;

  // Parse requested TTL or use stats default
  const ttlMinutes = options.ttl 
    ? parseInt(options.ttl as string, 10) 
    : (stats.defaultTtlMinutes || DEFAULT_TTL_MINUTES);

  // Determine target weekend date range
  let startDate = options.startDate as string;
  let endDate = options.endDate as string;

  if (!startDate || !endDate) {
    const weekend = getWeekendRange();
    startDate = weekend.startDate;
    endDate = weekend.endDate;
  }

  const cacheKey = getMatchCacheKey(startDate, endDate, config.orgId);
  const cachedEntry = cache.matches[cacheKey];
  const now = Date.now();

  // 1. Check if we have a valid cached response (consumes 0 API queries!)
  if (!forceRefresh && cachedEntry) {
    const elapsedMinutes = Math.floor((now - cachedEntry.timestamp) / 60000);
    const activeTtl = cachedEntry.ttlMinutes || ttlMinutes;
    if (isMatchCacheValid(cachedEntry, now, ttlMinutes)) {
      const homeMatches = cachedEntry.matches.filter(m => m.isHome);
      return {
        success: true,
        queryRange: { startDate, endDate },
        totalMatchesCount: cachedEntry.matches.length,
        homeMatchesCount: homeMatches.length,
        matches: cachedEntry.matches,
        homeMatches,
        cached: true,
        cachedAt: new Date(cachedEntry.timestamp).toISOString(),
        expiresAt: new Date(cachedEntry.timestamp + activeTtl * 60000).toISOString(),
        remainingMinutes: Math.max(0, activeTtl - elapsedMinutes),
        ttlMinutes: activeTtl,
        monthlyQueriesUsed: stats.queriesCount,
        monthlyLimit: stats.monthlyLimit,
        cacheKey
      };
    }
  }

  // 2. Live Fetch: Consumes 1 query from monthly 500 limit
  const token = await getTwizzitToken();
  recordTwizzitQuery('/v2/api/events', `Matchen voor ${startDate} t/m ${endDate}`);

  const rawEvents = await fetchEvents(token, config.orgId, startDate, endDate);

  const matches = mapTwizzitEventsToMatches(rawEvents);

  const homeMatches = matches.filter(m => m.isHome);

  // 3. Save result in cache
  cache.matches[cacheKey] = {
    timestamp: now,
    ttlMinutes,
    startDate,
    endDate,
    matches,
    rawCount: rawEvents.length,
    homeMatchesCount: homeMatches.length
  };
  writeTwizzitCache(cache);

  const updatedStats = getTwizzitStats();

  return {
    success: true,
    queryRange: { startDate, endDate },
    totalMatchesCount: matches.length,
    homeMatchesCount: homeMatches.length,
    matches,
    homeMatches,
    cached: false,
    cachedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttlMinutes * 60000).toISOString(),
    remainingMinutes: ttlMinutes,
    ttlMinutes,
    monthlyQueriesUsed: updatedStats.queriesCount,
    monthlyLimit: updatedStats.monthlyLimit,
    cacheKey
  };
}

export function clearCache() {
  clearTwizzitCache();
  const stats = getTwizzitStats();
  return {
    success: true,
    message: 'Twizzit cache succesvol gewist.',
    monthlyQueriesUsed: stats.queriesCount,
    monthlyLimit: stats.monthlyLimit
  };
}

export function getCacheStats() {
  const stats = getTwizzitStats();
  const cache = readTwizzitCache();
  const cachedKeys = Object.keys(cache.matches);
  return {
    success: true,
    stats,
    cachedRangesCount: cachedKeys.length,
    cachedRanges: cachedKeys.map(k => {
      const item = cache.matches[k];
      const elapsed = Math.floor((Date.now() - item.timestamp) / 60000);
      return {
        key: k,
        startDate: item.startDate,
        endDate: item.endDate,
        matchesCount: item.matches.length,
        homeMatchesCount: item.homeMatchesCount,
        cachedAt: new Date(item.timestamp).toISOString(),
        ttlMinutes: item.ttlMinutes,
        remainingMinutes: Math.max(0, item.ttlMinutes - elapsed)
      };
    })
  };
}

export function updateDefaultTtl(ttlMinutes: unknown) {

  if (typeof ttlMinutes === 'number' && ttlMinutes >= 15 && ttlMinutes <= 10080) {
    saveDefaultTtl(ttlMinutes);
    return { success: true, defaultTtlMinutes: ttlMinutes };
  }
  throw new ServiceError(400, { success: false, error: 'Ongeldige TTL waarde (15 - 10080 minuten toegestaan)' });
}
