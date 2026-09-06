import React, { useRef, useState } from 'react';
import { PhotoPoolItem } from '../types';
import { Upload, Shuffle, Check, Plus, Trash2, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';

interface PhotoPoolManagerProps {
  photos: PhotoPoolItem[];
  selectedPhotoUrl: string;
  onSelectPhoto: (url: string) => void;
  onAddPhoto: (photo: PhotoPoolItem) => void;
  onRemovePhoto: (id: string) => void;
  onRandomizePhoto: () => void;
  onResetDefaults?: () => void;
}

export const PhotoPoolManager: React.FC<PhotoPoolManagerProps> = ({
  photos,
  selectedPhotoUrl,
  onSelectPhoto,
  onAddPhoto,
  onRemovePhoto,
  onRandomizePhoto,
  onResetDefaults
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [coachName, setCoachName] = useState('Coach');

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        const newPhoto: PhotoPoolItem = {
          id: `coach-photo-${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          photographer: coachName.trim() || 'Club Coach',
          url: result,
          isUserUploaded: true,
          aspectRatio: '1:1'
        };
        onAddPhoto(newPhoto);
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div id="photo-pool-section" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 scroll-mt-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-['Outfit'] text-[#06478D]">
              Club Photo Pool (Coaches & Vrijwilligers)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#06478D]/10 text-[#06478D]">
              {photos.length} foto's
            </span>
          </div>
          <p className="text-xs text-slate-500 font-['Barlow'] mt-1">
            Mooie actiefoto's van coaches en vrijwilligers. Klik op een foto om hem te gebruiken, of klik op het rode prullenbakje om een foto te verwijderen.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onResetDefaults && (
            <button
              onClick={onResetDefaults}
              className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-xl text-xs font-semibold font-['Outfit'] transition-all cursor-pointer"
              title="Herstel de standaard selectie clubfoto's"
            >
              <span>Standaard Herstellen</span>
            </button>
          )}

          <button
            onClick={onRandomizePhoto}
            className="flex items-center space-x-2 bg-[#06478D]/10 hover:bg-[#06478D]/20 text-[#06478D] px-4 py-2 rounded-xl text-xs font-bold font-['Outfit'] transition-all cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5 text-[#BD9D64]" />
            <span>Willekeurige Foto Kiezen</span>
          </button>
        </div>
      </div>

      {/* Info banner explaining selection & deletion */}
      <div className="bg-blue-50/60 border border-blue-100 rounded-xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-base">💡</span>
          <span>
            <strong>Hoe werkt het?</strong> Klik op een foto om deze direct te selecteren voor de wedstrijdafbeelding hierboven. Klik op het <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-600 text-white font-bold text-[10px] mx-1">rode prullenbakje</span> op een foto om deze uit de pool te verwijderen.
          </span>
        </div>
      </div>

      {/* Upload Box (Drag & Drop + Click, adhering to Usability Patterns) */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-[#06478D] bg-blue-50/50 scale-101'
            : 'border-slate-300 hover:border-[#06478D] bg-slate-50/70 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          {isUploading ? (
            <>
              <div className="w-12 h-12 rounded-full bg-[#06478D]/10 text-[#06478D] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <p className="text-xs font-bold text-[#06478D] font-['Outfit']">
                Foto wordt verwerkt en opgeslagen...
              </p>
              <p className="text-[11px] text-slate-400 font-['Barlow']">
                Even geduld, afbeelding wordt toegevoegd aan de clubpool.
              </p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-[#06478D]/10 text-[#06478D] flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-800 font-['Outfit']">
                Sleep een nieuwe coachfoto hierheen of <span className="text-[#06478D] underline">klik om te bladeren</span>
              </p>
              <p className="text-[11px] text-slate-400 font-['Barlow']">
                Ondersteunt JPG, PNG, WebP van trainingen, wedstrijden of teamhuddles.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Photo Grid */}
      {photos.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
          <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">De fotopool is leeg</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Upload een foto hierboven of klik op 'Standaard Herstellen' om de clubfoto's terug te zetten.
          </p>
          {onResetDefaults && (
            <button
              onClick={onResetDefaults}
              className="px-4 py-2 bg-[#06478D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#053a74] cursor-pointer"
            >
              Standaard Clubfoto's Herstellen
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {photos.map((item) => {
            const isSelected = selectedPhotoUrl === item.url;
            return (
              <div
                key={item.id}
                className={`group relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-slate-900 ${
                  isSelected
                    ? 'border-[#06478D] ring-3 ring-[#06478D]/30 shadow-md'
                    : 'border-slate-200 hover:border-slate-400'
                }`}
                onClick={() => onSelectPhoto(item.url)}
              >
                <div className="aspect-[4/5] w-full overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/photos/photo-1.jpg';
                    }}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>

                {/* Bottom caption overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 text-white">
                  <p className="text-[11px] font-bold truncate leading-tight">{item.title}</p>
                  <p className="text-[9px] text-slate-300 truncate">📸 {item.photographer || 'D-Mon'}</p>
                </div>

                {/* Active Selection Badge */}
                {isSelected && (
                  <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-[#06478D] text-white flex items-center gap-1 text-[10px] font-bold shadow-md">
                    <Check className="w-3 h-3" />
                    <span>In Gebruik</span>
                  </div>
                )}

                {/* Remove Photo Button (Always visible on all photos) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePhoto(item.id);
                  }}
                  className="absolute top-2 left-2 p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md transition-all opacity-80 group-hover:opacity-100 hover:scale-110 cursor-pointer"
                  title="Verwijder deze foto uit de pool"
                  aria-label="Verwijder foto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
