import React, { useState } from 'react';
import { SchedulerConfig, ExecutionLog, Match } from '../types';
import { 
  Calendar, 
  Clock, 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowRight, 
  Shuffle, 
  Instagram, 
  Database,
  Sliders,
  History
} from 'lucide-react';

interface AutomationSchedulerProps {
  schedulerConfig: SchedulerConfig;
  onUpdateSchedulerConfig: (newConfig: Partial<SchedulerConfig>) => void;
  executionLogs: ExecutionLog[];
  homeMatchesCount: number;
  onRunWeeklyPipeline: () => void;
  isRunningPipeline: boolean;
}

export const AutomationScheduler: React.FC<AutomationSchedulerProps> = ({
  schedulerConfig,
  onUpdateSchedulerConfig,
  executionLogs,
  homeMatchesCount,
  onRunWeeklyPipeline,
  isRunningPipeline
}) => {
  return (
    <div className="space-y-8">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-['Outfit'] text-[#06478D]">
              Wekelijkse Vrijdag Automation Pipeline
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Elke Vrijdag Actief
            </span>
          </div>
          <p className="text-xs text-slate-500 font-['Barlow'] mt-1">
            Beslist autonoom op vrijdagochtend of er een post gemaakt moet worden op basis van actuele Twizzit thuismatchen.
          </p>
        </div>

        <button
          id="btn-trigger-test-pipeline"
          onClick={onRunWeeklyPipeline}
          disabled={isRunningPipeline}
          className="flex items-center space-x-2 bg-[#06478D] hover:bg-[#053c77] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold font-['Outfit'] uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer"
        >
          <Play className={`w-3.5 h-3.5 fill-current text-[#BD9D64] ${isRunningPipeline ? 'animate-spin' : ''}`} />
          <span>{isRunningPipeline ? 'Pipeline Draait...' : 'Simuleer Vrijdag Pipeline Nu'}</span>
        </button>
      </div>

      {/* Decision Engine Visual Flow */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-['Outfit']">
            Beslissingslogica van de Weekly Runner
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            Huidige Twizzit status: <strong className="text-[#06478D]">{homeMatchesCount} thuismatchen</strong>
          </span>
        </div>

        {/* 4-Step Pipeline Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          
          {/* Step 1 */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 relative">
            <div className="w-8 h-8 rounded-lg bg-[#06478D] text-white flex items-center justify-center text-xs font-bold mb-3 font-['Outfit']">
              01
            </div>
            <h4 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#06478D]" />
              Vrijdag Trigger
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-['Barlow']">
              Wekelijks op vrijdag om {schedulerConfig.timeOfDay} uur wordt de cron job geactiveerd.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 relative">
            <div className="w-8 h-8 rounded-lg bg-[#06478D] text-white flex items-center justify-center text-xs font-bold mb-3 font-['Outfit']">
              02
            </div>
            <h4 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#06478D]" />
              Twizzit Data & Filter
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-['Barlow']">
              Vraagt het speelschema op voor zaterdag & zondag. Filtert uitsluitend op thuismatchen te Dendermonde.
            </p>
          </div>

          {/* Step 3: THE DECISION */}
          <div className="bg-amber-50/70 rounded-xl p-4 border border-amber-200 relative">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs font-bold mb-3 font-['Outfit']">
              03
            </div>
            <h4 className="text-xs font-bold text-amber-900 mb-1 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-700" />
              Beslissing: Posten?
            </h4>
            <div className="text-[11px] text-amber-900 leading-snug space-y-1 font-['Barlow']">
              <p>• <strong>0 matchen:</strong> Post overslaan!</p>
              <p>• <strong>&gt; 0 matchen:</strong> Genereer story en ga verder naar stap 4.</p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 relative">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold mb-3 font-['Outfit']">
              04
            </div>
            <h4 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Instagram className="w-3.5 h-3.5 text-emerald-600" />
              Render & Post to IG
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-['Barlow']">
              Kiest willekeurige coachfoto, rendert 9:16 story met clubhuisstijl en post direct naar @dmon_hockey.
            </p>
          </div>

        </div>

        {/* Current Decision Engine Preview */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          homeMatchesCount > 0 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-3">
            {homeMatchesCount > 0 ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-amber-600 shrink-0" />
            )}
            <div>
              <p className="text-xs font-bold font-['Outfit']">
                {homeMatchesCount > 0
                  ? `Beslissing: WEL POSTEN (${homeMatchesCount} thuismatchen gepland)`
                  : 'Beslissing: NIET POSTEN (0 thuismatchen gepland)'}
              </p>
              <p className="text-[11px] opacity-80 font-['Barlow']">
                {homeMatchesCount > 0
                  ? 'Er zijn wedstrijden op zaterdag en/of zondag te Dendermonde. De generator maakt graphics aan.'
                  : 'Geen thuiswedstrijden voor het komend weekend gedetecteerd. Er wordt conform clubafspraak géén story geplaatst.'}
              </p>
            </div>
          </div>

          <span className="hidden sm:inline-block text-xs font-bold px-3 py-1 rounded-lg bg-white/80 border border-current shadow-2xs">
            {homeMatchesCount > 0 ? '✓ Ready to Publish' : '⏸ Auto-Skip Active'}
          </span>
        </div>
      </div>

      {/* Scheduler Configuration & Execution Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Scheduler Settings */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-['Outfit'] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#06478D]" />
            Schema Instellingen
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-600 block mb-1">Dag van publicatie</label>
              <select
                value={schedulerConfig.dayOfWeek}
                onChange={(e) => onUpdateSchedulerConfig({ dayOfWeek: parseInt(e.target.value, 10) })}
                className="w-full font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value={5}>Elke Vrijdag (Aanbevolen)</option>
                <option value={4}>Elke Donderdag</option>
                <option value={6}>Elke Zaterdagochtend</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-600 block mb-1">Tijdstip (24u)</label>
              <input
                type="time"
                value={schedulerConfig.timeOfDay}
                onChange={(e) => onUpdateSchedulerConfig({ timeOfDay: e.target.value })}
                className="w-full font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="pt-2 space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={schedulerConfig.enabled}
                  onChange={(e) => onUpdateSchedulerConfig({ enabled: e.target.checked })}
                  className="rounded-sm border-slate-300 text-[#06478D] focus:ring-[#06478D]"
                />
                <span className="font-bold text-slate-700">Wekelijks automatisch triggeren</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={schedulerConfig.skipIfNoMatches}
                  onChange={(e) => onUpdateSchedulerConfig({ skipIfNoMatches: e.target.checked })}
                  className="rounded-sm border-slate-300 text-[#06478D] focus:ring-[#06478D]"
                />
                <span className="font-bold text-slate-700">Overslaan indien 0 thuismatchen</span>
              </label>
            </div>
          </div>
        </div>

        {/* Execution Log History (Cols 2 & 3) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-['Outfit'] flex items-center gap-2">
              <History className="w-4 h-4 text-[#06478D]" />
              Uitvoeringsgeschiedenis & Audit Log
            </h3>
            <span className="text-xs text-slate-400 font-medium">Laatste runs</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {executionLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Nog geen logs. Klik op 'Simuleer Vrijdag Pipeline Nu' om een test uit te voeren.</p>
            ) : (
              executionLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.decision === 'POSTED' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {log.decision === 'POSTED' ? '✓ GEPOST OP INSTAGRAM' : '⏸ OVERGESLAGEN (0 MATCHEN)'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-700 font-medium">{log.details}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                    {log.homeMatchesCount} thuismatches
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
