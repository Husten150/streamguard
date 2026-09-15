import React, { useState } from 'react';
import { Stream, TokenInfo, WalletAccount } from '../types/stream';
import { SUPPORTED_TOKENS } from '../data/mockStreams';
import { StreamTicker60fps } from './StreamTicker60fps';
import {
  PlusCircle,
  Play,
  Pause,
  TrendingUp,
  AlertTriangle,
  Shield,
  Coins,
  CheckCircle2,
  X
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
    <div>
      {/* Top action bar */}
      <div className="section-banner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 className="banner-heading">Sender Streaming Control</h2>
            <span className="brand-tag">
              {senderStreams.length} Active Streams
            </span>
          </div>
          <p className="banner-subtitle">
            Lock funds into Soroban Persistent Storage with micro-drip flow rates, cliff guardrails, and clawback safety.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <PlusCircle style={{ width: 16, height: 16 }} />
          Create New Stream
        </button>
      </div>

      {/* Streams List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {senderStreams.length === 0 ? (
          <div className="panel-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <Coins style={{ width: 44, height: 44, color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>No Streams Created Yet</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '6px auto 16px auto' }}>
              Initiate continuous token drip streams to developers, contributors, or automated grant recipients.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <PlusCircle style={{ width: 16, height: 16 }} />
              Create Stream
            </button>
          </div>
        ) : (
          senderStreams.map((stream) => {
            const isCliffInFuture = stream.cliffTime && Date.now() / 1000 < stream.cliffTime;

            return (
              <div key={stream.id} className="stream-card">
                {/* Header info */}
                <div className="stream-card-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="stream-id-badge">{stream.id}</span>
                      <h3 className="stream-title">{stream.title}</h3>
                    </div>
                    <div className="stream-meta">
                      <span>Recipient: <code>{stream.recipient}</code></span>
                      <span>Contract Sequence: <code>#{stream.ledgerSequence}</code></span>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div>
                    {stream.status === 'paused' ? (
                      <span className="badge badge-paused">Paused</span>
                    ) : stream.status === 'cancelled' ? (
                      <span className="badge badge-danger">Cancelled / Clawed Back</span>
                    ) : (
                      <span className="badge badge-active">
                        <span className="status-dot pulsing" />
                        Live Streaming
                      </span>
                    )}
                  </div>
                </div>

                {/* 60fps ticker display */}
                <StreamTicker60fps stream={stream} />

                {/* Control Action Toolbar */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                    {/* Top-up button */}
                    <button
                      onClick={() => setTopUpTargetId(topUpTargetId === stream.id ? null : stream.id)}
                      disabled={stream.status === 'cancelled' || stream.status === 'completed'}
                      className="btn btn-secondary"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      <Coins style={{ width: 14, height: 14, color: 'var(--accent-emerald)' }} />
                      Top-Up Balance
                    </button>

                    {/* Pause / Resume button */}
                    {stream.status === 'paused' ? (
                      <button
                        onClick={() => onResumeStream(stream.id)}
                        className="btn btn-primary"
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        <Play style={{ width: 14, height: 14 }} />
                        Resume Stream
                      </button>
                    ) : (
                      <button
                        onClick={() => onPauseStream(stream.id)}
                        disabled={stream.status === 'cancelled' || stream.status === 'completed'}
                        className="btn btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        <Pause style={{ width: 14, height: 14, color: 'var(--accent-amber)' }} />
                        Pause Stream
                      </button>
                    )}

                    {/* Milestone flow rate boost button */}
                    <button
                      onClick={() => onAdjustFlowRate(stream.id, stream.flowRatePerSecond * 1.5)}
                      disabled={stream.status === 'cancelled' || stream.status === 'completed'}
                      className="btn btn-secondary"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      <TrendingUp style={{ width: 14, height: 14, color: 'var(--accent-teal)' }} />
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
                        className="btn btn-danger"
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        <AlertTriangle style={{ width: 14, height: 14, color: 'var(--accent-rose)' }} />
                        {isCliffInFuture ? 'Emergency Pre-Cliff Clawback (100%)' : 'Drain Remaining Unvested'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Top-up inline panel */}
                {topUpTargetId === stream.id && (
                  <div style={{ marginTop: '14px', padding: '14px', background: 'var(--bg-surface-inset)', border: '1px solid var(--border-emerald)', borderRadius: 'var(--radius-md)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Add deposit to stream:</span>
                    <input
                      type="number"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      className="form-input font-mono"
                      style={{ width: '120px', padding: '6px 10px', fontSize: '12px' }}
                      placeholder="Amount"
                    />
                    <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)', fontWeight: 700 }}>{stream.token.symbol}</span>
                    <button
                      onClick={() => handleExecuteTopUp(stream.id)}
                      className="btn btn-primary"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      Confirm Top-Up (+Soroban Transfer)
                    </button>
                    <button
                      onClick={() => setTopUpTargetId(null)}
                      className="btn btn-secondary"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
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
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlusCircle style={{ width: 18, height: 18, color: 'var(--accent-emerald)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Create Continuous Soroban Stream</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn btn-secondary"
                style={{ padding: '6px', border: 'none', background: 'transparent' }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="modal-body">
              {/* Token Selector */}
              <div className="form-group">
                <label className="form-label">Select Token</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {SUPPORTED_TOKENS.map((tok) => (
                    <button
                      key={tok.symbol}
                      type="button"
                      onClick={() => setSelectedToken(tok)}
                      className={`btn ${selectedToken.symbol === tok.symbol ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '10px 8px', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{tok.icon}</span>
                        <span style={{ fontWeight: 700, fontSize: '13px' }}>{tok.symbol}</span>
                      </div>
                      <span style={{ fontSize: '10px', opacity: 0.8 }}>{tok.decimals} decimals</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient */}
              <div className="form-group">
                <label className="form-label">Recipient Stellar Address</label>
                <input
                  type="text"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="form-input font-mono"
                  placeholder="G..."
                />
              </div>

              {/* Deposit Amount & Duration */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">
                    Total Deposit ({selectedToken.symbol})
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="form-input font-mono"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="form-input font-mono"
                  />
                </div>
              </div>

              {/* Cliff Period */}
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield style={{ width: 14, height: 14, color: 'var(--accent-amber)' }} />
                    Cliff Period (Days) - Emergency Clawback Guardrail
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--accent-amber)' }}>Sender can reclaim 100% before cliff</span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={cliffDays}
                  onChange={(e) => setCliffDays(e.target.value)}
                  className="form-input font-mono"
                  placeholder="0 for no cliff"
                />
              </div>

              {/* Memo */}
              <div className="form-group">
                <label className="form-label">Protocol Memo / Title</label>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="form-input"
                  placeholder="e.g. SCF Grant Milestone Stream"
                />
              </div>

              {/* Calculated Rate Box */}
              <div style={{ background: 'var(--bg-surface-inset)', border: '1px solid var(--border-dim)', padding: '12px 16px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '16px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>Computed Flow Rate:</span>
                  <span style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    +{calculatedFlowRate.toFixed(7)} {selectedToken.symbol} / sec
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>Daily Allocation:</span>
                  <span style={{ color: '#ffffff', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    ~{calculatedDailyRate.toFixed(2)} {selectedToken.symbol} / day
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  <CheckCircle2 style={{ width: 16, height: 16 }} />
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
