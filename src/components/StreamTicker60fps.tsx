import React from 'react';
import { Stream } from '../types/stream';
import { useSorobanStream } from '../hooks/useSorobanStream';
import { Zap, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

interface StreamTickerProps {
  stream: Stream;
  showDetails?: boolean;
  compact?: boolean;
}

export const StreamTicker60fps: React.FC<StreamTickerProps> = ({
  stream,
  showDetails = true,
  compact = false,
}) => {
  const {
    claimable,
    vestedSoFar,
    remainingUnvested,
    progressPercent,
    isCliffActive,
    secondsToCliff,
  } = useSorobanStream(stream);

  // Format integer and fractional decimal parts
  const integerPart = Math.floor(claimable).toLocaleString();
  const rawFraction = (claimable % 1).toFixed(7).substring(2);

  // Format flow rate per day
  const ratePerDay = (stream.flowRatePerSecond * 86400).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });

  const formatCountdown = (secs: number) => {
    const days = Math.floor(secs / 86400);
    const hours = Math.floor((secs % 86400) / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h ${mins}m left`;
  };

  if (compact) {
    return (
      <div className="flex items-baseline gap-1 font-mono">
        <span className="text-xl font-bold text-emerald-400">{integerPart}.</span>
        <span className="text-xl font-mono text-emerald-300 font-bold tracking-wider">{rawFraction}</span>
        <span className="text-xs text-slate-400 ml-1 font-sans font-semibold">{stream.token.symbol}</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-emerald-500/25 rounded-xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Background ambient glow */}
      <div className="absolute -right-16 -top-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              {stream.status === 'active' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                stream.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}></span>
            </span>
            {stream.status === 'active' ? 'STREAMING AT 60 FPS' : stream.status.toUpperCase()}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Rate: <strong className="text-slate-200">+{ratePerDay} {stream.token.symbol}</strong>/day
          </span>
        </div>

        {isCliffActive && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2.5 py-0.5 rounded-md">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            Cliff active ({formatCountdown(secondsToCliff)})
          </span>
        )}
      </div>

      {/* Real-time Ticker Value */}
      <div className="my-2">
        <div className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-1 flex items-center justify-between">
          <span>Live Claimable Drip</span>
          <span className="text-[11px] text-slate-500 font-mono">7-Decimal Stroop Precision</span>
        </div>

        <div className="flex flex-wrap items-baseline gap-1 font-mono">
          <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {integerPart}.
          </span>
          <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono tracking-widest">
            {rawFraction}
          </span>
          <span className="text-base sm:text-lg text-emerald-300 ml-1.5 font-sans font-bold">
            {stream.token.symbol}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-xs text-slate-400 font-medium">
          <span>Vested: {vestedSoFar.toLocaleString(undefined, { maximumFractionDigits: 2 })} {stream.token.symbol}</span>
          <span>{progressPercent.toFixed(1)}% of {stream.totalDeposit.toLocaleString()} {stream.token.symbol}</span>
        </div>
        <div className="w-full bg-slate-800/90 h-2 rounded-full overflow-hidden border border-slate-700/50">
          <div
            className="bg-gradient-to-r from-teal-500 via-emerald-400 to-green-300 h-full transition-all duration-150 rounded-full"
            style={{ width: `${Math.min(100, progressPercent)}%` }}
          />
        </div>
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-xs">
          <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Withdrawn so far</span>
            <span className="text-slate-200 font-semibold font-mono">
              {stream.withdrawnAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {stream.token.symbol}
            </span>
          </div>
          <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Remaining unvested</span>
            <span className="text-slate-200 font-semibold font-mono">
              {remainingUnvested.toLocaleString(undefined, { maximumFractionDigits: 2 })} {stream.token.symbol}
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-slate-800/40 rounded-lg p-2 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Current Flow Rate</span>
            <span className="text-emerald-300 font-semibold font-mono">
              +{stream.flowRatePerSecond.toFixed(7)} / sec
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
