import React, { useState } from 'react';
import { Stream, TokenInfo, WalletAccount } from '../types/stream';
import { SUPPORTED_TOKENS } from '../data/mockStreams';
import { StreamTicker60fps } from './StreamTicker60fps';
import {
  PlusCircle,
  Play,
  Pause,
  ArrowDownToLine,
  TrendingUp,
  AlertTriangle,
  Clock,
  Shield,
  Send,
  HelpCircle,
  Coins,
  CheckCircle2
} from 'lucide-react';

interface SenderDashboardProps {
  streams: Stream[];
  activeAccount: WalletAccount | null;
  onCreateStream: (newStream: Partial<Stream>) => void;
  onTopUpStream: (streamId: string, amount: number) => void;
  onPauseStream: (streamId: string) => void;
  onResumeStream: (streamId: string) => void;
  onCancelStream: (streamId: string) => void;
  onAdjustFlowRate: (streamId: string, newRate: number) => void;
}

export const SenderDashboard: React.FC<SenderDashboardProps> = ({
  streams,
  activeAccount,
  onCreateStream,
  onTopUpStream,
  onPauseStream,
  onResumeStream,
  onCancelStream,
  onAdjustFlowRate,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenInfo>(SUPPORTED_TOKENS[0]);
  const [recipient, setRecipient] = useState('GA489M2Q...9LPX8K');
  const [depositAmount, setDepositAmount] = useState('10000');
  const [durationDays, setDurationDays] = useState('30');
  const [cliffDays, setCliffDays] = useState('7');
  const [memo, setMemo] = useState('Stellar Drips Wave milestone-gated developer stream');
  const [topUpTargetId, setTopUpTargetId] = useState<string | null>(null);
  const [topUpAmount, setTopUpAmount] = useState('2500');

  // Filter streams where the active account is the sender
  const senderStreams = streams.filter(
    (s) => !activeAccount || s.sender === activeAccount.address || activeAccount.type === 'freighter'
  );

  const depositNum = parseFloat(depositAmount) || 0;
  const durationSec = (parseFloat(durationDays) || 30) * 86400;
  const calculatedFlowRate = durationSec > 0 ? depositNum / durationSec : 0;
  const calculatedDailyRate = calculatedFlowRate * 86400;

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const nowSec = Math.floor(Date.now() / 1000);
    const cliffSec = cliffDays ? nowSec + (parseFloat(cliffDays) || 0) * 86400 : undefined;

    onCreateStream({
      title: memo.slice(0, 45) || 'New Continuous Stream',
      sender: activeAccount?.address || 'GB7B3XW9QZ...4X9R2M',
      recipient,
      token: selectedToken,
      totalDeposit: depositNum,
      flowRatePerSecond: calculatedFlowRate,
      startTime: nowSec,
      stopTime: nowSec + durationSec,
      cliffTime: cliffSec,
      withdrawnAmount: 0,
      status: 'active',
      canSenderClawback: true,
      memo,
      milestones: [
        {
          id: `M-${Date.now().toString().slice(-4)}`,
          title: 'Milestone 1: Deliver Initial Testnet Artifacts',
          description: 'Initial verification on Soroban RPC.',
          scaleMultiplierBps: 10000,
          status: 'pending',
        },
      ],
    });

    setShowCreateModal(false);
  };

  const handleExecuteTopUp = (streamId: string) => {
    const amt = parseFloat(topUpAmount);
    if (amt > 0) {
      onTopUpStream(streamId, amt);
      setTopUpTargetId(null);
      setTopUpAmount('2500');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Sender Streaming Control</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              {senderStreams.length} Active Streams
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Lock funds into Soroban Persistent Storage with micro-drip flow rates, cliff guardrails, and clawback safety.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Stream
        </button>
      </div>

      {/* Streams Grid */}
      <div className="space-y-4">
        {senderStreams.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
            <Coins className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-300">No Streams Created Yet</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Initiate continuous token drip streams to developers, contributors, or automated grant recipients.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Create Stream
            </button>
          </div>
        ) : (
          senderStreams.map((stream) => {
            const isCliffInFuture = stream.cliffTime && Date.now() / 1000 < stream.cliffTime;

            return (
              <div
                key={stream.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 transition-all shadow-md space-y-4"
              >
                {/* Header info */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                        {stream.id}
                      </span>
                      <h3 className="text-base font-bold text-white">{stream.title}</h3>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>Recipient: <strong className="font-mono text-slate-300">{stream.recipient}</strong></span>
                      <span>Contract Sequence: <strong className="font-mono text-slate-300">#{stream.ledgerSequence}</strong></span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2">
                    {stream.status === 'paused' ? (
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Paused
                      </span>
                    ) : stream.status === 'cancelled' ? (
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        Cancelled / Clawed Back
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Live Streaming
                      </span>
                    )}
                  </div>
                </div>

                {/* 60fps ticker display */}
                <StreamTicker60fps stream={stream} />

                {/* Control Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Top-up button */}
                    <button
                      onClick={() => setTopUpTargetId(topUpTargetId === stream.id ? null : stream.id)}
                      disabled={stream.status === 'cancelled' || stream.status === 'completed'}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors disabled:opacity-50"
                    >
                      <Coins className="w-3.5 h-3.5 text-emerald-400" />
                      Top-Up Balance
                    </button>

                    {/* Pause / Resume button */}
                    {stream.status === 'paused' ? (
                      <button
                        onClick={() => onResumeStream(stream.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Resume Stream
                      </button>
                    ) : (
                      <button
                        onClick={() => onPauseStream(stream.id)}
                        disabled={stream.status === 'cancelled' || stream.status === 'completed'}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors disabled:opacity-50"
                      >
                        <Pause className="w-3.5 h-3.5 text-amber-400" />
                        Pause Stream
                      </button>
                    )}

                    {/* Milestone flow rate boost button */}
                    <button
                      onClick={() => onAdjustFlowRate(stream.id, stream.flowRatePerSecond * 1.5)}
                      disabled={stream.status === 'cancelled' || stream.status === 'completed'}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors disabled:opacity-50"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
                      Scale Rate (+50% Milestone)
                    </button>
                  </div>

                  {/* Emergency Clawback / Cancel */}
                  <div>
                    {stream.status !== 'cancelled' && stream.status !== 'completed' && (
                      <button
                        onClick={() => {
                          const confirmMsg = isCliffInFuture
                            ? 'Emergency Pre-Cliff Clawback: 100% of deposited tokens will be immediately drained back to your sender wallet. Confirm?'
                            : 'Cancel Stream: All unvested tokens will be refunded to your sender wallet, and recipient will receive currently vested tokens. Confirm?';
                          if (window.confirm(confirmMsg)) {
                            onCancelStream(stream.id);
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        {isCliffInFuture ? 'Emergency Pre-Cliff Clawback (100%)' : 'Drain Remaining Unvested'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Top-up inline panel */}
                {topUpTargetId === stream.id && (
                  <div className="bg-slate-950/70 border border-emerald-500/30 p-4 rounded-xl flex flex-wrap items-center gap-3 animate-in fade-in">
                    <span className="text-xs text-slate-300 font-medium">Add deposit to stream:</span>
                    <input
                      type="number"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-white text-xs font-mono w-32 focus:border-emerald-500 focus:outline-none"
                      placeholder="Amount"
                    />
                    <span className="text-xs font-mono text-emerald-400">{stream.token.symbol}</span>
                    <button
                      onClick={() => handleExecuteTopUp(stream.id)}
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-colors"
                    >
                      Confirm Top-Up (+Soroban Transfer)
                    </button>
                    <button
                      onClick={() => setTopUpTargetId(null)}
                      className="text-xs text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Stream Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700/80 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Create Continuous Soroban Stream</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="p-6 space-y-4">
              {/* Token Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Token</label>
                <div className="grid grid-cols-3 gap-2">
                  {SUPPORTED_TOKENS.map((tok) => (
                    <button
                      key={tok.symbol}
                      type="button"
                      onClick={() => setSelectedToken(tok)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        selectedToken.symbol === tok.symbol
                          ? 'bg-emerald-950/50 border-emerald-500 text-white'
                          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-lg">{tok.icon}</span>
                      <div>
                        <div className="font-bold text-xs">{tok.symbol}</div>
                        <div className="text-[10px] text-slate-400">{tok.decimals} decimals</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Recipient Stellar Address</label>
                <input
                  type="text"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                  placeholder="G..."
                />
              </div>

              {/* Deposit Amount & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Total Deposit ({selectedToken.symbol})
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Cliff Period */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    Cliff Period (Days) - Emergency Clawback Guardrail
                  </label>
                  <span className="text-[10px] text-amber-400">Sender can reclaim 100% before cliff</span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={cliffDays}
                  onChange={(e) => setCliffDays(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                  placeholder="0 for no cliff"
                />
              </div>

              {/* Memo */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Protocol Memo / Title</label>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. SCF Grant Milestone Stream"
                />
              </div>

              {/* Calculated Rate Box */}
              <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Computed Flow Rate:</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    +{calculatedFlowRate.toFixed(7)} {selectedToken.symbol} / sec
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Daily Allocation:</span>
                  <span className="text-white font-mono font-semibold">
                    ~{calculatedDailyRate.toFixed(2)} {selectedToken.symbol} / day
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Sign & Lock Deposit into Soroban
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
