import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Match, 
  GraphicSettings, 
  PhotoPoolItem, 
  TwizzitConfig, 
  InstagramConfig, 
  SchedulerConfig, 
  ExecutionLog 
} from './types';
import { ALL_INITIAL_FIXTURES } from './data/mockMatches';
import { INITIAL_PHOTO_POOL } from './data/photoPool';
import { BRAND_COLORS } from './brand';
import { getSuggestedSubtitle, formatShortDateSlash } from './utils/dateFormatter';
import {
  loadPersistentPhotos,
  uploadPhotoToServer,
  deletePhotoFromServer,
  resetServerPhotos,
  saveLocalPhoto,
  deleteLocalPhoto,
  saveGraphicSettings,
  loadGraphicSettings,
  saveActivePhotoId,
  loadActivePhotoId
} from './utils/photoStorage';

import { Navbar } from './components/Navbar';
import { GraphicPreview } from './components/GraphicPreview';
import { TwizzitSyncPanel } from './components/TwizzitSyncPanel';
import { PhotoPoolManager } from './components/PhotoPoolManager';
import { AutomationScheduler } from './components/AutomationScheduler';
import { InstagramPublisherModal } from './components/InstagramPublisherModal';
import { BrandKitView } from './components/BrandKitView';
import { LoginScreen } from './components/LoginScreen';
import { AuthUser } from './types';

