import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ----------------------------------------------------
// PERSISTENT DATA & TWIZZIT API RATE LIMIT / CACHE STORE
// Twizzit API limit: 500 queries per month
// ----------------------------------------------------
const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const GENERATED_DIR = path.join(process.cwd(), 'public', 'generated');
const PHOTOS_FILE = path.join(DATA_DIR, 'photos.json');
const STATS_FILE = path.join(DATA_DIR, 'twizzit-stats.json');
const CACHE_FILE = path.join(DATA_DIR, 'twizzit-cache.json');
const DEFAULT_TTL_MINUTES = 240; // 4 hours sensible default
const MONTHLY_LIMIT = 500;

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(GENERATED_DIR)) {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
}

// Instagram Graph API Credentials
const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID || '';
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || '';

// App Access Credentials (Configure via APP_AUTH_USER and APP_AUTH_PASSWORD env vars)
const APP_AUTH_USER = process.env.APP_AUTH_USER || 'dmon';
const APP_AUTH_PASSWORD = process.env.APP_AUTH_PASSWORD || '9200';
// Session token secret (can be overridden via AUTH_SECRET_TOKEN env var)
const AUTH_SECRET_TOKEN = process.env.AUTH_SECRET_TOKEN || 'dmon_auth_session_token_9200_valid';

interface TwizzitStats {
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

interface TwizzitCacheStore {
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
    matches: any[];
    rawCount: number;
    homeMatchesCount: number;
  }>;
}

function getCurrentMonthStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${y}-${m}`;
}

function getTwizzitStats(): TwizzitStats {
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

function recordTwizzitQuery(endpoint: string, description: string): TwizzitStats {
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

function readTwizzitCache(): TwizzitCacheStore {
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

function writeTwizzitCache(cache: TwizzitCacheStore): void {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing twizzit-cache.json:', e);
  }
}

function clearTwizzitCache(): void {
  const cache: TwizzitCacheStore = { matches: {} };
  writeTwizzitCache(cache);
}

// In-memory token cache for Twizzit
let twizzitTokenCache: {
  token: string;
  validTill: number;
} | null = null;

// Twizzit API Configuration
function getTwizzitConfig() {
  return {
    username: process.env.TWIZZIT_USERNAME || '',
    password: process.env.TWIZZIT_PASSWORD || '',
    orgId: process.env.TWIZZIT_ORG_ID || '32037'
  };
}

// Authenticate and get Bearer JWT
async function getTwizzitToken(): Promise<string> {
  const nowUnix = Math.floor(Date.now() / 1000);
  if (twizzitTokenCache && twizzitTokenCache.validTill > nowUnix + 60) {
    return twizzitTokenCache.token;
  }

  const { username, password } = getTwizzitConfig();

  if (!username || !password) {
    throw new Error('Twizzit credentials (TWIZZIT_USERNAME of TWIZZIT_PASSWORD) ontbreken in de omgevingsvariabelen.');
  }

  const response = await fetch('https://app.twizzit.com/v2/api/authenticate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      username,
      password
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twizzit authentication failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  if (!data.token) {
    throw new Error('No token returned from Twizzit authentication');
  }

  twizzitTokenCache = {
    token: data.token,
    validTill: data['valid-till'] || nowUnix + 1800
  };

  return data.token;
}

// Format Dutch date string: e.g. "Za 12 september"
function formatDutchDateStr(date: Date): { day: 'Saturday' | 'Sunday'; dateStr: string } {
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
function detectCategory(teamStr: string): string {
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

// ----------------------------------------------------
// API ENDPOINTS
// ----------------------------------------------------

// 0. Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (
    username &&
    password &&
    username.trim().toLowerCase() === APP_AUTH_USER.toLowerCase() &&
    password.trim() === APP_AUTH_PASSWORD
  ) {
    return res.json({
      success: true,
      token: AUTH_SECRET_TOKEN,
      user: {
        username: APP_AUTH_USER,
        displayName: 'D-Mon Staff'
      }
    });
  }
  return res.status(401).json({
    success: false,
    error: 'Onjuiste gebruikersnaam of wachtwoord. Neem contact op met het clubbestuur.'
  });
});

app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.replace('Bearer ', '').trim() === AUTH_SECRET_TOKEN) {
    return res.json({
      authenticated: true,
      user: { username: APP_AUTH_USER, displayName: 'D-Mon Staff' }
    });
  }
  return res.status(401).json({ authenticated: false });
});

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. Twizzit Status check (Cached for 24 hours to prevent wasting API queries)
app.get('/api/twizzit/status', async (req, res) => {
  try {
    const config = getTwizzitConfig();
    const cache = readTwizzitCache();
    const now = Date.now();
    const stats = getTwizzitStats();
    const force = req.query.force === 'true';

    // Query active season from cache if available (24h TTL = 1440 min)
    if (!force && cache.seasons && (now - cache.seasons.timestamp) < cache.seasons.ttlMinutes * 60000) {
      return res.json({
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
      });
    }

    // Otherwise fetch live from Twizzit (consumes 1 query)
    const token = await getTwizzitToken();
    recordTwizzitQuery('/v2/api/seasons', 'Actief seizoen ophalen');

    const seasonsRes = await fetch(`https://app.twizzit.com/v2/api/seasons?organization-ids[]=${config.orgId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const seasons = await seasonsRes.json();
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

    res.json({
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
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      connected: false,
      error: err.message
    });
  }
});

