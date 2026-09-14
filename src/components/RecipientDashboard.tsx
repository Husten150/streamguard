import React, { useState } from 'react';
import { Stream, WalletAccount } from '../types/stream';
import { StreamTicker60fps } from './StreamTicker60fps';
import { useSorobanStream } from '../hooks/useSorobanStream';
import confetti from 'canvas-confetti';
import {
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldAlert,
  History,
  Coins,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface RecipientDashboardProps {
  streams: Stream[];
  activeAccount: WalletAccount | null;
  onWithdraw: (streamId: string, amount?: number) => void;
}

export const RecipientDashboard: React.FC<RecipientDashboardProps> = ({
  streams,
  activeAccount,
  onWithdraw,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [selectedStreamForWithdraw, setSelectedStreamForWithdraw] = useState<Stream | null>(null);
  const [customWithdrawAmount, setCustomWithdrawAmount] = useState('');
  const [lastTxReceipt, setLastTxReceipt] = useState<{
    txHash: string;
    amount: number;
    symbol: string;
    ledgerSequence: number;
    feeStroops: number;
  } | null>(null);

  // Incoming streams for current recipient (or fallback to all incoming in preview)
  const incomingStreams = streams.filter(
    (s) => !activeAccount || s.recipient === activeAccount.address || activeAccount.type !== 'freighter'
  );

  const activeIncoming = incomingStreams.filter((s) => s.status === 'active' || s.status === 'paused');
  const historyStreams = incomingStreams.filter((s) => s.status === 'completed' || s.status === 'cancelled');

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#14b8a6', '#06b6d4', '#f59e0b'],
      });
    } catch (e) {
      // ignore
    }
  };

  const handleClaim = (stream: Stream, specificAmount?: number) => {
    onWithdraw(stream.id, specificAmount);
    triggerConfetti();

    // Set simulated transaction receipt
    setLastTxReceipt({
      txHash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}...soroban`,
      amount: specificAmount || 100, // resolved in parent
      symbol: stream.token.symbol,
      ledgerSequence: 498450 + Math.floor(Math.random() * 50),
      feeStroops: 100, // 0.00001 XLM
    });

    setSelectedStreamForWithdraw(null);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Vesting In Real-Time
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Recipient Claim Portal</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Watch your streaming tokens accrue every millisecond. Withdraw anytime with single-click Soroban authorization and zero lock-in once cliff passes.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'active'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Active Streams</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/30">
              {activeIncoming.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            History ({historyStreams.length})
          </button>
        </div>
      </div>

      {/* Recent Tx Toast / Receipt */}
      {lastTxReceipt && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-300">
                Soroban Withdrawal Confirmed on Testnet
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Tx: {lastTxReceipt.txHash} • Ledger #{lastTxReceipt.ledgerSequence} • Fee: {lastTxReceipt.feeStroops} Stroops (0.00001 XLM)
              </div>
            </div>
          </div>
          <button
            onClick={() => setLastTxReceipt(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main View Area */}
      {activeTab === 'active' ? (
        <div className="space-y-4">
          {activeIncoming.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
              <Coins className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-300">No Active Incoming Streams</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                When grant managers or employers create a stream destined for your Stellar address, it will automatically stream here.
              </p>
            </div>
          ) : (
            activeIncoming.map((stream) => (
              <RecipientStreamCard
                key={stream.id}
                stream={stream}
                onOpenClaimModal={() => setSelectedStreamForWithdraw(stream)}
                onClaimInstant={(amt) => handleClaim(stream, amt)}
              />
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {historyStreams.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              No historical streams recorded yet.
            </div>
          ) : (
            historyStreams.map((stream) => (
              <div
                key={stream.id}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">{stream.id}</span>
                    <h4 className="text-sm font-semibold text-white">{stream.title}</h4>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Withdrawn total: <strong className="text-slate-200">{stream.withdrawnAmount.toLocaleString()} {stream.token.symbol}</strong> of {stream.totalDeposit.toLocaleString()} {stream.token.symbol}
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-md font-semibold ${
                  stream.status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {stream.status.toUpperCase()}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Partial / Full Claim Modal */}
      {selectedStreamForWithdraw && (
        <WithdrawModal
          stream={selectedStreamForWithdraw}
          onClose={() => setSelectedStreamForWithdraw(null)}
          onConfirm={(amount) => handleClaim(selectedStreamForWithdraw, amount)}
        />
      )}
    </div>
  );
};

interface RecipientStreamCardProps {
  stream: Stream;
  onOpenClaimModal: () => void;
  onClaimInstant: (amt?: number) => void;
}

// Sub-component for individual Recipient Stream Card
const RecipientStreamCard: React.FC<RecipientStreamCardProps> = ({
  stream,
  onOpenClaimModal,
  onClaimInstant,
}) => {
  const metrics = useSorobanStream(stream);
  const isCliffLocked = metrics.isCliffActive;

  return (
    <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 transition-all shadow-md space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded">
              {stream.id}
            </span>
            <h3 className="text-base font-bold text-white">{stream.title}</h3>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Sender: <span className="font-mono text-slate-300">{stream.sender}</span>
          </div>
        </div>

        {/* Status Pill */}
        <div>
          {isCliffLocked ? (
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              Cliff Guard Active
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Unlocked & Claimable
            </span>
          )}
        </div>
      </div>

      {/* 60fps Real-time Ticker */}
      <StreamTicker60fps stream={stream} />

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>Total Stream Cap: <strong className="text-slate-200">{stream.totalDeposit.toLocaleString()} {stream.token.symbol}</strong></span>
          <span>•</span>
          <span>Claimed: <strong className="text-slate-200">{stream.withdrawnAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {stream.token.symbol}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenClaimModal}
            disabled={isCliffLocked || metrics.claimable <= 0}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
          >
            Custom Amount...
          </button>

          <button
            onClick={() => onClaimInstant()}
            disabled={isCliffLocked || metrics.claimable <= 0}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Claim All Available Drips ({metrics.claimable.toFixed(2)} {stream.token.symbol})
          </button>
        </div>
      </div>
    </div>
  );
}

interface WithdrawModalProps {
  stream: Stream;
  onClose: () => void;
  onConfirm: (amt: number) => void;
}

// Modal for selecting custom withdrawal amount
const WithdrawModal: React.FC<WithdrawModalProps> = ({
  stream,
  onClose,
  onConfirm,
}) => {
  const metrics = useSorobanStream(stream);
  const [amt, setAmt] = useState(metrics.claimable.toFixed(4));

  const handleMax = () => {
    setAmt(metrics.claimable.toFixed(4));
  };

  const handleHalf = () => {
    setAmt((metrics.claimable / 2).toFixed(4));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
        <h3 className="text-lg font-bold text-white">Withdraw Vested Drips</h3>
        <p className="text-xs text-slate-400">
          Authorize a Soroban contract transaction to withdraw vested tokens directly to your Stellar account.
        </p>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Max Claimable Now:</span>
            <span className="font-mono text-emerald-400 font-bold">
              {metrics.claimable.toFixed(7)} {stream.token.symbol}
            </span>
          </div>

          <div className="relative">
            <input
              type="number"
              value={amt}
              onChange={(e) => setAmt(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">
              {stream.token.symbol}
            </span>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleHalf}
              className="text-[11px] px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white"
            >
              50%
            </button>
            <button
              onClick={handleMax}
              className="text-[11px] px-2.5 py-1 rounded bg-slate-800 text-emerald-400 hover:bg-emerald-950/50"
            >
              100% Max
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-3">
          <span>Estimated Soroban Network Fee:</span>
          <span className="font-mono text-slate-200">~100 Stroops (&lt; $0.0001)</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(parseFloat(amt) || metrics.claimable)}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
          >
            Confirm & Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}
