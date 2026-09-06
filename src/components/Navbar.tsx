import React from 'react';
import { BRAND_COLORS, DMON_LOGO_URL } from '../brand';
import { Play, Sparkles, Instagram, Database, Calendar, Palette, LogOut, UserCheck } from 'lucide-react';
import { AuthUser } from '../types';

interface NavbarProps {
  activeTab: 'studio' | 'twizzit' | 'automation' | 'brand';
  setActiveTab: (tab: 'studio' | 'twizzit' | 'automation' | 'brand') => void;
  homeMatchesCount: number;
  twizzitConnected: boolean;
  instagramConnected: boolean;
  onRunAutomation: () => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  homeMatchesCount,
  twizzitConnected,
  instagramConnected,
  onRunAutomation,
  currentUser,
  onLogout
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 gap-3">
          
          {/* Brand & Club Logo */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-[#06478D]/30 shadow-xs bg-white shrink-0 p-0.5">
              <img 
                src={DMON_LOGO_URL} 
                alt="D-Mon Hockey Club Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-base sm:text-lg text-[#06478D] font-['Outfit'] whitespace-nowrap">
                D-MON <span className="text-[#B62C17]">HOCKEY</span>
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden sm:flex items-center space-x-1 bg-slate-100/90 p-1 rounded-xl shrink-0">
            <button
              id="nav-tab-studio"
              onClick={() => setActiveTab('studio')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'studio'
                  ? 'bg-white text-[#06478D] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#06478D]" />
              <span>Studio</span>
            </button>

            <button
              id="nav-tab-twizzit"
              onClick={() => setActiveTab('twizzit')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'twizzit'
                  ? 'bg-white text-[#06478D] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-[#06478D]" />
              <span>Matchen</span>
              {homeMatchesCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                  {homeMatchesCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-automation"
              onClick={() => setActiveTab('automation')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'automation'
                  ? 'bg-white text-[#06478D] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-[#06478D]" />
              <span>Automatie</span>
            </button>

            <button
              id="nav-tab-brand"
              onClick={() => setActiveTab('brand')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'brand'
                  ? 'bg-white text-[#06478D] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-[#BD9D64]" />
              <span>Huisstijl</span>
            </button>
          </nav>

          {/* Quick Actions & Status */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <div className="hidden lg:flex items-center space-x-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 border border-slate-200">
                <span className={`w-1.5 h-1.5 rounded-full ${twizzitConnected ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                Twizzit
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 border border-slate-200">
                <span className={`w-1.5 h-1.5 rounded-full ${instagramConnected ? 'bg-emerald-500' : 'bg-blue-400'}`} />
                Instagram
              </span>
            </div>

            <button
              id="btn-run-weekly-automation"
              onClick={onRunAutomation}
              className="flex items-center space-x-1.5 bg-[#06478D] hover:bg-[#053c77] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold font-['Outfit'] transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-98 shrink-0"
              title="Voer automatische wekelijkse publicatie pipeline uit"
            >
              <Play className="w-3 h-3 fill-current text-[#BD9D64]" />
              <span>Run Pipeline</span>
            </button>

            {/* Logged in User Badge & Logout */}
            {currentUser && onLogout && (
              <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200">
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-700">
                  <UserCheck className="w-3 h-3 text-emerald-600" />
                  <span>@{currentUser.username}</span>
                </span>
                <button
                  id="btn-logout"
                  onClick={onLogout}
                  title="Afmelden"
                  className="flex items-center space-x-1 p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Afmelden</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="sm:hidden flex space-x-1 py-1.5 overflow-x-auto border-t border-slate-100">
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 ${
              activeTab === 'studio' ? 'bg-[#06478D] text-white' : 'text-slate-600'
            }`}
          >
            Studio
          </button>
          <button
            onClick={() => setActiveTab('twizzit')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 ${
              activeTab === 'twizzit' ? 'bg-[#06478D] text-white' : 'text-slate-600'
            }`}
          >
            Matchen ({homeMatchesCount})
          </button>
          <button
            onClick={() => setActiveTab('automation')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 ${
              activeTab === 'automation' ? 'bg-[#06478D] text-white' : 'text-slate-600'
            }`}
          >
            Automatie
          </button>
          <button
            onClick={() => setActiveTab('brand')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 ${
              activeTab === 'brand' ? 'bg-[#06478D] text-white' : 'text-slate-600'
            }`}
          >
            Huisstijl
          </button>
        </div>
      </div>
    </header>
  );
};
