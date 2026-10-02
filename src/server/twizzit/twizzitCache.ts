import fs from 'fs';
import path from 'path';
import { config } from '../config/env';
import type { TwizzitCacheStore } from './types';

const CACHE_FILE = path.join(config.paths.data, 'twizzit-cache.json');

export function readTwizzitCache(): TwizzitCacheStore {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      if (parsed && typeof parsed === 'object') {
        if (!parsed.matches) parsed.matches = {};
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading twizzit-cache.json:', e);
  }
  return { matches: {} };
}

export function writeTwizzitCache(cache: TwizzitCacheStore): void {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing twizzit-cache.json:', e);
  }
}

export function clearTwizzitCache(): void {
  const cache: TwizzitCacheStore = { matches: {} };
  writeTwizzitCache(cache);
}

export function getMatchCacheKey(startDate: string, endDate: string, orgId: string): string {
  return `${startDate}_${endDate}_${orgId}`;
}

export function isMatchCacheValid(entry: TwizzitCacheStore['matches'][string], now: number, ttlMinutes: number, force = false): boolean {
  return !force && Math.floor((now - entry.timestamp) / 60000) < (entry.ttlMinutes || ttlMinutes);
}
