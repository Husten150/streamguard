import React, { useState } from 'react';
import { Stream, WalletAccount } from '../types/stream';
import { StreamTicker60fps } from './StreamTicker60fps';
import { useSorobanStream } from '../hooks/useSorobanStream';
import confetti from 'canvas-confetti';
import {
  ArrowDownToLine,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  History,
  Coins,
  X
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

    setLastTxReceipt({
      txHash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}...soroban`,
      amount: specificAmount || 100,
      symbol: stream.token.symbol,
      ledgerSequence: 498450 + Math.floor(Math.random() * 50),
      feeStroops: 100,
    });

    setSelectedStreamForWithdraw(null);
  };

  return (
    <div>
      {/* Overview Banner */}
      <div className="section-banner">
        <div>
          <div className="eyebrow">
            <Sparkles style={{ width: 14, height: 14 }} />
            Vesting In Real-Time
          </div>
          <h2 className="banner-heading">Recipient Claim Portal</h2>
          <p className="banner-subtitle">
            Watch your streaming tokens accrue every millisecond. Withdraw anytime with single-click Soroban authorization and zero lock-in once cliff passes.
          </p>
        </div>

        {/* Tab Switch */}
        <div style={{ display: 'flex', background: 'var(--bg-surface-elevated)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-dim)' }}>
          <button
            onClick={() => setActiveTab('active')}
            className={`btn ${activeTab === 'active' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <span>Active Streams</span>
            <span className="tab-badge">{activeIncoming.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12px', padding: '6px 12px', marginLeft: '4px' }}
          >
            <History style={{ width: 14, height: 14 }} />
            History ({historyStreams.length})
          </button>
        </div>
      </div>

      {/* Recent Tx Toast / Receipt */}
      {lastTxReceipt && (
        <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid var(--border-emerald)', padding: '14px 20px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                Soroban Withdrawal Confirmed on Testnet
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                Tx: {lastTxReceipt.txHash} • Ledger #{lastTxReceipt.ledgerSequence} • Fee: {lastTxReceipt.feeStroops} Stroops (0.00001 XLM)
              </div>
            </div>
          </div>
          <button
            onClick={() => setLastTxReceipt(null)}
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '11px' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main View Area */}
      {activeTab === 'active' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeIncoming.length === 0 ? (
            <div className="panel-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <Coins style={{ width: 44, height: 44, color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>No Active Incoming Streams</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '6px auto 0 auto' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {historyStreams.length === 0 ? (
            <div className="panel-card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-secondary)' }}>
              No historical streams recorded yet.
            </div>
          ) : (
            historyStreams.map((stream) => (
              <div
                key={stream.id}
                className="panel-card"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="stream-id-badge">{stream.id}</span>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>{stream.title}</h4>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Withdrawn total: <strong style={{ color: '#ffffff' }}>{stream.withdrawnAmount.toLocaleString()} {stream.token.symbol}</strong> of {stream.totalDeposit.toLocaleString()} {stream.token.symbol}
                  </div>
                </div>
                <span className={`badge ${stream.status === 'completed' ? 'badge-completed' : 'badge-danger'}`}>
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

const RecipientStreamCard: React.FC<RecipientStreamCardProps> = ({
  stream,
  onOpenClaimModal,
  onClaimInstant,
}) => {
  const metrics = useSorobanStream(stream);
  const isCliffLocked = metrics.isCliffActive;

  return (
    <div className="stream-card">
      <div className="stream-card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="stream-id-badge">{stream.id}</span>
            <h3 className="stream-title">{stream.title}</h3>
          </div>
          <div className="stream-meta">
            <span>Sender: <code>{stream.sender}</code></span>
          </div>
        </div>

        {/* Status Pill */}
        <div>
          {isCliffLocked ? (
            <span className="badge badge-paused">
              <ShieldAlert style={{ width: 14, height: 14 }} />
              Cliff Guard Active
            </span>
          ) : (
            <span className="badge badge-active">
              <span className="status-dot pulsing" />
              Unlocked & Claimable
            </span>
          )}
        </div>
      </div>

      {/* 60fps Real-time Ticker */}
      <StreamTicker60fps stream={stream} />

      {/* Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingTop: '10px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
          <span>Total Stream Cap: <strong style={{ color: '#ffffff' }}>{stream.totalDeposit.toLocaleString()} {stream.token.symbol}</strong></span>
          <span>•</span>
          <span>Claimed: <strong style={{ color: '#ffffff' }}>{stream.withdrawnAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {stream.token.symbol}</strong></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onOpenClaimModal}
            disabled={isCliffLocked || metrics.claimable <= 0}
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '8px 14px' }}
          >
            Custom Amount...
          </button>

          <button
            onClick={() => onClaimInstant()}
            disabled={isCliffLocked || metrics.claimable <= 0}
            className="btn btn-primary"
            style={{ fontSize: '12px', padding: '8px 16px' }}
          >
            <ArrowDownToLine style={{ width: 15, height: 15 }} />
            Claim All Available Drips ({metrics.claimable.toFixed(2)} {stream.token.symbol})
          </button>
        </div>
      </div>
    </div>
  );
};

interface WithdrawModalProps {
  stream: Stream;
  onClose: () => void;
  onConfirm: (amt: number) => void;
}

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
    <div className="modal-overlay">
      <div className="modal-dialog" style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Withdraw Vested Drips</h3>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px', border: 'none', background: 'transparent' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Authorize a Soroban contract transaction to withdraw vested tokens directly to your Stellar account.
          </p>

          <div style={{ background: 'var(--bg-surface-inset)', border: '1px solid var(--border-dim)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <span>Max Claimable Now:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                {metrics.claimable.toFixed(7)} {stream.token.symbol}
              </span>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={amt}
                onChange={(e) => setAmt(e.target.value)}
                className="form-input font-mono"
                style={{ paddingRight: '60px' }}
              />
              <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {stream.token.symbol}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleHalf}
                className="btn btn-secondary"
                style={{ fontSize: '11px', padding: '4px 10px' }}
              >
                50%
              </button>
              <button
                onClick={handleMax}
                className="btn btn-secondary"
                style={{ fontSize: '11px', padding: '4px 10px', color: 'var(--accent-emerald)' }}
              >
                100% Max
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-dim)', paddingTop: '12px' }}>
            <span>Estimated Soroban Network Fee:</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>~100 Stroops (&lt; $0.0001)</span>
          </div>
        </div>

        <div className="modal-footer">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(parseFloat(amt) || metrics.claimable)}
            className="btn btn-primary"
          >
            Confirm & Withdraw
          </button>
        </div>
      </div>
    </div>
  );
};
