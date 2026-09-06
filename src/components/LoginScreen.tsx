import React, { useState } from 'react';
import { DMON_LOGO_URL, BRAND_COLORS } from '../brand';
import { Lock, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { AuthUser } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('dmon');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Aanmelden mislukt. Controleer gegevens.');
      }

      const authUser: AuthUser = {
        username: data.user.username,
        displayName: data.user.displayName,
        token: data.token
      };

      // Persist in localStorage
      localStorage.setItem('dmon_auth_token', data.token);
      localStorage.setItem('dmon_auth_user', JSON.stringify(authUser));

      onLoginSuccess(authUser);
    } catch (err: any) {
      setErrorMessage(err.message || 'Kon niet inloggen.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 sm:px-6 relative overflow-hidden font-['Barlow']">
      
      {/* Dynamic background accents in club colors */}
      <div 
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none" 
        style={{ backgroundColor: BRAND_COLORS.clubblauw }}
      />
      <div 
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none" 
        style={{ backgroundColor: BRAND_COLORS.clubrood }}
      />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 sm:p-10 relative z-10 border border-slate-100">
        
        {/* Header with Club Crest */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-slate-50 border-2 border-[#06478D]/20 p-2 shadow-inner mb-4 flex items-center justify-center">
            <img 
              src={DMON_LOGO_URL} 
              alt="D-Mon Hockey Dendermonde" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-black font-['Outfit'] text-[#06478D] tracking-tight">
            D-MON <span className="text-[#B62C17]">HOCKEY</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Matchday Story & Automation Studio
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Beveiligde Toegang voor Clubleden</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Gebruikersnaam
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="dmon"
                autoComplete="username"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06478D] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Wachtwoord
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••"
                autoComplete="current-password"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06478D] focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            id="btn-submit-login"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 px-4 bg-[#06478D] hover:bg-[#053c77] disabled:opacity-60 text-white font-bold font-['Outfit'] rounded-xl text-sm tracking-wide shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98 cursor-pointer"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Verifiëren...</span>
              </div>
            ) : (
              <>
                <span>Aanmelden</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            D-Mon Hockey Dendermonde v.z.w. • Twizzit Org #32037
          </p>
        </div>
      </div>
    </div>
  );
};
