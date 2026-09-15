import React from 'react';
import { Stream } from '../types/stream';
import { useSorobanStream } from '../hooks/useSorobanStream';
import { ShieldAlert } from 'lucide-react';

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

  const integerPart = Math.floor(claimable).toLocaleString();
  const rawFraction = (claimable % 1).toFixed(7).substring(2);

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
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', fontFamily: 'var(--font-mono)' }}>
        <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-emerald)' }}>{integerPart}.</span>
        <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--accent-emerald-bright)' }}>{rawFraction}</span>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '4px', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>{stream.token.symbol}</span>
      </div>
    );
  }

  return (
    <div className="stream-ticker">
      {/* Header bar */}
      <div className="ticker-label-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-active" style={{ fontSize: '10px', padding: '2px 8px' }}>
            <span className="status-dot pulsing" />
            {stream.status === 'active' ? 'STREAMING AT 60 FPS' : stream.status.toUpperCase()}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Rate: <strong style={{ color: '#ffffff' }}>+{ratePerDay} {stream.token.symbol}</strong>/day
          </span>
        </div>

        {isCliffActive && (
          <span className="badge badge-paused">
            <ShieldAlert style={{ width: 12, height: 12 }} />
            Cliff active ({formatCountdown(secondsToCliff)})
          </span>
        )}
      </div>

      {/* Real-time Ticker Value */}
      <div style={{ margin: '8px 0' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Live Claimable Drip</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>7-Decimal Stroop Precision</span>
        </div>

        <div className="ticker-digits">
          <span>{integerPart}.</span>
          <span className="ticker-fraction">{rawFraction}</span>
          <span className="ticker-currency">{stream.token.symbol}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-container">
        <div className="progress-labels">
          <span>Vested: {vestedSoFar.toLocaleString(undefined, { maximumFractionDigits: 2 })} {stream.token.symbol}</span>
          <span>{progressPercent.toFixed(1)}% of {stream.totalDeposit.toLocaleString()} {stream.token.symbol}</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(100, progressPercent)}%` }}
          />
        </div>
      </div>

      {showDetails && (
        <div className="metrics-strip">
          <div className="metric-box">
            <span className="metric-label">Withdrawn so far</span>
            <span className="metric-val">
              {stream.withdrawnAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {stream.token.symbol}
            </span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Remaining unvested</span>
            <span className="metric-val">
              {remainingUnvested.toLocaleString(undefined, { maximumFractionDigits: 2 })} {stream.token.symbol}
            </span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Current Flow Rate</span>
            <span className="metric-val accent">
              +{stream.flowRatePerSecond.toFixed(7)} / sec
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
