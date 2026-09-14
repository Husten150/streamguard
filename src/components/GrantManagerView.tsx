import React, { useState } from 'react';
import { Stream, Milestone, WalletAccount } from '../types/stream';
import {
  Award,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  Key,
  ExternalLink,
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
  const [attestationSecret, setAttestationSecret] = useState('manager-signer-key-0x98...scf');
  const [scaleMultiplier, setScaleMultiplier] = useState<number>(15000); // 1.5x

  const targetStream = streams.find((s) => s.id === selectedStreamId) || streams[0];

  const handleAttest = (milestoneId: string) => {
    if (!targetStream) return;
    onApproveMilestone(targetStream.id, milestoneId, scaleMultiplier);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            Milestone Verification & Flow Scaling
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Grant Manager Attestation Hub</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Soroban smart contracts allow multi-sig grant managers to dynamically scale flow rates upon milestone validation, or freeze streams if deliverables stall.
          </p>
        </div>

        {/* Stream Selector */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs text-slate-400">Target Stream:</span>
          <select
            value={selectedStreamId}
            onChange={(e) => setSelectedStreamId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 font-mono focus:border-emerald-500 focus:outline-none"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Stream Details & Attestation Config */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Stream Allocation Status
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Stream ID:</span>
                <span className="font-mono text-white font-bold">{targetStream.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Sender / Grantor:</span>
                <span className="font-mono text-slate-300">{targetStream.sender}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Recipient Grantee:</span>
                <span className="font-mono text-slate-300">{targetStream.recipient}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Total Committed:</span>
                <span className="font-bold text-white font-mono">
                  {targetStream.totalDeposit.toLocaleString()} {targetStream.token.symbol}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Current Flow Rate:</span>
                <span className="text-emerald-400 font-mono font-semibold">
                  +{targetStream.flowRatePerSecond.toFixed(7)} / sec
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Stream State:</span>
                <span className={`font-semibold uppercase ${
                  targetStream.status === 'active' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {targetStream.status}
                </span>
              </div>
            </div>

            {/* Scale multiplier selector */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Milestone Approval Flow Multiplier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '1.0x (100%)', val: 10000 },
                  { label: '1.5x (150%)', val: 15000 },
                  { label: '2.0x (200%)', val: 20000 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setScaleMultiplier(item.val)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      scaleMultiplier === item.val
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                On signing, Soroban contract updates the <code className="text-emerald-400 font-mono">milestone_multiplier_bps</code> in Persistent storage.
              </p>
            </div>

            {/* Freeze control */}
            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={() => onToggleFreeze(targetStream.id)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  targetStream.status === 'paused'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {targetStream.status === 'paused' ? 'Unfreeze Stream Allocation' : 'Emergency Freeze Stream Allocation'}
              </button>
            </div>
          </div>

          {/* Right Column: Milestones Checklist & Attestation signing */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-teal-400" />
                Grant Milestone Deliverables
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {targetStream.milestones.filter((m) => m.status === 'approved').length} / {targetStream.milestones.length} Completed
              </span>
            </div>

            {targetStream.milestones.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm border border-slate-800/60 rounded-xl">
                No milestone checkpoints assigned to this continuous stream.
              </div>
            ) : (
              <div className="space-y-3">
                {targetStream.milestones.map((m, idx) => {
                  const isApproved = m.status === 'approved';
                  return (
                    <div
                      key={m.id}
                      className={`p-5 rounded-xl border transition-all ${
                        isApproved
                          ? 'bg-emerald-950/20 border-emerald-500/40'
                          : 'bg-slate-800/30 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {m.id}
                            </span>
                            <h4 className="text-sm font-bold text-white">{m.title}</h4>
                          </div>
                          <p className="text-xs text-slate-400 max-w-lg">{m.description}</p>
                        </div>

                        {/* Status / Action */}
                        <div className="shrink-0">
                          {isApproved ? (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              Attestation Verified
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAttest(m.id)}
                              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                            >
                              <Key className="w-3.5 h-3.5" />
                              Sign Attestation & Scale Rate
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Attestation metadata */}
                      <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>
                          Flow Impact: <strong className="text-teal-300">{(m.scaleMultiplierBps / 10000).toFixed(1)}x Rate Multiplier</strong>
                        </span>
                        {isApproved && m.attestationSigner && (
                          <span className="text-slate-500">
                            Signed by: {m.attestationSigner}
                          </span>
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
