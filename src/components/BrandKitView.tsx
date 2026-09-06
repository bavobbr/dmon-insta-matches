import React from 'react';
import { BRAND_COLORS, BRAND_GRADIENTS, DMON_LOGO_URL, getHockeyFieldLinesSvg } from '../brand';
import { Copy, Check, Palette, Sparkles, Shield, Type, Layers, Download } from 'lucide-react';

export const BrandKitView: React.FC = () => {
  const [copiedHex, setCopiedHex] = React.useState<string | null>(null);

  const copyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const palette = [
    { name: 'Clubblauw', role: 'Primair', hex: BRAND_COLORS.clubblauw, bgClass: 'bg-[#06478D]', textWhite: true },
    { name: 'Clubrood', role: 'Accent', hex: BRAND_COLORS.clubrood, bgClass: 'bg-[#B62C17]', textWhite: true },
    { name: 'Clubgoud', role: 'Spaarzaam', hex: BRAND_COLORS.clubgoud, bgClass: 'bg-[#BD9D64]', textWhite: false },
    { name: 'Donkerblauw', role: 'Tekst & Diepte', hex: BRAND_COLORS.donkerblauw, bgClass: 'bg-[#35526F]', textWhite: true },
    { name: 'Clubwit', role: 'Achtergrond', hex: BRAND_COLORS.clubwit, bgClass: 'bg-[#FCFCFC] border border-slate-200', textWhite: false },
  ];

  return (
    <div className="space-y-8">
      
      {/* Brand Kit Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-['Outfit'] text-[#06478D]">
              D-Mon Hockey Huisstijl & Merkgebruik
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#06478D]/10 text-[#06478D]">
              Officiële Brand Kit
            </span>
          </div>
          <p className="text-xs text-slate-500 font-['Barlow'] mt-1">
            Gebaseerd op de officiële stijlgids voor social media, story templates en clubcommunicatie.
          </p>
        </div>
        <div className="w-14 h-14 rounded-full border-2 border-[#06478D] overflow-hidden bg-white shadow-xs p-0.5 shrink-0">
          <img src={DMON_LOGO_URL} alt="D-Mon Hockey Club Logo" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* Color Palette Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-['Outfit'] flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#06478D]" />
            Officiële Clubkleuren
          </h3>
          <span className="text-xs text-slate-400">Klik op een kleur om HEX te kopiëren</span>
        </div>

        {/* Hero Verloop */}
        <div className="rounded-xl overflow-hidden shadow-xs border border-slate-200">
          <div className="h-16 w-full bg-gradient-to-r from-[#06478D] to-[#35526F] p-3 flex items-center justify-between text-white font-['Outfit']">
            <span className="text-xs font-bold uppercase tracking-wider">Hero-Verloop — Lineair 115°</span>
            <span className="text-xs opacity-90 font-mono">#06478D ➔ #35526F</span>
          </div>
        </div>

        {/* Palette Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {palette.map((c) => (
            <button
              key={c.hex}
              onClick={() => copyColor(c.hex)}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-left transition-all group cursor-pointer"
            >
              <div className={`w-full h-14 rounded-lg mb-2 shadow-xs transition-transform group-hover:scale-102 ${c.bgClass}`} />
              <p className="text-xs font-bold text-slate-800 font-['Outfit']">{c.name}</p>
              <p className="text-[11px] text-slate-500 font-['Barlow']">{c.role}</p>
              <p className="text-[11px] font-mono text-[#06478D] mt-1 flex items-center justify-between">
                <span>{c.hex}</span>
                {copiedHex === c.hex ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Typography & Elements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Typography */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-['Outfit'] flex items-center gap-2">
            <Type className="w-4 h-4 text-[#06478D]" />
            Typografie
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-[#06478D] uppercase tracking-wider block mb-1">
                Outfit • Titels & Eyebrows
              </span>
              <p className="text-2xl font-black text-[#06478D] font-['Outfit'] uppercase">
                THUISMATCHEN
              </p>
              <p className="text-xs text-slate-500 font-['Barlow'] mt-1">
                700/800/900 gewichten, altijd krachtig en strak.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Barlow • Broodtekst & Matchdetails
              </span>
              <p className="text-sm font-medium text-slate-700 font-['Barlow']">
                U10G-1 - Baudouin • 10u00 • Veld 1 Waterveld
              </p>
              <p className="text-xs text-slate-500 font-['Barlow'] mt-1">
                400/500/600 gewichten voor maximale leesbaarheid.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-[#B62C17] uppercase tracking-wider block mb-1">
                Handwritten Script • Vrijwilligers
              </span>
              <p className="text-xl text-[#06478D] font-['Caveat'] font-bold">
                Bar open dankzij onze vrijwilligers
              </p>
              <p className="text-xs text-slate-500 font-['Barlow'] mt-1">
                Sfeervol handgeschreven accent linksonder op de grasfoto.
              </p>
            </div>
          </div>
        </div>

        {/* Elements: Field Lines & Accent Stripes */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-['Outfit'] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#06478D]" />
            Grafische Elementen & Veldlijnen
          </h3>

          <div className="space-y-4">
            {/* Field lines simulation */}
            <div className="relative h-28 bg-[#06478D] rounded-xl overflow-hidden p-4 flex flex-col justify-end text-white border border-[#06478D]">
              <div 
                className="absolute inset-0 opacity-20 pointer-events-none"
                dangerouslySetInnerHTML={{ __html: getHockeyFieldLinesSvg(400, 150) }}
              />
              <span className="relative z-10 text-xs font-bold font-['Outfit'] uppercase">
                Lijnenpatroon van het Hockeyveld
              </span>
              <span className="relative z-10 text-[11px] text-white/80 font-['Barlow']">
                Witte veldlijnen op 8-12% dekking over clubblauw voor diepte.
              </span>
            </div>

            {/* Red/Gold accent stripe */}
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1.5 font-['Outfit'] uppercase">
                Rood-Gouden Accentstreep
              </span>
              <div className="h-3 w-full rounded-full bg-gradient-to-r from-[#B62C17] to-[#BD9D64] shadow-xs" />
              <p className="text-[11px] text-slate-500 mt-1 font-['Barlow']">
                Geeft visuele balans onder de titels op stories en posts.
              </p>
            </div>

            {/* Club Facts */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="p-2.5 rounded-xl bg-slate-50 text-center border border-slate-200">
                <span className="text-sm font-extrabold text-[#06478D] font-['Outfit']">2018</span>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Opgericht</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 text-center border border-slate-200">
                <span className="text-sm font-extrabold text-[#06478D] font-['Outfit']">30+</span>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Teams</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 text-center border border-slate-200">
                <span className="text-sm font-extrabold text-[#06478D] font-['Outfit']">350+</span>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Leden</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Official Club Emblem Showcase */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#06478D]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-['Outfit']">
              Officieel Club Embleem (Rond Transparant)
            </h3>
          </div>
          <a
            href={DMON_LOGO_URL}
            download="dmon-logo-round-transparant.png"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#06478D] text-white text-xs font-bold hover:bg-[#06478D]/90 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Download PNG Logo
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 rounded-xl bg-slate-100/80 border border-slate-200 flex flex-col items-center justify-center text-center">
            <div className="w-28 h-28 drop-shadow-md mb-3 transition-transform hover:scale-105">
              <img src={DMON_LOGO_URL} alt="D-Mon Hockey Badge (Licht)" className="w-full h-full object-contain" />
            </div>
            <span className="text-xs font-bold text-slate-700 font-['Outfit']">Weergave op Lichte Ondergrond</span>
            <span className="text-[11px] text-slate-500 font-['Barlow']">Transparante PNG • 256x256</span>
          </div>

          <div className="p-6 rounded-xl bg-[#06478D] border border-[#06478D] flex flex-col items-center justify-center text-center text-white">
            <div className="w-28 h-28 drop-shadow-lg mb-3 transition-transform hover:scale-105">
              <img src={DMON_LOGO_URL} alt="D-Mon Hockey Badge (Donker)" className="w-full h-full object-contain" />
            </div>
            <span className="text-xs font-bold text-white font-['Outfit']">Weergave op Clubblauw</span>
            <span className="text-[11px] text-white/80 font-['Barlow']">Automatisch gestyled op Stories & Graphics</span>
          </div>
        </div>
      </div>

    </div>
  );
};
