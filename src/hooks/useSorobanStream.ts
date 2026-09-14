import { useState, useEffect, useRef, useCallback } from 'react';
import { Stream } from '../types/stream';

export interface StreamLiveMetrics {
  claimable: number;
  vestedSoFar: number;
  withdrawn: number;
  remainingUnvested: number;
  progressPercent: number;
  isCliffActive: boolean;
  secondsToCliff: number;
  secondsRemaining: number;
  stroopsPerSecond: number;
}

export function useSorobanStream(stream: Stream) {
  const [metrics, setMetrics] = useState<StreamLiveMetrics>(() => calculateMetrics(stream));
  const rafRef = useRef<number | null>(null);

  function calculateMetrics(s: Stream): StreamLiveMetrics {
    const now = Date.now() / 1000;
    const isCliffActive = Boolean(s.cliffTime && now < s.cliffTime);
    const secondsToCliff = s.cliffTime ? Math.max(0, s.cliffTime - now) : 0;
    const secondsRemaining = Math.max(0, s.stopTime - now);

    if (s.status === 'cancelled' || s.status === 'completed') {
      return {
        claimable: 0,
        vestedSoFar: s.withdrawnAmount,
        withdrawn: s.withdrawnAmount,
        remainingUnvested: 0,
        progressPercent: (s.withdrawnAmount / (s.totalDeposit || 1)) * 100,
        isCliffActive: false,
        secondsToCliff: 0,
        secondsRemaining: 0,
        stroopsPerSecond: 0,
      };
    }

    if (now < s.startTime) {
      return {
        claimable: 0,
        vestedSoFar: 0,
        withdrawn: 0,
        remainingUnvested: s.totalDeposit,
        progressPercent: 0,
        isCliffActive,
        secondsToCliff,
        secondsRemaining,
        stroopsPerSecond: s.flowRatePerSecond * 1e7,
      };
    }

    // Determine calculation endpoint
    const effectiveTime = s.status === 'paused'
      ? (s.pausedAt ?? now)
      : Math.min(now, s.stopTime);

    const elapsed = Math.max(0, effectiveTime - s.lastUpdateTimestamp);
    const multiplier = 1; // already factored into flowRatePerSecond or base
    const incrementalVested = elapsed * s.flowRatePerSecond * multiplier;

    let totalVested = s.accumulatedBeforePause + incrementalVested;
    if (totalVested > s.totalDeposit) {
      totalVested = s.totalDeposit;
    }

    const claimable = isCliffActive ? 0 : Math.max(0, totalVested - s.withdrawnAmount);
    const remainingUnvested = Math.max(0, s.totalDeposit - totalVested);
    const progressPercent = s.totalDeposit > 0 ? (totalVested / s.totalDeposit) * 100 : 0;
    const stroopsPerSecond = s.flowRatePerSecond * 1e7;

    return {
      claimable,
      vestedSoFar: totalVested,
      withdrawn: s.withdrawnAmount,
      remainingUnvested,
      progressPercent,
      isCliffActive,
      secondsToCliff,
      secondsRemaining,
      stroopsPerSecond,
    };
  }

  const tick = useCallback(() => {
    setMetrics(calculateMetrics(stream));

    if (stream.status === 'active' && Date.now() / 1000 < stream.stopTime) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [stream]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [tick]);

  return metrics;
}
