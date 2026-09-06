import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Match, GraphicSettings, PhotoPoolItem, GraphicFormat } from '../types';
import { renderGraphicToCanvas } from '../utils/canvasRenderer';
import { BRAND_COLORS } from '../brand';
import { getSuggestedSubtitle, formatShortDateSlash } from '../utils/dateFormatter';
import { 
  Download, 
  Share2, 
  Shuffle, 
  Copy, 
  Check, 
  Instagram, 
  Eye, 
  Sliders, 
  RefreshCw,
  Sparkles,
  Layers,
  Heart,
  ArrowDown
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GraphicPreviewProps {
  saturdayMatches: Match[];
  sundayMatches: Match[];
  photoPool: PhotoPoolItem[];
  settings: GraphicSettings;
  onUpdateSettings: (newSettings: Partial<GraphicSettings>) => void;
  onOpenInstagramModal: (dataUrl?: string) => void;
  onRandomizePhoto: () => void;
}

export const GraphicPreview: React.FC<GraphicPreviewProps> = ({
  saturdayMatches,
  sundayMatches,
  photoPool,
  settings,
  onUpdateSettings,
  onOpenInstagramModal,
  onRandomizePhoto
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [copiedCaption, setCopiedCaption] = useState<boolean>(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);

  const activeMatches = useMemo(() => {
    if (settings.selectedDay === 'Sunday') return sundayMatches;
    if (settings.selectedDay === 'Saturday') return saturdayMatches;
    return [...saturdayMatches, ...sundayMatches];
  }, [settings.selectedDay, saturdayMatches, sundayMatches]);

  const isStory = settings.format === 'story';

  // Trigger canvas re-render when dependencies change
  useEffect(() => {
    let isCancelled = false;
    const render = async () => {
      if (!canvasRef.current) return;
      setIsRendering(true);
      try {
        await renderGraphicToCanvas({
          canvas: canvasRef.current,
          matches: activeMatches,
          saturdayMatches,
          sundayMatches,
          settings
        });
      } catch (err) {
        console.error('Rendering failed:', err);
      } finally {
        if (!isCancelled) setIsRendering(false);
      }
    };

    render();
    return () => {
      isCancelled = true;
    };
  }, [settings, activeMatches, saturdayMatches, sundayMatches]);

  // Download high-resolution PNG
  const handleDownload = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    const daySlug = settings.selectedDay.toLowerCase();
    const formatSlug = settings.format;
    link.download = `dmon-hockey-${daySlug}-${formatSlug}.png`;
    link.href = dataUrl;
    link.click();

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: [BRAND_COLORS.clubblauw, BRAND_COLORS.clubrood, BRAND_COLORS.clubgoud]
    });
  };

  // Generate Instagram Caption
  const generateCaption = (): string => {
    let matchContent = '';
    if (settings.selectedDay === 'Weekend') {
      const satDate = saturdayMatches[0]?.dateStr || 'Zaterdag';
      const sunDate = sundayMatches[0]?.dateStr || 'Zondag';
      const satLines = saturdayMatches.length > 0
        ? saturdayMatches.map(m => `  🏑 ${m.time}: ${m.displayMatchText}`).join('\n')
        : '  Geen thuismatchen';
      const sunLines = sundayMatches.length > 0
        ? sundayMatches.map(m => `  🏑 ${m.time}: ${m.displayMatchText}`).join('\n')
        : '  Geen thuismatchen';

      matchContent = `📅 ${satDate.toUpperCase()}\n${satLines}\n\n📅 ${sunDate.toUpperCase()}\n${sunLines}`;
    } else {
      const dayTitle = settings.selectedDay === 'Sunday' ? (sundayMatches[0]?.dateStr || 'Zondag') : (saturdayMatches[0]?.dateStr || 'Zaterdag');
      const lines = activeMatches.map(m => `🏑 ${m.time}: ${m.displayMatchText}`).join('\n');
      matchContent = `📅 ${dayTitle}\n${lines || 'Geen thuismatchen'}`;
    }

    return `🔥 THUISMATCHEN BIJ D-MON HOCKEY 🔥\n\nKomend weekend staan onze toppers weer op het veld in Dendermonde! Kom supporteren, geniet van het hockey en schuif gezellig aan bij onze bar! 💙❤️\n\n${matchContent}\n\n🍻 Bar is geopend dankzij onze geweldige vrijwilligers!\n\n📍 D-Mon Hockey Club, Dendermonde\n🌐 www.dmon.be\n\n#dmonhockey #dendermonde #hockeybelgium #fieldhockey #thuismatchen #hockeyclub #vrijwilligers`;
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(generateCaption());
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Visual Canvas Display (Center / Left 7 cols) */}
      <div className="lg:col-span-7 flex flex-col items-center">
        
        {/* Top Control Pill Bar */}
        <div className="w-full max-w-xl mb-4 flex items-center justify-between gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
          {/* Format Toggle (Story 9:16 vs Square 1:1) */}
          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              id="btn-format-story"
              onClick={() => onUpdateSettings({ format: 'story' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                settings.format === 'story'
                  ? 'bg-[#06478D] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Story 9:16
            </button>
            <button
              id="btn-format-square"
              onClick={() => onUpdateSettings({ format: 'square' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                settings.format === 'square'
                  ? 'bg-[#06478D] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Post 1:1
            </button>
          </div>

          {/* Day Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              id="btn-day-weekend"
              onClick={() => {
                onUpdateSettings({ 
                  selectedDay: 'Weekend',
                  customSubtitle: getSuggestedSubtitle('Weekend', saturdayMatches[0]?.dateStr, sundayMatches[0]?.dateStr)
                });
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                settings.selectedDay === 'Weekend'
                  ? 'bg-[#06478D] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weekend ({saturdayMatches.length + sundayMatches.length})
            </button>
            <button
              id="btn-day-saturday"
              onClick={() => onUpdateSettings({ 
                selectedDay: 'Saturday',
                customSubtitle: getSuggestedSubtitle('Saturday', saturdayMatches[0]?.dateStr)
              })}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                settings.selectedDay === 'Saturday'
                  ? 'bg-[#06478D] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Zat ({saturdayMatches.length})
            </button>
            <button
              id="btn-day-sunday"
              onClick={() => onUpdateSettings({ 
                selectedDay: 'Sunday',
                customSubtitle: getSuggestedSubtitle('Sunday', undefined, sundayMatches[0]?.dateStr)
              })}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                settings.selectedDay === 'Sunday'
                  ? 'bg-[#06478D] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Zon ({sundayMatches.length})
            </button>
          </div>
        </div>

        {/* If Weekend in Square format, show column vs stacked toggle */}
        {settings.selectedDay === 'Weekend' && !isStory && (
          <div className="w-full max-w-lg mb-3 flex items-center justify-between px-3 py-2 bg-blue-50/80 border border-blue-200 rounded-xl text-xs">
            <span className="font-bold text-[#06478D] flex items-center gap-1.5">
              <span>Layout 1:1 Vierkant:</span>
            </span>
            <div className="flex bg-white p-0.5 rounded-lg border border-blue-200">
              <button
                type="button"
                onClick={() => onUpdateSettings({ weekendLayout: 'columns' })}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                  settings.weekendLayout !== 'stacked'
                    ? 'bg-[#06478D] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2 Kolommen (Aanrader)
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ weekendLayout: 'stacked' })}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                  settings.weekendLayout === 'stacked'
                    ? 'bg-[#06478D] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Gestapeld (Compact)
              </button>
            </div>
          </div>
        )}

        {/* The Graphic Canvas Container Frame */}
        <div className="relative group w-full max-w-md flex justify-center">
          
          <div 
            className={`relative overflow-hidden rounded-2xl shadow-2xl border-4 border-slate-900/10 bg-slate-900 transition-all ${
              isStory ? 'aspect-[9/16] w-[360px] sm:w-[410px]' : 'aspect-square w-[380px] sm:w-[460px]'
            }`}
          >
            {/* HTML5 Canvas Element */}
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain block"
            />

            {/* Quick Floating Action: Randomize Photo on Graphic */}
            <button
              id="btn-quick-shuffle"
              onClick={onRandomizePhoto}
              title="Kies andere foto uit pool"
              className="absolute top-3 left-3 flex items-center space-x-1.5 bg-black/60 hover:bg-black/85 text-white backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5 text-[#BD9D64]" />
              <span>Andere foto</span>
            </button>

            {/* Badge Indicator & Status */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#06478D]/90 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-xs border border-white/20 shadow-sm">
              {isRendering && <RefreshCw className="w-2.5 h-2.5 animate-spin text-[#BD9D64]" />}
              <span>{isStory ? '1080 × 1920 PX' : '1080 × 1080 PX'}</span>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons underneath the preview */}
        <div className="w-full max-w-lg mt-5 flex flex-wrap gap-3 justify-center">
          <button
            id="btn-download-graphic"
            onClick={handleDownload}
            className="flex-1 min-w-[160px] flex items-center justify-center space-x-2 bg-[#06478D] hover:bg-[#053c77] text-white px-5 py-3 rounded-xl font-['Outfit'] font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#BD9D64]" />
            <span>Download PNG</span>
          </button>

          <button
            id="btn-publish-instagram-modal"
            onClick={() => {
              const dataUrl = canvasRef.current ? canvasRef.current.toDataURL('image/jpeg', 0.95) : undefined;
              onOpenInstagramModal(dataUrl);
            }}
            className="flex-1 min-w-[160px] flex items-center justify-center space-x-2 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-95 text-white px-5 py-3 rounded-xl font-['Outfit'] font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer"
          >
            <Instagram className="w-4 h-4 text-white" />
            <span>Post naar IG Stories</span>
          </button>

          <button
            id="btn-copy-caption"
            onClick={handleCopyCaption}
            className="flex items-center justify-center space-x-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-4 py-3 rounded-xl font-semibold text-xs shadow-xs transition-all cursor-pointer"
            title="Kopieer Instagram bijschrift met hashtags"
          >
            {copiedCaption ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Gekopieerd!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Kopieer Caption</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Graphic Customizer & Settings (Right 5 cols) */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        
        {/* Title & Brand Badge */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold font-['Outfit'] text-[#06478D]">
              Graphic Configurator
            </h2>
            <p className="text-xs text-slate-500 font-['Barlow']">
              D-Mon Hockey Huisstijl & Veldlayout
            </p>
          </div>
          <div className="h-2.5 w-14 rounded-full bg-gradient-to-r from-[#B62C17] to-[#BD9D64]" />
        </div>

        {/* Selected Day & Subtitle Inputs */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-['Outfit']">
            Titels & Datumaanduiding
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-slate-500 block mb-1 font-medium">Hoofdtitel</span>
              <input
                id="input-custom-title"
                type="text"
                value={settings.customTitle}
                onChange={(e) => onUpdateSettings({ customTitle: e.target.value })}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#06478D]"
                placeholder="Thuismatches"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block mb-1 font-medium">Datum / Dag</span>
              <input
                id="input-custom-subtitle"
                type="text"
                value={settings.customSubtitle || ''}
                onChange={(e) => onUpdateSettings({ customSubtitle: e.target.value })}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#06478D]"
                placeholder="Weekend 12/09 & 13/09"
              />
            </div>
          </div>
        </div>

        {/* Volunteer Badge Text */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-['Outfit'] flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-[#B62C17]" />
              <span>Vrijwilligers Tekst (Foto Overlay)</span>
            </label>
            <input
              type="checkbox"
              checked={settings.showVolunteerBadge}
              onChange={(e) => onUpdateSettings({ showVolunteerBadge: e.target.checked })}
              className="rounded-sm border-slate-300 text-[#06478D] focus:ring-[#06478D] cursor-pointer"
            />
          </div>
          <input
            id="input-volunteer-badge"
            type="text"
            disabled={!settings.showVolunteerBadge}
            value={settings.volunteerBadgeText}
            onChange={(e) => onUpdateSettings({ volunteerBadgeText: e.target.value })}
            className={`w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#06478D] ${
              !settings.showVolunteerBadge ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            placeholder="Bar open dankzij onze vrijwilligers"
          />
          <p className="text-[11px] text-slate-400 font-['Barlow']">
            Wordt in elegant wit handgeschreven lettertype linksonder op het gras weergegeven.
          </p>
        </div>

        {/* Photo Pool Quick Selector */}
        <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 font-['Outfit'] block">
                Foto Kiezen (Zijbalk Snelkiezer)
              </label>
              <span className="text-[11px] text-slate-500 font-['Barlow']">
                {photoPool.length} foto's beschikbaar in de club pool
              </span>
            </div>
            <button
              onClick={onRandomizePhoto}
              className="text-xs font-bold text-[#06478D] hover:underline flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs"
            >
              <Shuffle className="w-3 h-3 text-[#BD9D64]" />
              Willekeurig
            </button>
          </div>

          {/* Active Photo Info Badge */}
          {(() => {
            const currentPhoto = photoPool.find(p => p.url === settings.photoUrl);
            return currentPhoto ? (
              <div className="flex items-center gap-2.5 bg-white p-2 rounded-lg border border-slate-200 text-xs">
                <div className="w-9 h-9 rounded-md overflow-hidden shrink-0 border border-slate-200">
                  <img
                    src={currentPhoto.url}
                    alt={currentPhoto.title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/photos/photo-1.jpg';
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-800 text-[11px] truncate leading-tight">{currentPhoto.title}</p>
                  <p className="text-[10px] text-slate-400 truncate">📸 {currentPhoto.photographer || 'Clubfotograaf'}</p>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                  Actief
                </span>
              </div>
            ) : null;
          })()}

          {/* Quick Thumbnails */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {photoPool.map((p) => {
              const isSelected = settings.photoUrl === p.url;
              return (
                <button
                  key={p.id}
                  onClick={() => onUpdateSettings({ photoUrl: p.url })}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    isSelected ? 'border-[#06478D] ring-2 ring-[#06478D]/30 scale-102' : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                  }`}
                  title={`${p.title} (${p.photographer || 'D-Mon'})`}
                >
                  <img
                    src={p.url}
                    alt={p.title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/photos/photo-1.jpg';
                    }}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#06478D]/30 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-[#06478D] text-white flex items-center justify-center text-[10px] shadow-xs">
                        ✓
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Link to Full Pool Manager Below */}
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('photo-pool-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="w-full py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-center text-[11px] font-bold text-[#06478D] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <span>Nieuwe foto's uploaden of verwijderen? Open Photo Pool hieronder</span>
            <ArrowDown className="w-3 h-3 text-[#06478D]" />
          </button>
        </div>

        {/* Brand Kit Visual Options */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-['Outfit']">
            Brand Kit Instellingen
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center space-x-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showFieldLines}
                onChange={(e) => onUpdateSettings({ showFieldLines: e.target.checked })}
                className="rounded-sm border-slate-300 text-[#06478D] focus:ring-[#06478D]"
              />
              <span className="text-xs font-semibold text-slate-700">Witte Veldlijnen</span>
            </label>

            <label className="flex items-center space-x-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showLogo}
                onChange={(e) => onUpdateSettings({ showLogo: e.target.checked })}
                className="rounded-sm border-slate-300 text-[#06478D] focus:ring-[#06478D]"
              />
              <span className="text-xs font-semibold text-slate-700">D-Mon Logo Badge</span>
            </label>

            <label className="flex items-center space-x-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.gradientOverlay}
                onChange={(e) => onUpdateSettings({ gradientOverlay: e.target.checked })}
                className="rounded-sm border-slate-300 text-[#06478D] focus:ring-[#06478D]"
              />
              <span className="text-xs font-semibold text-slate-700">Hero-Verloop 115°</span>
            </label>

            {/* Split ratio slider */}
            <div className="p-2 rounded-lg border border-slate-200">
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                <span>Split Verhouding</span>
                <span>{Math.round(settings.splitRatio * 100)}% Foto</span>
              </div>
              <input
                type="range"
                min="0.35"
                max="0.55"
                step="0.01"
                value={settings.splitRatio}
                onChange={(e) => onUpdateSettings({ splitRatio: parseFloat(e.target.value) })}
                className="w-full accent-[#06478D] h-1.5 cursor-pointer"
              />
            </div>

            {settings.selectedDay === 'Weekend' && (
              <div className="p-2 rounded-lg border border-slate-200">
                <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                  1:1 Post Layout
                </span>
                <select
                  value={settings.weekendLayout || 'columns'}
                  onChange={(e) => onUpdateSettings({ weekendLayout: e.target.value as 'columns' | 'stacked' })}
                  className="w-full text-xs font-semibold px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-700"
                >
                  <option value="columns">2 Kolommen (Aanrader)</option>
                  <option value="stacked">Gestapeld (Compact)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Current Active Matches Summary */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
            <span>Matchen op deze graphic ({activeMatches.length}):</span>
            <span className="text-emerald-700 font-extrabold">
              {settings.selectedDay === 'Weekend' ? 'Zaterdag & Zondag' : settings.selectedDay}
            </span>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-2 text-xs text-slate-600">
            {settings.selectedDay === 'Weekend' ? (
              <>
                <div className="font-bold text-[#B62C17] text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <span>📅 Zaterdag ({saturdayMatches.length})</span>
                </div>
                <div className="space-y-1 pl-2 border-l-2 border-[#B62C17]/30">
                  {saturdayMatches.map((m) => (
                    <div key={m.id} className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-[#06478D]">{m.time}</span>
                      <span className="font-medium text-slate-800 truncate px-1">{m.displayMatchText}</span>
                      <span className="text-[9px] text-slate-400">{m.category}</span>
                    </div>
                  ))}
                </div>

                <div className="font-bold text-[#BD9D64] text-[11px] uppercase tracking-wider flex items-center gap-1 pt-1">
                  <span>📅 Zondag ({sundayMatches.length})</span>
                </div>
                <div className="space-y-1 pl-2 border-l-2 border-[#BD9D64]/30">
                  {sundayMatches.map((m) => (
                    <div key={m.id} className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-[#06478D]">{m.time}</span>
                      <span className="font-medium text-slate-800 truncate px-1">{m.displayMatchText}</span>
                      <span className="text-[9px] text-slate-400">{m.category}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="divide-y divide-slate-100">
                {activeMatches.map((m) => (
                  <div key={m.id} className="pt-1.5 flex justify-between items-center">
                    <span className="font-bold text-[#06478D]">{m.time}</span>
                    <span className="font-medium text-slate-800">{m.displayMatchText}</span>
                    <span className="text-[10px] text-slate-400">{m.category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
