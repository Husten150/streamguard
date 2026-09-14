import React, { useState } from 'react';
import { GRANT_STRATEGY_CONTENT } from '../contracts/rustSource';
import { Award, Zap, Copy, Check, Sparkles, CheckCircle2, Calendar, Target, Shield } from 'lucide-react';

export const GrantStrategySection: React.FC = () => {
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(GRANT_STRATEGY_CONTENT.elevatorPitch);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  const handleCopyFullMarkdown = () => {
    const md = `# StreamGuard: Stellar Drips Wave Grant Submission

## 1. Elevator Pitch
${GRANT_STRATEGY_CONTENT.elevatorPitch}

## 2. Technical Differentiators on Stellar Soroban
${GRANT_STRATEGY_CONTENT.technicalDifferentiators
  .map((d) => `### ${d.title} [${d.tag}]\n${d.desc}`)
  .join('\n\n')}

## 3. Post-Hackathon Mainnet Launch Roadmap
${GRANT_STRATEGY_CONTENT.milestones
  .map(
    (m) => `### Milestone ${m.number}: ${m.title} (${m.duration})\n` +
      m.deliverables.map((del) => `- ${del}`).join('\n')
  )
  .join('\n\n')}
`;
    navigator.clipboard.writeText(md);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            Stellar Drips Wave • Hackathon Grant Package
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Submission Strategy & Technical Blueprint
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            A comprehensive, battle-tested grant dossier tailored to Stellar Foundation reviewers and Soroban core engineers.
          </p>
        </div>

        <button
          onClick={handleCopyFullMarkdown}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 self-start md:self-auto"
        >
          {copiedFull ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copiedFull ? 'Full Markdown Copied!' : 'Copy Entire Grant Application'}
        </button>
      </div>

      {/* 3-Sentence Elevator Pitch */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wider">
              3-Sentence Elevator Pitch (Reviewer Executive Summary)
            </h3>
          </div>
          <button
            onClick={handleCopyPitch}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors"
          >
            {copiedPitch ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedPitch ? 'Copied' : 'Copy Pitch'}
          </button>
        </div>

        <blockquote className="text-slate-100 text-sm sm:text-base leading-relaxed font-serif italic border-l-2 border-emerald-500 pl-4 py-1">
          "{GRANT_STRATEGY_CONTENT.elevatorPitch}"
        </blockquote>
      </div>

      {/* Technical Differentiators Grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h3 className="text-base font-bold text-white">
            Technical Differentiators Highlighting Stellar & Soroban
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GRANT_STRATEGY_CONTENT.technicalDifferentiators.map((diff, idx) => (
            <div
              key={idx}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-2 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                  {diff.tag}
                </span>
                <span className="text-xs font-mono text-slate-500">#0{idx + 1}</span>
              </div>
              <h4 className="text-sm font-bold text-white">{diff.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{diff.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3-Milestone Launch Roadmap */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-teal-400" />
          <h3 className="text-base font-bold text-white">
            Post-Hackathon 3-Milestone Mainnet Launch Roadmap
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {GRANT_STRATEGY_CONTENT.milestones.map((ms) => (
            <div
              key={ms.number}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-emerald-400 text-xs">
                    {ms.number}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{ms.duration}</span>
                </div>
                <h4 className="text-sm font-bold text-white">{ms.title}</h4>
                <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  {ms.deliverables.map((del, dIdx) => (
                    <li key={dIdx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug text-slate-400">{del}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono flex items-center justify-between">
                <span>Phase Status: Planned</span>
                <span className="text-emerald-400">Target Q4</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