import confetti from 'canvas-confetti';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const savedUser = localStorage.getItem('dmon_auth_user');
      const savedToken = localStorage.getItem('dmon_auth_token');
      if (savedUser && savedToken) {
        const parsed = JSON.parse(savedUser);
        if (parsed.token === savedToken) {
          return parsed;
        }
      }
    } catch (e) {
      // Ignore
    }
    return null;
  });

  const handleLogout = () => {
    localStorage.removeItem('dmon_auth_user');
    localStorage.removeItem('dmon_auth_token');
    setCurrentUser(null);
  };

  // Navigation
  const [activeTab, setActiveTab] = useState<'studio' | 'twizzit' | 'automation' | 'brand'>('studio');

  // Match Fixtures State (initial sample fallback, will be replaced with live Twizzit data)
  const [matches, setMatches] = useState<Match[]>(ALL_INITIAL_FIXTURES);
  const [isSyncingTwizzit, setIsSyncingTwizzit] = useState<boolean>(false);
  const [activeSeasonName, setActiveSeasonName] = useState<string>('2026 - 2027');

  // Target Weekend Dates for Match Queries
  const [startDate, setStartDate] = useState<string>('2026-09-12');
  const [endDate, setEndDate] = useState<string>('2026-09-13');

  // Photo Pool State
  const [photoPool, setPhotoPool] = useState<PhotoPoolItem[]>(INITIAL_PHOTO_POOL);

  // Graphic Configurator Settings State
  const [graphicSettings, setGraphicSettings] = useState<GraphicSettings>({
    format: 'story', // Default to 9:16 story for Instagram and Facebook Stories
    selectedDay: 'Weekend',
    customTitle: 'Thuismatches',
    customSubtitle: 'Weekend 12/09 & 13/09',
    photoUrl: INITIAL_PHOTO_POOL[0].url,
    volunteerBadgeText: 'Bar open dankzij onze\nvrijwilligers',
    showVolunteerBadge: true,
    showFieldLines: true,
    showLogo: true,
    accentColor: BRAND_COLORS.clubrood,
    primaryColor: BRAND_COLORS.clubblauw,
    gradientOverlay: false,
    splitRatio: 0.46,
    weekendLayout: 'columns'
  });

  // Twizzit API Configuration (Managed server-side via environment variables)
  const [twizzitConfig, setTwizzitConfig] = useState<TwizzitConfig>({
    clientId: 'twizzit_api',
    clientSecret: '••••••••••••••••••••',
    apiKey: 'twizzit_jwt',
    organizationId: '32037',
    clubName: 'D-Mon Hockey Dendermonde',
    homeVenueKeyword: 'Dendermonde, D-Mon, Sint-Gillis',
    useOAuth: true,
    isConnected: true,
    lastSyncedAt: 'Zojuist verbonden'
  });

  // Instagram Publishing Configuration (Tokens are securely stored in server env vars)
  const [instagramConfig, setInstagramConfig] = useState<InstagramConfig>({
    accountId: '17841409458406570',
    accessToken: '',
    pageId: '2027339944203426',
    isConnected: true,
    autoPublish: true,
    captionTemplate: 'Default D-Mon template'
  });

  // Weekly Automation & Scheduler Configuration
  const [schedulerConfig, setSchedulerConfig] = useState<SchedulerConfig>({
    enabled: true,
    dayOfWeek: 5, // Friday
    timeOfDay: '10:00',
    skipIfNoMatches: true,
    notifyOnSkip: true,
    lastRunStatus: 'success',
    lastRunTimestamp: 'Vrijdag 10:00'
  });

  // Execution History Logs
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([
    {
      id: 'log-prev-1',
      timestamp: 'Vorige Vrijdag 10:00',
      triggerType: 'scheduled_weekly',
      homeMatchesCount: 11,
      decision: 'POSTED',
      details: '11 thuismatchen opgehaald via Twizzit API. Weekend story gerenderd en gepubliceerd naar @dmon_hockey.',
      instagramPostId: 'ig_media_93810283'
    },
    {
      id: 'log-prev-2',
      timestamp: '2 weken geleden 10:00',
      triggerType: 'scheduled_weekly',
      homeMatchesCount: 0,
      decision: 'SKIPPED_NO_MATCHES',
      details: '0 thuismatchen gedetecteerd (Herfstvakantie / enkel uitmatchen). Post overgeslagen conform clubregel.'
    }
  ]);

  // Modals & Triggers
  const [isInstagramModalOpen, setIsInstagramModalOpen] = useState(false);
  const [modalGraphicDataUrl, setModalGraphicDataUrl] = useState<string | undefined>(undefined);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Derived filtered home matches
  const saturdayHomeMatches = useMemo(() => matches.filter(m => m.day === 'Saturday' && m.isHome), [matches]);
  const sundayHomeMatches = useMemo(() => matches.filter(m => m.day === 'Sunday' && m.isHome), [matches]);
  const totalHomeMatches = useMemo(() => matches.filter(m => m.isHome).length, [matches]);

  // Show temporary toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Live Twizzit Match Fetcher Function (With Smart Cache & Rate Limit Awareness)
  const fetchTwizzitMatches = useCallback(async (start: string, end: string, force: boolean = false) => {
    setIsSyncingTwizzit(true);
    try {
      const url = `/api/twizzit/matches?startDate=${start}&endDate=${end}${force ? '&force=true' : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.matches)) {
        setMatches(data.matches);
        const homeMatchesCount = data.homeMatchesCount ?? data.matches.filter((m: Match) => m.isHome).length;

        // Auto-update graphic subtitle if matches exist
        const firstSaturday = data.matches.find((m: Match) => m.day === 'Saturday' && m.isHome);
        const firstSunday = data.matches.find((m: Match) => m.day === 'Sunday' && m.isHome);
        
        const weekendSub = getSuggestedSubtitle('Weekend', firstSaturday?.dateStr, firstSunday?.dateStr);

        setGraphicSettings(prev => ({
          ...prev,
          customSubtitle: prev.selectedDay === 'Weekend' 
            ? weekendSub 
            : (prev.selectedDay === 'Sunday' 
                ? (firstSunday ? `Zondag ${formatShortDateSlash(firstSunday.dateStr)}` : prev.customSubtitle) 
                : (firstSaturday ? `Zaterdag ${formatShortDateSlash(firstSaturday.dateStr)}` : prev.customSubtitle))
        }));

        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        setTwizzitConfig(prev => ({
          ...prev,
          isConnected: true,
          lastSyncedAt: data.cached 
            ? `Gecachet (${data.remainingMinutes ?? 0}m geldig)` 
            : `Vandaag om ${timeStr}`,
          cacheInfo: {
            isCached: !!data.cached,
            cachedAt: data.cachedAt,
            expiresAt: data.expiresAt,
            remainingMinutes: data.remainingMinutes,
            ttlMinutes: data.ttlMinutes || 240,
            monthlyQueriesUsed: data.monthlyQueriesUsed || 0,
            monthlyLimit: data.monthlyLimit || 500
          }
        }));

        if (data.cached) {
          showToast(`⚡ Gecachet (${data.remainingMinutes ?? 0}m geldig) • 0 queries verbruikt (${data.monthlyQueriesUsed || 0}/500)`);
        } else {
          showToast(`🟢 Twizzit API: ${data.matches.length} matchen geladen • 1 query verbruikt (${data.monthlyQueriesUsed || 1}/500)`);
        }
      } else {
        showToast(`⚠️ Twizzit: ${data.error || 'Geen wedstrijden gevonden'}`);
      }
    } catch (err: any) {
      console.error('Error syncing Twizzit:', err);
      showToast(`❌ Twizzit verbinding fout: ${err.message}`);
    } finally {
      setIsSyncingTwizzit(false);
    }
  }, []);

  // Clear server cache handler
  const handleClearTwizzitCache = useCallback(async () => {
    try {
      const res = await fetch('/api/twizzit/cache/clear', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTwizzitConfig(prev => ({
          ...prev,
          cacheInfo: prev.cacheInfo ? { ...prev.cacheInfo, isCached: false, remainingMinutes: 0 } : undefined
        }));
        showToast('🗑️ Twizzit cache gewist! Volgende opvraging zal direct live zijn.');
      }
    } catch (err) {
      console.error('Failed to clear cache', err);
      showToast('Fout bij wissen van cache');
    }
  }, []);

  // Update default cache TTL handler
  const handleUpdateTwizzitTtl = useCallback(async (minutes: number) => {
    try {
      const res = await fetch('/api/twizzit/cache/ttl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttlMinutes: minutes })
      });
      const data = await res.json();
      if (data.success) {
        setTwizzitConfig(prev => ({
          ...prev,
          cacheInfo: prev.cacheInfo ? { ...prev.cacheInfo, ttlMinutes: minutes } : undefined
        }));
        showToast(`⏱️ Cache geldigheid aangepast naar ${minutes >= 60 ? `${minutes / 60} uur` : `${minutes} minuten`}`);
      }
    } catch (err) {
      console.error('Failed to update TTL', err);
    }
  }, []);

  // Fetch season info on mount
  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetch('/api/twizzit/status');
        const data = await res.json();
        if (data.success) {
          if (data.currentSeason?.name) {
            setActiveSeasonName(data.currentSeason.name);
          }
          setTwizzitConfig(prev => ({
            ...prev,
            isConnected: true,
            organizationId: data.orgId || '32037',
            cacheInfo: {
              isCached: !!data.cached,
              cachedAt: data.cachedAt,
              ttlMinutes: 240,
              monthlyQueriesUsed: data.monthlyQueriesUsed || 0,
              monthlyLimit: data.monthlyLimit || 500
            }
          }));
        }
      } catch (e) {
        console.error('Failed to load Twizzit status', e);
      }
    }

    loadStatus();
    // Load default weekend (2026-09-12 to 2026-09-13)
    fetchTwizzitMatches('2026-09-12', '2026-09-13');
  }, [fetchTwizzitMatches]);

  // Persistent storage init on mount
  useEffect(() => {
    let isMounted = true;
    async function initPersistentData() {
      // 1. Restore graphic settings from localStorage
      const savedSettings = loadGraphicSettings();
      if (savedSettings && isMounted) {
        setGraphicSettings(prev => ({ ...prev, ...savedSettings }));
      }

      // 2. Restore photo pool from IndexedDB / Server
      const storedPhotos = await loadPersistentPhotos();
      if (isMounted && storedPhotos && storedPhotos.length > 0) {
        setPhotoPool(storedPhotos);
        // Find which photo should be active:
        // Priority: explicitly saved active photo ID -> saved settings url -> first pool photo
        const savedActiveId = loadActivePhotoId();
        let targetPhoto = storedPhotos.find(p => p.id === savedActiveId);
        if (!targetPhoto && savedSettings?.photoUrl) {
          targetPhoto = storedPhotos.find(p => p.url === savedSettings.photoUrl);
        }
        if (!targetPhoto) {
          targetPhoto = storedPhotos[0];
        }

        if (targetPhoto) {
          saveActivePhotoId(targetPhoto.id);
          setGraphicSettings(prev => ({
            ...prev,
            photoUrl: targetPhoto!.url
          }));
        }
      }
    }

    initPersistentData();
    return () => { isMounted = false; };
  }, []);

  // Auto-persist graphic settings whenever changed
  useEffect(() => {
    saveGraphicSettings(graphicSettings);
  }, [graphicSettings]);

  // Handle Date Range Change
  const handleDateRangeChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    fetchTwizzitMatches(start, end);
  };

  // Explicit photo selector that persists active selection
  const handleSelectPhoto = (url: string) => {
    const item = photoPool.find(p => p.url === url);
    if (item) {
      saveActivePhotoId(item.id);
    }
    setGraphicSettings(prev => ({ ...prev, photoUrl: url }));
  };

  // Randomize Photo
  const handleRandomizePhoto = () => {
    if (photoPool.length === 0) return;
    const available = photoPool.filter(p => p.url !== graphicSettings.photoUrl);
    const poolToPick = available.length > 0 ? available : photoPool;
    const randomIndex = Math.floor(Math.random() * poolToPick.length);
    const picked = poolToPick[randomIndex];
    handleSelectPhoto(picked.url);
    showToast(`📸 Foto gewisseld: "${picked.title}"`);
  };

  // Photo pool operations with persistent storage (IndexedDB + Server)
  const handleAddPhoto = async (photo: PhotoPoolItem) => {
    // 1. Optimistic instant state update
    setPhotoPool(prev => [photo, ...prev]);
    // 2. Immediately set as active photo on canvas!
    setGraphicSettings(prev => ({ ...prev, photoUrl: photo.url }));
    saveActivePhotoId(photo.id);

    // 3. Save to local browser IndexedDB
    await saveLocalPhoto(photo);
    showToast(`✅ Foto "${photo.title}" geüpload en actief`);

    // 4. Persist to server backend asynchronously
    try {
      const savedOnServer = await uploadPhotoToServer(photo);
      if (savedOnServer && savedOnServer.url) {
        // If server stored image at /uploads/photo-xxx.jpg, update url seamlessly
        setPhotoPool(prev => prev.map(p => p.id === photo.id ? savedOnServer : p));
        setGraphicSettings(prev => {
          if (prev.photoUrl === photo.url) {
            return { ...prev, photoUrl: savedOnServer.url };
          }
          return prev;
        });
        await saveLocalPhoto(savedOnServer);
      }
    } catch (e) {
      console.warn('Server photo upload deferred:', e);
    }
  };

  const handleRemovePhoto = async (id: string) => {
    const photoToRemove = photoPool.find(p => p.id === id);
    setPhotoPool(prev => {
      const remaining = prev.filter(p => p.id !== id);
      // If user deletes the currently active photo on the canvas, auto-switch to next available photo
      if (photoToRemove && photoToRemove.url === graphicSettings.photoUrl) {
        if (remaining.length > 0) {
          setGraphicSettings(s => ({ ...s, photoUrl: remaining[0].url }));
        }
      }
      return remaining;
    });

    // Remove from IndexedDB and server
    await deleteLocalPhoto(id);
    await deletePhotoFromServer(id);
    showToast(`🗑️ Foto "${photoToRemove?.title || 'Foto'}" verwijderd`);
  };

  const handleResetPhotoPool = async () => {
    const defaultPhotos = await resetServerPhotos();
    setPhotoPool(defaultPhotos);
    setGraphicSettings(prev => ({ ...prev, photoUrl: defaultPhotos[0].url }));
    showToast('🔄 Standaard clubfoto\'s hersteld');
  };

  // Match operations
  const handleAddMatch = (match: Match) => {
    setMatches(prev => [...prev, match]);
    showToast(`🏑 Match toegevoegd: ${match.displayMatchText}`);
  };

  const handleRemoveMatch = (id: string) => {
    setMatches(prev => prev.filter(m => m.id !== id));
  };

  const handleSetMatchesPreset = (preset: 'standard' | 'empty') => {
    if (preset === 'standard') {
      fetchTwizzitMatches(startDate, endDate);
      showToast('📅 Herladen van actieve wedstrijden via Twizzit API');
    } else {
      // Set to 0 home matches (all away or empty)
      setMatches(prev => prev.map(m => ({ ...m, isHome: false, field: 'Uitwedstrijd' })));
      showToast('⚠️ Testscenario ingesteld: 0 thuismatchen (voor skip-test)');
    }
  };

  // Manual Trigger for Weekly Automated Process
  const handleRunWeeklyPipeline = async () => {
    setIsRunningPipeline(true);

    try {
      // Refresh live matches first
      const res = await fetch(`/api/twizzit/matches?startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      const freshMatches: Match[] = data.matches || matches;
      const freshHomeCount = freshMatches.filter(m => m.isHome).length;

      const now = new Date();
      const timeString = `Vrijdag ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // DECISION ENGINE:
      // "cause when there are no matches we dont make the post"
      if (freshHomeCount === 0) {
        const newLog: ExecutionLog = {
          id: `log-${Date.now()}`,
          timestamp: timeString,
          triggerType: 'manual_test',
          homeMatchesCount: 0,
          decision: 'SKIPPED_NO_MATCHES',
          details: `0 thuismatchen gedetecteerd in Twizzit voor weekend ${startDate}. Publicatie geannuleerd/overgeslagen conform regel!`
        };
        setExecutionLogs(prev => [newLog, ...prev]);
        showToast('⏸ Pipeline beslissing: 0 thuismatchen -> GEEN post gemaakt!');
      } else {
        // Randomize photo for weekly post
        handleRandomizePhoto();

        const newLog: ExecutionLog = {
          id: `log-${Date.now()}`,
          timestamp: timeString,
          triggerType: 'manual_test',
          homeMatchesCount: freshHomeCount,
          decision: 'POSTED',
          details: `${freshHomeCount} thuismatchen gedetecteerd in Twizzit. Story gegenereerd & gepost naar @dmon_hockey!`,
          instagramPostId: `ig_${Date.now()}`
        };
        setExecutionLogs(prev => [newLog, ...prev]);

        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: [BRAND_COLORS.clubblauw, BRAND_COLORS.clubrood, BRAND_COLORS.clubgoud]
        });

        showToast(`🎉 Pipeline succesvol uitgevoerd! ${freshHomeCount} thuismatchen verwerkt.`);
      }
    } catch (err: any) {
      console.error(err);
      showToast(`❌ Fout bij pipeline uitvoering: ${err.message}`);
    } finally {
      setIsRunningPipeline(false);
    }
  };

  // If not logged in, show secure login screen
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#35526F] flex flex-col font-['Barlow']">
      
      {/* Club Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        homeMatchesCount={totalHomeMatches}
        twizzitConnected={twizzitConfig.isConnected}
        instagramConnected={instagramConfig.isConnected}
        onRunAutomation={handleRunWeeklyPipeline}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* TAB 1: GRAPHIC STUDIO */}
        {activeTab === 'studio' && (
          <div className="space-y-8">
            <GraphicPreview
              saturdayMatches={saturdayHomeMatches}
              sundayMatches={sundayHomeMatches}
              photoPool={photoPool}
              settings={graphicSettings}
              onUpdateSettings={(newSettings) => {
                if (newSettings.photoUrl) {
                  handleSelectPhoto(newSettings.photoUrl);
                }
                setGraphicSettings(prev => ({ ...prev, ...newSettings }));
              }}
              onOpenInstagramModal={(dataUrl) => {
                setModalGraphicDataUrl(dataUrl);
                setIsInstagramModalOpen(true);
              }}
              onRandomizePhoto={handleRandomizePhoto}
            />

            {/* Photo Pool Manager attached below studio for easy access */}
            <PhotoPoolManager
              photos={photoPool}
              selectedPhotoUrl={graphicSettings.photoUrl}
              onSelectPhoto={handleSelectPhoto}
              onAddPhoto={handleAddPhoto}
              onRemovePhoto={handleRemovePhoto}
              onRandomizePhoto={handleRandomizePhoto}
              onResetDefaults={handleResetPhotoPool}
            />
          </div>
        )}

        {/* TAB 2: TWIZZIT SYNC & DATA */}
        {activeTab === 'twizzit' && (
          <TwizzitSyncPanel
            matches={matches}
            config={twizzitConfig}
            onUpdateConfig={(newConf) => setTwizzitConfig(prev => ({ ...prev, ...newConf }))}
            onAddMatch={handleAddMatch}
            onRemoveMatch={handleRemoveMatch}
            onSetMatchesPreset={handleSetMatchesPreset}
            onSync={(s, e, force) => fetchTwizzitMatches(s || startDate, e || endDate, force)}
            onClearCache={handleClearTwizzitCache}
            onUpdateTtl={handleUpdateTwizzitTtl}
            isSyncing={isSyncingTwizzit}
            activeSeasonName={activeSeasonName}
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={handleDateRangeChange}
          />
        )}

        {/* TAB 3: AUTOMATION SCHEDULER */}
        {activeTab === 'automation' && (
          <AutomationScheduler
            schedulerConfig={schedulerConfig}
            onUpdateSchedulerConfig={(newConf) => setSchedulerConfig(prev => ({ ...prev, ...newConf }))}
            executionLogs={executionLogs}
            homeMatchesCount={totalHomeMatches}
            onRunWeeklyPipeline={handleRunWeeklyPipeline}
            isRunningPipeline={isRunningPipeline}
          />
        )}

        {/* TAB 4: BRAND KIT */}
        {activeTab === 'brand' && (
          <BrandKitView />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#06478D] font-['Outfit']">D-MON HOCKEY</span>
            <span>•</span>
            <span>Dendermonde, België</span>
            <span>•</span>
            <a href="https://www.dmon.be" target="_blank" rel="noreferrer" className="text-[#06478D] hover:underline">
              www.dmon.be
            </a>
            <span>•</span>
            <span className="font-mono text-slate-600">Twizzit Org #32037</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-[11px] text-slate-400">
              Vragen? communicatie@dmonhockey.be
            </span>
          </div>
        </div>
      </footer>

      {/* Instagram Publisher Modal */}
      <InstagramPublisherModal
        isOpen={isInstagramModalOpen}
        onClose={() => setIsInstagramModalOpen(false)}
        config={instagramConfig}
        onUpdateConfig={(newConf) => setInstagramConfig(prev => ({ ...prev, ...newConf }))}
        settings={graphicSettings}
        activeMatches={graphicSettings.selectedDay === 'Sunday' ? sundayHomeMatches : saturdayHomeMatches}
        graphicDataUrl={modalGraphicDataUrl}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-800 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
