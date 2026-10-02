import React from 'react';
import { Minus, Plus, RotateCcw, SlidersHorizontal } from 'lucide-react';
import type { GraphicSettings } from '../../shared/types/rendering';
import { getPhotoSplit, normalizePhotoFraming } from '../../shared/domain/photoFraming';

interface PhotoFramingToolbarProps {
  settings: GraphicSettings;
  onAdjust: (patch: Partial<GraphicSettings>) => void;
}

export function PhotoFramingToolbar({ settings, onAdjust }: PhotoFramingToolbarProps) {
  const framing = normalizePhotoFraming(settings);
  const zoomPercent = Math.round(framing.photoZoom * 100);
  const split = getPhotoSplit(settings);
  const presets = [
    { label: 'Centreer', patch: { photoOffsetX: 0, photoOffsetY: 0 } },
    { label: 'Boven', patch: { photoOffsetY: -1 } },
    { label: 'Onder', patch: { photoOffsetY: 1 } },
    { label: 'Links', patch: { photoOffsetX: -1 } },
    { label: 'Rechts', patch: { photoOffsetX: 1 } },
  ];
  const buttonClass = 'px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer disabled:opacity-40 disabled:cursor-default';

  return (
    <section aria-label="Foto uitsnede" className="w-full max-w-lg mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
      <div>
        <h3 className="font-['Outfit'] text-sm font-bold text-[#06478D]">Foto & uitsnede</h3>
        <p className="text-[11px] text-slate-500 mt-1">Sleep op de foto om te kadreren. Scroll of knijp om te zoomen.</p>
      </div>
      <div className="space-y-2">
        <label htmlFor="photo-split" className="flex justify-between text-xs font-semibold text-slate-600">
          <span>Fotobreedte</span><span>{Math.round(split * 100)}% foto</span>
        </label>
        <input id="photo-split" type="range" min="35" max="55" step="1" value={Math.round(split * 100)}
          onChange={event => onAdjust({ splitRatio: Number(event.target.value) / 100 })}
          className="w-full accent-[#06478D] cursor-pointer" />
      </div>
      <div className="space-y-2">
        <label htmlFor="photo-zoom" className="flex justify-between text-xs font-semibold text-slate-600"><span>Zoom</span><span>{zoomPercent}%</span></label>
        <div className="flex items-center gap-3">
          <button type="button" aria-label="10% uitzoomen" disabled={framing.photoZoom <= 1}
            onClick={() => onAdjust({ photoZoom: Math.max(1, Math.round((framing.photoZoom - 0.1) * 100) / 100) })} className={buttonClass}><Minus className="w-4 h-4" /></button>
          <input id="photo-zoom" type="range" min="100" max="300" step="1" value={zoomPercent}
            onChange={event => onAdjust({ photoZoom: Number(event.target.value) / 100 })} className="w-full accent-[#06478D] cursor-pointer" />
          <button type="button" aria-label="10% inzoomen" disabled={framing.photoZoom >= 3}
            onClick={() => onAdjust({ photoZoom: Math.min(3, Math.round((framing.photoZoom + 0.1) * 100) / 100) })} className={buttonClass}><Plus className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map(preset => <button key={preset.label} type="button" onClick={() => onAdjust(preset.patch)} className={buttonClass}>{preset.label}</button>)}
        <button type="button" onClick={() => onAdjust({ photoZoom: 1, photoOffsetX: 0, photoOffsetY: 0 })}
          className={`${buttonClass} flex items-center gap-1.5`}><RotateCcw className="w-3.5 h-3.5" />Herstel uitsnede</button>
      </div>
      <details className="border-t border-slate-100 pt-3">
        <summary className="text-xs font-semibold text-slate-600 cursor-pointer"><SlidersHorizontal className="inline w-3.5 h-3.5 mr-1.5" />Nauwkeurig bijstellen</summary>
        <div className="mt-3 space-y-3">
          {([
            { key: 'photoOffsetX', label: 'Horizontaal' },
            { key: 'photoOffsetY', label: 'Verticaal' },
          ] as const).map(axis => <div key={axis.key}>
            <label htmlFor={`photo-${axis.key}`} className="flex justify-between text-xs text-slate-600"><span>{axis.label}</span><span>{Math.round(framing[axis.key] * 100)}%</span></label>
            <input id={`photo-${axis.key}`} type="range" min="-100" max="100" step="1" value={Math.round(framing[axis.key] * 100)}
              onChange={event => onAdjust({ [axis.key]: Number(event.target.value) / 100 })} className="w-full accent-[#06478D] cursor-pointer" />
          </div>)}
        </div>
      </details>
    </section>
  );
}
