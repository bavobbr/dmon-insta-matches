import React, { useState } from 'react';
import { InstagramConfig, GraphicSettings, Match } from '../types';
import { BRAND_COLORS } from '../brand';
import { 
  X, 
  Instagram, 
  Check, 
  Copy, 
  Download, 
  Send, 
  ExternalLink, 
  AlertCircle,
  Sparkles,
  Key
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface InstagramPublisherModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: InstagramConfig;
  onUpdateConfig: (newConfig: Partial<InstagramConfig>) => void;
  settings: GraphicSettings;
  activeMatches: Match[];
  graphicDataUrl?: string;
}

// Helper to guarantee JPEG encoding for Meta Graph API (Instagram strictly requires JPEG format)
async function ensureJpegDataUrl(dataUrl: string): Promise<string> {
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
    return dataUrl;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#06478D'; // Fallback background
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0);
        resolve(c.toDataURL('image/jpeg', 0.95));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export const InstagramPublisherModal: React.FC<InstagramPublisherModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  settings,
  activeMatches,
  graphicDataUrl
}) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);

  if (!isOpen) return null;

  const dayTitle = settings.selectedDay === 'Sunday' ? 'Zondag 6 september' : 'Zaterdag 5 september';
  const matchLines = activeMatches.map(m => `🏑 ${m.time}: ${m.displayMatchText}`).join('\n');

  const captionText = `🔥 THUISMATCHEN BIJ D-MON HOCKEY 🔥\n\nKomend weekend staan onze toppers weer op het veld in Dendermonde! Kom supporteren, geniet van het hockey en schuif gezellig aan bij onze bar! 💙❤️\n\n📅 ${dayTitle}\n${matchLines}\n\n🍻 Bar is geopend dankzij onze geweldige vrijwilligers!\n\n📍 D-Mon Hockey Club, Dendermonde\n🌐 www.dmon.be\n\n#dmonhockey #dendermonde #hockeybelgium #fieldhockey #thuismatchen #hockeyclub #vrijwilligers`;

  const handleCopy = () => {
    navigator.clipboard.writeText(captionText);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setErrorMessage(null);

    try {
      // Check if we have the rendered graphic
      if (!graphicDataUrl) {
        throw new Error("Het grafische canvas is nog niet gerenderd. Sluit dit venster en klik opnieuw op 'Post naar IG Stories'.");
      }

      // Ensure graphic is JPEG format for Meta Instagram Content Publishing API
      const jpegDataUrl = await ensureJpegDataUrl(graphicDataUrl);

      const res = await fetch('/api/instagram/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaType: 'STORY',
          caption: captionText,
          imageDataUrl: jpegDataUrl
        })
      });

      const data = await res.json();
      console.log('Instagram Publish API Response:', data);

      if (!res.ok || !data.success) {
        const detail = data.metaError?.message || data.error || 'Fout bij publiceren naar Instagram';
        throw new Error(detail);
      }

      setPublishedId(data.id);
      setPublishSuccess(true);
      confetti({
        particleCount: 80,
        spread: 75,
        origin: { y: 0.7 },
        colors: [BRAND_COLORS.clubblauw, BRAND_COLORS.clubrood, BRAND_COLORS.clubgoud]
      });
    } catch (err: any) {
      console.error('Publishing failed:', err);
      setErrorMessage(err.message || 'Onbekende fout bij publiceren');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#833ab4] via-[#fd1d1d] to-[#fcb045] flex items-center justify-center text-white shadow-md">
              <Instagram className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-['Outfit'] text-slate-900">
                Publiceren naar @dmon_hockey Instagram & FB
              </h3>
              <p className="text-xs text-slate-500">
                Meta Content Publishing API • Story & Feed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
                    {/* Publish Success State */}
          {publishSuccess ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-emerald-900 font-['Outfit']">
                Succesvol Gepubliceerd naar Instagram Stories!
              </h4>
              <p className="text-xs text-emerald-700 max-w-md mx-auto">
                De match graphic voor {settings.selectedDay} staat nu live op het Instagram account van <strong>@dmon_hockey</strong>!
              </p>
              {publishedId && (
                <div className="text-[11px] font-mono text-emerald-800 bg-emerald-100/70 py-1 px-3 rounded-md inline-block">
                  Meta Media ID: {publishedId}
                </div>
              )}
              <div className="pt-2 flex justify-center gap-3">
                <a
                  href="https://www.instagram.com/dmon_hockey/"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white text-xs font-bold rounded-xl shadow-xs hover:opacity-95 flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Bekijk @dmon_hockey op Instagram</span>
                </a>
                <button
                  onClick={() => setPublishSuccess(false)}
                  className="px-4 py-2 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold rounded-xl"
                >
                  Opnieuw testen
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Graphic Preview & Info */}
              {graphicDataUrl && (
                <div className="flex items-center gap-4 p-3 bg-blue-50/60 border border-blue-200 rounded-2xl">
                  <div className="w-16 h-24 shrink-0 rounded-xl overflow-hidden border border-slate-300 shadow-xs bg-slate-900">
                    <img src={graphicDataUrl} alt="Match Graphic" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs space-y-1">
                    <span className="font-bold text-[#06478D] font-['Outfit'] block text-sm">
                      Klaar voor Instagram Story
                    </span>
                    <p className="text-slate-600">
                      Formaat: <span className="font-semibold text-slate-800">{settings.format === 'story' ? '9:16 Story (1080×1920)' : '1:1 Vierkant'}</span> • Dag: <span className="font-semibold text-slate-800">{settings.selectedDay}</span>
                    </p>
                    <p className="text-[11px] text-amber-800 font-medium">
                      ⚠️ Live test: verschijnt direct in de Story van @dmon_hockey.
                    </p>
                  </div>
                </div>
              )}

              {/* Instagram Account Connection */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-['Outfit'] flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-[#06478D]" />
                    Meta Graph API Koppeling
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    config.isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {config.isConnected ? 'Gekoppeld met @dmon_hockey' : 'Niet verbonden'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-500 font-medium block mb-1">Instagram Business Account ID</label>
                    <input
                      type="text"
                      value={config.accountId}
                      onChange={(e) => onUpdateConfig({ accountId: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      placeholder="17841405829102931"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 font-medium block mb-1">Meta Graph Access Token</label>
                    <input
                      type="password"
                      value={config.accessToken}
                      onChange={(e) => onUpdateConfig({ accessToken: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                      placeholder="EAAJx84..."
                    />
                  </div>
                </div>
              </div>

              {/* Caption Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 font-['Outfit']">
                    Bijschrift & Hashtags
                  </label>
                  <button
                    onClick={handleCopy}
                    className="text-xs font-bold text-[#06478D] flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    {copiedCaption ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCaption ? 'Gekopieerd!' : 'Kopiëren'}</span>
                  </button>
                </div>
                <textarea
                  rows={5}
                  readOnly
                  value={captionText}
                  className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden"
                />
              </div>

              {/* Error Message Box */}
              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Publicatie mislukt bij Meta:</span>
                    <p className="mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Publish Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  id="btn-publish-to-instagram-confirm"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-95 text-white py-3 px-4 rounded-xl text-xs font-bold font-['Outfit'] uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  <Send className={`w-4 h-4 ${isPublishing ? 'animate-spin' : ''}`} />
                  <span>{isPublishing ? 'Bezig met uploaden naar Meta & Instagram...' : 'Nu Live Posten naar @dmon_hockey Story'}</span>
                </button>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