// 3. Twizzit Matches Fetcher (With rate limit protection and smart cache)
app.get('/api/twizzit/matches', async (req, res) => {
  try {
    const config = getTwizzitConfig();
    const stats = getTwizzitStats();
    const cache = readTwizzitCache();
    const forceRefresh = req.query.force === 'true';

    // Parse requested TTL or use stats default
    const ttlMinutes = req.query.ttl 
      ? parseInt(req.query.ttl as string, 10) 
      : (stats.defaultTtlMinutes || DEFAULT_TTL_MINUTES);

    // Determine target weekend date range
    let startDate = req.query.startDate as string;
    let endDate = req.query.endDate as string;

    if (!startDate || !endDate) {
      // Default: Find upcoming weekend (Saturday & Sunday)
      const now = new Date();
      const currentDay = now.getDay(); // 0 is Sunday, 5 is Friday, 6 is Saturday
      const daysUntilSaturday = (6 - currentDay + 7) % 7;
      const targetSat = new Date(now);
      targetSat.setDate(now.getDate() + (daysUntilSaturday === 0 ? 0 : daysUntilSaturday));
      
      const targetSun = new Date(targetSat);
      targetSun.setDate(targetSat.getDate() + 1);

      startDate = targetSat.toISOString().split('T')[0];
      endDate = targetSun.toISOString().split('T')[0];
    }

    const cacheKey = `${startDate}_${endDate}_${config.orgId}`;
    const cachedEntry = cache.matches[cacheKey];
    const now = Date.now();

    // 1. Check if we have a valid cached response (consumes 0 API queries!)
    if (!forceRefresh && cachedEntry) {
      const elapsedMinutes = Math.floor((now - cachedEntry.timestamp) / 60000);
      const activeTtl = cachedEntry.ttlMinutes || ttlMinutes;
      if (elapsedMinutes < activeTtl) {
        const homeMatches = cachedEntry.matches.filter(m => m.isHome);
        return res.json({
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
        });
      }
    }

    // 2. Live Fetch: Consumes 1 query from monthly 500 limit
    recordTwizzitQuery('/v2/api/events', `Matchen voor ${startDate} t/m ${endDate}`);
    const token = await getTwizzitToken();

    // Query Twizzit Events API
    const url = new URL('https://app.twizzit.com/v2/api/events');
    url.searchParams.append('organization-ids[]', config.orgId);
    url.searchParams.append('start-date', startDate);
    url.searchParams.append('end-date', endDate);
    url.searchParams.append('limit', '150');

    const eventsRes = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!eventsRes.ok) {
      const errText = await eventsRes.text();
      throw new Error(`Twizzit Events API error (${eventsRes.status}): ${errText}`);
    }

    const rawEvents: any[] = await eventsRes.json();

    if (!Array.isArray(rawEvents)) {
      throw new Error('Unexpected response format from Twizzit events API');
    }

    // Filter and map match fixtures
    const matchEvents = rawEvents.filter(e => e.name && e.name.includes(' - '));

    const matches = matchEvents.map(event => {
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
    });

    // Sort chronologically
    matches.sort((a, b) => {
      if (a.day !== b.day) {
        return a.day === 'Saturday' ? -1 : 1;
      }
      return a.time.localeCompare(b.time);
    });

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

    res.json({
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
    });
  } catch (err: any) {
    console.error('Twizzit Fetch Error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Cache Clearing Endpoint (Allows user to invalidate cache)
app.post('/api/twizzit/cache/clear', (req, res) => {
  clearTwizzitCache();
  const stats = getTwizzitStats();
  res.json({
    success: true,
    message: 'Twizzit cache succesvol gewist.',
    monthlyQueriesUsed: stats.queriesCount,
    monthlyLimit: stats.monthlyLimit
  });
});

// Cache Stats & Rate Limit Info
app.get('/api/twizzit/cache/stats', (req, res) => {
  const stats = getTwizzitStats();
  const cache = readTwizzitCache();
  const cachedKeys = Object.keys(cache.matches);
  res.json({
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
  });
});

// Update Default TTL
app.post('/api/twizzit/cache/ttl', (req, res) => {
  const { ttlMinutes } = req.body;
  if (typeof ttlMinutes === 'number' && ttlMinutes >= 15 && ttlMinutes <= 10080) {
    const stats = getTwizzitStats();
    stats.defaultTtlMinutes = ttlMinutes;
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
    return res.json({ success: true, defaultTtlMinutes: ttlMinutes });
  }
  res.status(400).json({ success: false, error: 'Ongeldige TTL waarde (15 - 10080 minuten toegestaan)' });
});

// ----------------------------------------------------
// 4. PHOTO POOL PERSISTENCE API
// ----------------------------------------------------

const DEFAULT_PHOTOS = [
  {
    id: 'photo-1',
    title: 'Youth Team Huddle (D-Mon Blauw & Rood)',
    photographer: 'Coach Sarah',
    url: '/photos/photo-1.jpg',
    aspectRatio: '1:1'
  },
  {
    id: 'photo-2',
    title: 'Hockey Turf Match Sprint',
    photographer: 'Coach Thomas',
    url: '/photos/photo-2.jpg',
    aspectRatio: '9:16'
  },
  {
    id: 'photo-3',
    title: 'Junior Stick Dribble & Balcontrole',
    photographer: 'Coach Bart',
    url: '/photos/photo-3.jpg',
    aspectRatio: '1:1'
  },
  {
    id: 'photo-4',
    title: 'Team High-Five & Overwinning',
    photographer: 'Coach Pieter',
    url: '/photos/photo-4.jpg',
    aspectRatio: '1:1'
  },
  {
    id: 'photo-5',
    title: 'Goalie Uitrusting & Veldactie',
    photographer: 'Coach Dimitri',
    url: '/photos/photo-5.jpg',
    aspectRatio: '9:16'
  },
  {
    id: 'photo-6',
    title: 'Avondtraining D-Mon Waterveld',
    photographer: 'Coach Elena',
    url: '/photos/photo-6.jpg',
    aspectRatio: '9:16'
  }
];

function readStoredPhotos(): any[] {
  try {
    if (fs.existsSync(PHOTOS_FILE)) {
      const content = fs.readFileSync(PHOTOS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading photos.json:', err);
  }
  // Initialize with defaults
  writeStoredPhotos(DEFAULT_PHOTOS);
  return DEFAULT_PHOTOS;
}

function writeStoredPhotos(photos: any[]): void {
  try {
    fs.writeFileSync(PHOTOS_FILE, JSON.stringify(photos, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing photos.json:', err);
  }
}

// GET /api/photos - Retrieve all persistent photos
app.get('/api/photos', (req, res) => {
  const photos = readStoredPhotos();
  res.json(photos);
});

// POST /api/photos - Upload and save a new photo
app.post('/api/photos', (req, res) => {
  try {
    const { id, title, photographer, url, aspectRatio } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    const photoId = id || `photo-${Date.now()}`;
    let savedUrl = url;

    // If it's a data URL, save it as an image file on disk in public/uploads/
    if (url.startsWith('data:image/')) {
      const commaIdx = url.indexOf(',');
      if (commaIdx !== -1) {
        const header = url.substring(0, commaIdx);
        const base64Data = url.substring(commaIdx + 1);
        let ext = 'jpg';
        if (header.includes('png')) ext = 'png';
        else if (header.includes('webp')) ext = 'webp';
        else if (header.includes('svg')) ext = 'svg';
        else if (header.includes('gif')) ext = 'gif';

        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `${photoId}.${ext}`;
        const filePath = path.join(UPLOADS_DIR, filename);
        fs.writeFileSync(filePath, buffer);
        savedUrl = `/uploads/${filename}`;
      }
    }

    const newPhoto = {
      id: photoId,
      title: title || 'Nieuwe Clubfoto',
      photographer: photographer || 'Clublid',
      url: savedUrl,
      isUserUploaded: true,
      aspectRatio: aspectRatio || '1:1',
      uploadedAt: new Date().toISOString()
    };

    const photos = readStoredPhotos();
    // Prepend to top of list
    const updatedPhotos = [newPhoto, ...photos.filter((p: any) => p.id !== photoId)];
    writeStoredPhotos(updatedPhotos);

    res.json(newPhoto);
  } catch (err: any) {
    console.error('Error saving photo:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/photos/:id - Delete a photo
app.delete('/api/photos/:id', (req, res) => {
  try {
    const photoId = req.params.id;
    const photos = readStoredPhotos();
    const photoToDelete = photos.find((p: any) => p.id === photoId);

    // If it was uploaded to public/uploads/, remove the file from disk
    if (photoToDelete && photoToDelete.url && photoToDelete.url.startsWith('/uploads/')) {
      const filename = path.basename(photoToDelete.url);
      const filePath = path.join(UPLOADS_DIR, filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('Failed to delete file from uploads:', e);
        }
      }
    }

    const updated = photos.filter((p: any) => p.id !== photoId);
    writeStoredPhotos(updated);
    res.json({ success: true, remainingCount: updated.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/photos/reset - Reset to default 6 club photos
app.post('/api/photos/reset', (req, res) => {
  try {
    writeStoredPhotos(DEFAULT_PHOTOS);
    res.json(DEFAULT_PHOTOS);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// INSTAGRAM GRAPH API PUBLISHING ENDPOINTS
// ----------------------------------------------------
app.get('/api/instagram/status', (req, res) => {
  const isConnected = Boolean(INSTAGRAM_ACCESS_TOKEN && INSTAGRAM_ACCOUNT_ID);
  res.json({
    connected: isConnected,
    accountId: INSTAGRAM_ACCOUNT_ID,
    accountName: 'D-MON Hockey',
    accountUsername: 'dmon_hockey',
    mode: isConnected ? 'live' : 'simulation',
    scopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list']
  });
});

app.post('/api/instagram/publish', async (req, res) => {
  try {
    const { mediaType = 'STORY', caption, imageDataUrl } = req.body;

    if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_ACCOUNT_ID) {
      return res.status(400).json({
        success: false,
        error: 'Instagram API credentials (account ID of access token) ontbreken op de server.'
      });
    }

    if (!imageDataUrl || typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image')) {
      return res.status(400).json({
        success: false,
        error: 'Geen geldige Base64 afbeelding (data:image/png) ontvangen.'
      });
    }

    // 1. Save graphic to public/generated so Meta's servers can download it
    // Meta Instagram Content Publishing API STRICTLY requires JPEG format (.jpg/.jpeg)
    const matches = imageDataUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ success: false, error: 'Ongeldige Base64 structuur.' });
    }

    const base64Data = matches[2];
    // Instagram Graph API container creation strictly mandates .jpg / .jpeg extension!
    const fileName = `story_${Date.now()}.jpg`;
    const filePath = path.join(GENERATED_DIR, fileName);
    const fileBuffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, fileBuffer);

    // Meta's crawler requires a directly downloadable image URL without authentication cookies or redirects.
    // The sandboxed Cloud Run preview environment redirects external anonymous crawlers to a cookie check.
    // Therefore, we upload the generated JPEG directly to a high-speed direct CDN endpoint (uguu.se / tmpfiles)
    // which serves direct Content-Type: image/jpeg with 200 OK to Meta's servers.
    let publicImageUrl = '';
    try {
      const formData = new FormData();
      const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
      formData.append('files[]', blob, fileName);

      const cdnRes = await fetch('https://uguu.se/upload.php', {
        method: 'POST',
        body: formData
      });
      const cdnData = (await cdnRes.json()) as any;
      if (cdnData.success && cdnData.files?.[0]?.url) {
        publicImageUrl = cdnData.files[0].url;
        console.log(`[Instagram Publishing] Direct CDN URL for Meta crawler: ${publicImageUrl}`);
      }
    } catch (uploadErr) {
      console.warn('[Instagram Publishing] Primary CDN upload failed, falling back:', uploadErr);
    }

    if (!publicImageUrl) {
      // Fallback to local server URL
      const forwardedHost = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
      const forwardedProto = req.get('x-forwarded-proto') || req.protocol || 'https';
      publicImageUrl = process.env.APP_BASE_URL
        ? `${process.env.APP_BASE_URL.replace(/\/$/, '')}/generated/${fileName}`
        : `${forwardedProto}://${forwardedHost}/generated/${fileName}`;
    }

    console.log(`[Instagram Publishing] Final Public Image URL: ${publicImageUrl}`);
    const isStory = mediaType.toUpperCase() === 'STORY';

    // 2. Call Meta Graph API: POST /{ig-user-id}/media
    const containerParams = new URLSearchParams();
    containerParams.append('image_url', publicImageUrl);
    containerParams.append('access_token', INSTAGRAM_ACCESS_TOKEN);

    if (isStory) {
      containerParams.append('media_type', 'STORIES');
    } else {
      if (caption) containerParams.append('caption', caption);
    }

    const containerRes = await fetch(
      `https://graph.facebook.com/v20.0/${INSTAGRAM_ACCOUNT_ID}/media`,
      {
        method: 'POST',
        body: containerParams
      }
    );

    const containerData = (await containerRes.json()) as any;
    console.log('[Instagram Publishing] Container creation result:', containerData);

    if (!containerRes.ok || containerData.error) {
      const errMsg = containerData.error?.message || 'Fout bij aanmaken Instagram media container';
      return res.status(400).json({
        success: false,
        step: 'create_container',
        error: errMsg,
        metaError: containerData.error
      });
    }

    const creationId = containerData.id;
    if (!creationId) {
      return res.status(500).json({
        success: false,
        error: 'Geen creation ID ontvangen van Meta.'
      });
    }

    // Poll Meta container status until FINISHED or timeout (up to 15 seconds)
    let isReady = false;
    for (let attempt = 0; attempt < 8; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        const statusRes = await fetch(
          `https://graph.facebook.com/v20.0/${creationId}?fields=status_code,status&access_token=${INSTAGRAM_ACCESS_TOKEN}`
        );
        const statusData = (await statusRes.json()) as any;
        console.log(`[Instagram Publishing] Status check attempt ${attempt + 1}:`, statusData);
        if (statusData.status_code === 'FINISHED') {
          isReady = true;
          break;
        } else if (statusData.status_code === 'ERROR') {
          return res.status(400).json({
            success: false,
            step: 'container_processing',
            error: statusData.status || 'Meta verwerking gaf een foutstatus.'
          });
        }
      } catch (pollErr) {
        console.warn('Status poll attempt error:', pollErr);
      }
    }

    // 3. Call Meta Graph API: POST /{ig-user-id}/media_publish
    const publishParams = new URLSearchParams();
    publishParams.append('creation_id', creationId);
    publishParams.append('access_token', INSTAGRAM_ACCESS_TOKEN);

    const publishRes = await fetch(
      `https://graph.facebook.com/v20.0/${INSTAGRAM_ACCOUNT_ID}/media_publish`,
      {
        method: 'POST',
        body: publishParams
      }
    );

    const publishData = (await publishRes.json()) as any;
    console.log('[Instagram Publishing] Media publish result:', publishData);

    if (!publishRes.ok || publishData.error) {
      const errMsg = publishData.error?.message || 'Fout bij publiceren van Instagram media container';
      return res.status(400).json({
        success: false,
        step: 'publish_media',
        error: errMsg,
        metaError: publishData.error
      });
    }

    return res.json({
      success: true,
      id: publishData.id,
      mediaType: isStory ? 'STORY' : 'POST',
      permalink: 'https://www.instagram.com/dmon_hockey/',
      publicImageUrl,
      message: `Succesvol gepubliceerd naar @dmon_hockey als ${isStory ? 'Story' : 'Post'}! ID: ${publishData.id}`
    });
  } catch (err: any) {
    console.error('[Instagram Publishing Error]:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Onverwachte serverfout bij publiceren'
    });
  }
});

// Explicit static handlers for uploaded photos, generated graphics and public assets
app.use('/generated', express.static(GENERATED_DIR, {
  setHeaders: (res, filePath) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    }
  }
}));
app.use('/uploads', express.static(UPLOADS_DIR, {
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));
app.use('/photos', express.static(path.join(process.cwd(), 'public', 'photos'), {
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));
app.use(express.static(path.join(process.cwd(), 'public')));

// ----------------------------------------------------
// VITE MIDDLEWARE / STATIC ASSETS
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`D-Mon Hockey Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
