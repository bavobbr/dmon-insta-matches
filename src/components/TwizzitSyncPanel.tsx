import React, { useState } from 'react';
import { Match, TwizzitConfig } from '../types';
import { 
  Key, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Home, 
  Plane,
  AlertTriangle,
  Info,
  Calendar,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Database,
  Clock,
  Zap,
  Gauge,
  AlertCircle
} from 'lucide-react';

interface TwizzitSyncPanelProps {
  matches: Match[];
  config: TwizzitConfig;
  onUpdateConfig: (newConfig: Partial<TwizzitConfig>) => void;
  onAddMatch: (match: Match) => void;
  onRemoveMatch: (id: string) => void;
  onSetMatchesPreset: (preset: 'standard' | 'empty') => void;
  onSync: (startDate?: string, endDate?: string, force?: boolean) => void;
  onClearCache: () => void;
  onUpdateTtl: (minutes: number) => void;
  isSyncing: boolean;
  activeSeasonName?: string;
  startDate: string;
  endDate: string;
  onDateRangeChange: (start: string, end: string) => void;
}

export const TwizzitSyncPanel: React.FC<TwizzitSyncPanelProps> = ({
  matches,
  config,
  onUpdateConfig,
  onAddMatch,
  onRemoveMatch,
  onSetMatchesPreset,
  onSync,
  onClearCache,
  onUpdateTtl,
  isSyncing,
  activeSeasonName = '2026 - 2027',
  startDate,
  endDate,
  onDateRangeChange
}) => {
  const [filterMode, setFilterMode] = useState<'home' | 'all' | 'away'>('home');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showForceConfirm, setShowForceConfirm] = useState(false);

  // Cache & Rate Limit metrics
  const cacheInfo = config.cacheInfo;
  const queriesUsed = cacheInfo?.monthlyQueriesUsed ?? 0;
  const monthlyLimit = cacheInfo?.monthlyLimit ?? 500;
  const queriesRemaining = Math.max(0, monthlyLimit - queriesUsed);
  const usagePercentage = Math.min(100, Math.round((queriesUsed / monthlyLimit) * 100));
  const isCached = cacheInfo?.isCached ?? false;
  const remainingMinutes = cacheInfo?.remainingMinutes ?? 0;
  const currentTtl = cacheInfo?.ttlMinutes ?? 240;

  // New match form state
  const [newDay, setNewDay] = useState<'Saturday' | 'Sunday'>('Saturday');
  const [newTime, setNewTime] = useState('11u00');
  const [newCategory, setNewCategory] = useState('U12G');
  const [newTeamName, setNewTeamName] = useState('U12G-1');
  const [newOpponent, setNewOpponent] = useState('Gantoise');
  const [newIsHome, setNewIsHome] = useState(true);

  // Filtered list
  const filteredMatches = matches.filter(m => {
    if (filterMode === 'home') return m.isHome;
    if (filterMode === 'away') return !m.isHome;
    return true;
  });

  const homeCount = matches.filter(m => m.isHome).length;
  const awayCount = matches.filter(m => !m.isHome).length;

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Match = {
      id: `m-custom-${Date.now()}`,
      twizzitId: `tw-${Date.now()}`,
      day: newDay,
      dateStr: newDay === 'Saturday' ? 'Za 12 september' : 'Zo 13 september',
      time: newTime,
      homeTeam: newIsHome ? `D-Mon ${newTeamName}` : newOpponent,
      awayTeam: newIsHome ? newOpponent : `D-Mon ${newTeamName}`,
      displayMatchText: `${newTeamName} - ${newOpponent}`,
      category: (newCategory.startsWith('U') ? newCategory.slice(0, 3) : newCategory) as any,
      isHome: newIsHome,
      field: newIsHome ? 'Veld 1 (Waterveld)' : 'Uitwedstrijd',
      status: 'scheduled'
    };
    onAddMatch(created);
    setShowAddForm(false);
  };

  const handleForceLiveSync = () => {
    setShowForceConfirm(false);
    onSync(startDate, endDate, true);
  };

  return (
    <div className="space-y-8">
      
      {/* Header & Live Connection Status Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold font-['Outfit'] text-[#06478D]">
              Twizzit API & Match Data Connector
            </h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Twizzit Verbonden (Org ID: {config.organizationId})</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-[#06478D] border border-blue-200">
              Seizoen {activeSeasonName}
            </span>
            {isCached && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-[#06478D]">
                <Zap className="w-3 h-3 text-[#06478D]" />
                <span>Gecachet (0 API credits)</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-['Barlow'] mt-1">
            Gekoppeld aan de officiële Twizzit Swagger REST API voor D-Mon Hockey met automatisch caching en query-limiet bescherming.
          </p>
        </div>

        {/* Sync Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-sync-twizzit-cached"
            onClick={() => onSync(startDate, endDate, false)}
            disabled={isSyncing}
            className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 px-3.5 py-2.5 rounded-xl text-xs font-bold font-['Outfit'] transition-all shadow-xs cursor-pointer border border-slate-200"
            title="Haalt gegevens op uit de snelle cache (of live indien cache verlopen is)"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Ophalen...' : 'Slim Synchroniseren'}</span>
          </button>

          <button
            id="btn-sync-twizzit-force"
            onClick={() => setShowForceConfirm(true)}
            disabled={isSyncing}
            className="flex items-center space-x-2 bg-[#06478D] hover:bg-[#053c77] disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold font-['Outfit'] transition-all shadow-xs cursor-pointer"
            title="Negeert cache en haalt gegarandeerd de nieuwste data live op bij Twizzit (kost 1 query)"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Live Verversen (1 query)</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal / Banner for Force Live Sync */}
      {showForceConfirm && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900 font-['Outfit']">
                Live Twizzit API query bevestigen
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Dit omzeilt de cache en vraagt actuele data direct op bij Twizzit. Dit verbruikt <strong>1 van je {monthlyLimit} queries</strong> voor deze maand ({queriesRemaining} resterend).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={() => setShowForceConfirm(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-amber-100/60"
            >
              Annuleren
            </button>
            <button
              onClick={handleForceLiveSync}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#06478D] text-white hover:bg-[#053c77] shadow-xs cursor-pointer"
            >
              Ja, Nu Live Ophalen
            </button>
          </div>
        </div>
      )}

      {/* TWIZZIT API RATE LIMIT BUDGET & SMART CACHE CONTROL CARD */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#06478D] border border-blue-100">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-['Outfit'] text-slate-900 flex items-center gap-2">
                <span>Twizzit API Verbruik & Slimme Caching</span>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                  Limiet: {monthlyLimit} queries/maand
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Bescherming tegen overschrijding van het clubquotum op app.twizzit.com.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-clear-cache"
              onClick={onClearCache}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all cursor-pointer"
              title="Wist de lokale servercache zodat de volgende query een nieuwe live fetch doet"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Cache Wissen</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Columns: Budget, Cache Status, Expiry TTL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Col 1: Monthly Usage Progress Bar */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 font-['Outfit'] flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#06478D]" />
                Maandelijks Verbruik
              </span>
              <span className="text-xs font-extrabold font-mono text-[#06478D]">
                {queriesUsed} / {monthlyLimit}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  usagePercentage > 85 ? 'bg-rose-500' : (usagePercentage > 60 ? 'bg-amber-500' : 'bg-emerald-500')
                }`}
                style={{ width: `${Math.max(2, usagePercentage)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{usagePercentage}% benut</span>
              <span className="font-semibold text-emerald-700">{queriesRemaining} queries beschikbaar</span>
            </div>
          </div>

          {/* Col 2: Active Cache Status */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-700 font-['Outfit'] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Huidige Cache Status
            </span>

            {isCached ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-800">
                    Actief in cache
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                    0 API credits verbruikt
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-['Barlow']">
                  Nog <strong className="text-slate-900">{remainingMinutes} minuten</strong> geldig voor dit weekend.
                </p>
                {cacheInfo?.cachedAt && (
                  <p className="text-[10px] text-slate-400">
                    Laatste live update: {new Date(cacheInfo.cachedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-xs font-bold text-slate-800">
                    Geen actieve cache
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-['Barlow']">
                  Volgende query zal 1 live Twizzit API credit benutten en vervolgens cachen.
                </p>
              </div>
            )}
          </div>

          {/* Col 3: Cache Expiry TTL Selector */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-700 font-['Outfit'] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#06478D]" />
              Cache Geldigheid (TTL)
            </span>

            <div className="space-y-1">
              <select
                id="select-cache-ttl"
                value={currentTtl}
                onChange={(e) => onUpdateTtl(Number(e.target.value))}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#06478D] cursor-pointer"
              >
                <option value={60}>1 uur (Wedstrijddagen / last-minute)</option>
                <option value={120}>2 uur (Gemiddeld)</option>
                <option value={240}>4 uur (Aanbevolen standaard)</option>
                <option value={720}>12 uur (Halve dag)</option>
                <option value={1440}>24 uur (Zuinigste modus)</option>
              </select>
              <p className="text-[10px] text-slate-400 leading-tight mt-1">
                Binnen deze tijdsduur worden alle herladingen, tab-wissels en previews kosteloos geserveerd.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Weekend Selector Quick Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#06478D]" />
          <span className="text-xs font-bold font-['Outfit'] text-slate-800">Kies Speelweekend:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onDateRangeChange('2026-09-12', '2026-09-13')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-['Outfit'] transition-all cursor-pointer ${
              startDate === '2026-09-12' && endDate === '2026-09-13'
                ? 'bg-[#06478D] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🔥 Komend Weekend (12 - 13 Sep 2026)
          </button>

          <button
            onClick={() => onDateRangeChange('2026-09-05', '2026-09-06')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-['Outfit'] transition-all cursor-pointer ${
              startDate === '2026-09-05' && endDate === '2026-09-06'
                ? 'bg-[#06478D] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Vorig Weekend (5 - 6 Sep 2026)
          </button>

          <button
            onClick={() => onDateRangeChange('2026-09-19', '2026-09-20')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-['Outfit'] transition-all cursor-pointer ${
              startDate === '2026-09-19' && endDate === '2026-09-20'
                ? 'bg-[#06478D] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Volgend Weekend (19 - 20 Sep 2026)
          </button>

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span className="text-[11px] text-slate-400">Van:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onDateRangeChange(e.target.value, endDate)}
              className="text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg"
            />
            <span className="text-[11px] text-slate-400">Tot:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onDateRangeChange(startDate, e.target.value)}
              className="text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Grid: Credentials & Filter Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Twizzit Live Credentials (Col 1) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 font-['Outfit'] flex items-center gap-2">
            <Key className="w-4 h-4 text-[#06478D]" />
            Twizzit API Configuratie
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Organization ID</label>
              <input
                type="text"
                value={config.organizationId}
                onChange={(e) => onUpdateConfig({ organizationId: e.target.value })}
                className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#06478D]"
                placeholder="32037"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Twizzit API Account</label>
              <input
                type="text"
                value="Geconfigureerd via server (ENV)"
                disabled
                className="w-full text-xs font-mono px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 cursor-not-allowed"
              />
              <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">
                ✓ Geauthenticeerd via Twizzit REST API endpoint
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Event Type Filter</label>
              <div className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span>Event Type 4: Games</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">Actief</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Veilige Server Proxy</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-['Barlow'] leading-tight">
                Authenticatie en tokens worden serverside verwerkt in <code className="font-mono">/api/twizzit/*</code>, zonder dat credentials naar de browser lekken.
              </p>
            </div>

            <div className="pt-1">
              <a
                href="https://app.twizzit.com/v2/api/documentation/aTZsdXpkY0srT3VyRnRPQVkwQ3RIZz09"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#06478D] hover:underline font-semibold"
              >
                <span>Twizzit Swagger Documentatie</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Fixture Test Simulator & List (Cols 2 & 3) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold font-['Outfit'] text-slate-900 flex items-center gap-2">
                <span>Gevonden Wedstrijden</span>
                <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-[#06478D] rounded-full">
                  {matches.length} Totaal
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {homeCount} thuismatchen geselecteerd voor graphics ({awayCount} uitwedstrijden gefilterd)
              </p>
            </div>

            {/* Test Presets (Demonstrates the user's "no matches = don't post" rule) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Testscenario:</span>
              <button
                onClick={() => onSetMatchesPreset('standard')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  homeCount > 0 
                    ? 'bg-[#06478D] text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Met Thuismatchen ({homeCount})
              </button>
              <button
                onClick={() => onSetMatchesPreset('empty')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  homeCount === 0 
                    ? 'bg-amber-600 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Geen Thuismatchen (0)
              </button>
            </div>
          </div>

          {/* Filter Pill Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setFilterMode('home')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'home' ? 'bg-white text-[#06478D] shadow-xs' : 'text-slate-600'
                }`}
              >
                <Home className="w-3.5 h-3.5 text-emerald-600" />
                <span>Thuismatchen ({homeCount})</span>
              </button>
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Alle ({matches.length})
              </button>
              <button
                onClick={() => setFilterMode('away')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'away' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                <Plane className="w-3.5 h-3.5 text-slate-500" />
                <span>Uitmatchen ({awayCount})</span>
              </button>
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1 text-xs font-bold text-[#06478D] hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Match Toevoegen</span>
            </button>
          </div>

          {/* Add Match Quick Form */}
          {showAddForm && (
            <form onSubmit={handleCreateMatch} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Handmatig Match Invoeren</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">Dag</span>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value as any)}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="Saturday">Zaterdag</option>
                    <option value="Sunday">Zondag</option>
                  </select>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">Startuur</span>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                    placeholder="10u00"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">D-Mon Team</span>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                    placeholder="U14B-1"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">Tegenstander</span>
                  <input
                    type="text"
                    value={newOpponent}
                    onChange={(e) => setNewOpponent(e.target.value)}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                    placeholder="Merode"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#06478D] text-white text-xs font-bold rounded-lg"
                >
                  Opslaan & Toevoegen
                </button>
              </div>
            </form>
          )}

          {/* Fixtures List Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[460px] overflow-y-auto">
            {filteredMatches.length === 0 ? (
              <div className="p-8 text-center bg-slate-50">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">Geen wedstrijden in dit overzicht</p>
                <p className="text-xs text-slate-500 mt-1">
                  Kies een ander filter of schakel over naar het 'Met Thuismatchen' testscenario.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3">Dag / Datum</th>
                    <th className="py-2.5 px-3">Uur</th>
                    <th className="py-2.5 px-3">Match</th>
                    <th className="py-2.5 px-3">Cat.</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMatches.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-700">
                        <div>{m.day === 'Saturday' ? 'Zaterdag' : 'Zondag'}</div>
                        <div className="text-[10px] text-slate-400">{m.dateStr}</div>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#06478D]">
                        {m.time}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{m.displayMatchText}</div>
                        {m.twizzitId && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Twizzit #{m.twizzitId}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-700">
                          {m.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {m.isHome ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Thuismatch</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Uitmatch
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onRemoveMatch(m.id)}
                          className="text-slate-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                          title="Verwijder match"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
