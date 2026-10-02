import fs from 'fs';
import path from 'path';
import { config } from '../config/env';
import type { TwizzitStats } from './types';

export const DEFAULT_TTL_MINUTES = 240;
export const MONTHLY_LIMIT = 500;
const STATS_FILE = path.join(config.paths.data, 'twizzit-stats.json');

export function getCurrentMonthStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${y}-${m}`;
}

export function getTwizzitStats(): TwizzitStats {
  const currentMonth = getCurrentMonthStr();
  let stats: TwizzitStats = {
    month: currentMonth,
    queriesCount: 0,
    monthlyLimit: MONTHLY_LIMIT,
    defaultTtlMinutes: DEFAULT_TTL_MINUTES,
    history: []
  };

  try {
    if (fs.existsSync(STATS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8'));
      if (parsed && typeof parsed === 'object') {
        stats = { ...stats, ...parsed };
        // Reset query counter when moving to a new month
        if (stats.month !== currentMonth) {
          stats.month = currentMonth;
          stats.queriesCount = 0;
          stats.history = [];
          fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
        }
      }
    } else {
      fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
    }
  } catch (e) {
    console.error('Error reading twizzit-stats.json:', e);
  }

  return stats;
}

export function recordTwizzitQuery(endpoint: string, description: string): TwizzitStats {
  const stats = getTwizzitStats();
  stats.queriesCount += 1;
  stats.lastQueryAt = new Date().toISOString();
  if (!Array.isArray(stats.history)) {
    stats.history = [];
  }
  stats.history.unshift({
    timestamp: new Date().toISOString(),
    endpoint,
    description
  });
  if (stats.history.length > 40) {
    stats.history = stats.history.slice(0, 40);
  }
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing twizzit-stats.json:', e);
  }
  return stats;
}

export function saveDefaultTtl(ttlMinutes: number) {
  const stats = getTwizzitStats();
  stats.defaultTtlMinutes = ttlMinutes;
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
}
