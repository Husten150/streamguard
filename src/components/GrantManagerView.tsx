import React, { useState } from 'react';
import { Stream, WalletAccount } from '../types/stream';
import {
  Award,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Key,
} from 'lucide-react';

interface GrantManagerViewProps {
  streams: Stream[];
  activeAccount: WalletAccount | null;
  onApproveMilestone: (streamId: string, milestoneId: string, scaleBps: number) => void;
  onToggleFreeze: (streamId: string) => void;
}

export const GrantManagerView: React.FC<GrantManagerViewProps> = ({
  streams,
  activeAccount,
  onApproveMilestone,
  onToggleFreeze,
}) => {
  const [selectedStreamId, setSelectedStreamId] = useState<string>(streams[0]?.id || '');
  const [scaleMultiplier, setScaleMultiplier] = useState<number>(15000); // 1.5x

  const targetStream = streams.find((s) => s.id === selectedStreamId) || streams[0];

  const handleAttest = (milestoneId: string) => {
    if (!targetStream) return;
    onApproveMilestone(targetStream.id, milestoneId, scaleMultiplier);
  };

  return (
    <div>
      {/* Overview Banner */}
      <div className="section-banner">
        <div>
          <div className="eyebrow">
            <ShieldCheck style={{ width: 14, height: 14 }} />
            Milestone Verification & Flow Scaling
          </div>
          <h2 className="banner-heading">Grant Manager Attestation Hub</h2>
          <p className="banner-subtitle">
            Soroban smart contracts allow multi-sig grant managers to dynamically scale flow rates upon milestone validation, or freeze streams if deliverables stall.
          </p>
        </div>

        {/* Stream Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Target Stream:</span>
          <select
            value={selectedStreamId}
            onChange={(e) => setSelectedStreamId(e.target.value)}
            className="form-input font-mono"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}
          >
            {streams.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id}: {s.title.slice(0, 30)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {targetStream && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Left Column: Stream Allocation Details */}
          <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="panel-title">
              <Award style={{ width: 16, height: 16, color: 'var(--accent-emerald)' }} />
              Stream Allocation Status
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-dim)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Stream ID:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>{targetStream.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-dim)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Sender / Grantor:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{targetStream.sender}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-dim)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Recipient Grantee:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{targetStream.recipient}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-dim)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Committed:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>
                  {targetStream.totalDeposit.toLocaleString()} {targetStream.token.symbol}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-dim)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Current Flow Rate:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                  +{targetStream.flowRatePerSecond.toFixed(7)} / sec
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-dim)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Stream State:</span>
                <span className={`badge ${targetStream.status === 'active' ? 'badge-active' : 'badge-paused'}`}>
                  {targetStream.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Scale Multiplier */}
            <div style={{ paddingTop: '8px' }}>
              <label className="form-label">
                Milestone Approval Flow Multiplier
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { label: '1.0x (100%)', val: 10000 },
                  { label: '1.5x (150%)', val: 15000 },
                  { label: '2.0x (200%)', val: 20000 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setScaleMultiplier(item.val)}
                    className={`btn ${scaleMultiplier === item.val ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '11px', padding: '6px 4px' }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                On signing, Soroban contract updates <code style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>milestone_multiplier_bps</code> in Persistent storage.
              </p>
            </div>

            {/* Freeze control */}
            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-dim)' }}>
              <button
                onClick={() => onToggleFreeze(targetStream.id)}
                className={`btn ${targetStream.status === 'paused' ? 'btn-primary' : 'btn-warning'}`}
                style={{ width: '100%', padding: '10px 14px' }}
              >
                <AlertTriangle style={{ width: 14, height: 14 }} />
                {targetStream.status === 'paused' ? 'Unfreeze Stream Allocation' : 'Emergency Freeze Stream Allocation'}
              </button>
            </div>
          </div>

          {/* Right Column: Milestones Checklist */}
          <div className="panel-card" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="panel-header">
              <div className="panel-title">
                <FileCheck style={{ width: 16, height: 16, color: 'var(--accent-teal)' }} />
                Grant Milestone Deliverables
              </div>
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                {targetStream.milestones.filter((m) => m.status === 'approved').length} / {targetStream.milestones.length} Completed
              </span>
            </div>

            {targetStream.milestones.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-dim)', borderRadius: 'var(--radius-md)' }}>
                No milestone checkpoints assigned to this continuous stream.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {targetStream.milestones.map((m) => {
                  const isApproved = m.status === 'approved';
                  return (
                    <div
                      key={m.id}
                      style={{
                        padding: '16px 20px',
                        borderRadius: 'var(--radius-lg)',
                        border: isApproved ? '1px solid var(--border-emerald)' : '1px solid var(--border-dim)',
                        background: isApproved ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface-inset)',
                        transition: 'border-color 140ms ease'
                      }}
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="stream-id-badge">{m.id}</span>
                            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>{m.title}</h4>
                          </div>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '520px' }}>
                            {m.description}
                          </p>
                        </div>

                        <div>
                          {isApproved ? (
                            <span className="badge badge-active">
                              <CheckCircle2 style={{ width: 14, height: 14 }} />
                              Attestation Verified
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAttest(m.id)}
                              className="btn btn-primary"
                              style={{ fontSize: '12px', padding: '6px 12px' }}
                            >
                              <Key style={{ width: 13, height: 13 }} />
                              Sign Attestation & Scale Rate
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        <span>
                          Flow Impact: <strong style={{ color: 'var(--accent-teal)' }}>{(m.scaleMultiplierBps / 10000).toFixed(1)}x Rate Multiplier</strong>
                        </span>
                        {isApproved && m.attestationSigner && (
                          <span>Signed by: {m.attestationSigner}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
