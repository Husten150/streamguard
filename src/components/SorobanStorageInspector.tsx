import React, { useState } from 'react';
import { Database, HardDrive, Cpu, RefreshCw, Zap, Shield, CheckCircle2, Layers } from 'lucide-react';

export const SorobanStorageInspector: React.FC = () => {
  const [currentLedger, setCurrentLedger] = useState<number>(498620);
  const [ttlRemaining, setTtlRemaining] = useState<number>(518400); // 30 days of ledgers (~5s each)
  const [isBumping, setIsBumping] = useState<boolean>(false);

  const handleBumpTtl = () => {
    setIsBumping(true);
    setTimeout(() => {
      setTtlRemaining((prev) => prev + 518400);
      setCurrentLedger((prev) => prev + 1);
      setIsBumping(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" />
            Soroban Host Environment Architecture
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Instance vs. Persistent Storage & TTL Rent Engine
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            StreamGuard implements a dual-tier storage strategy designed specifically for Soroban State Archival and Storage Rent rules, preventing state bloat and guaranteeing lifetime persistence.
          </p>
        </div>

        <button
          onClick={handleBumpTtl}
          disabled={isBumping}
          className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-xs font-bold font-mono flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isBumping ? 'animate-spin' : ''}`} />
          Invoke extend_ttl()
        </button>
      </div>

      {/* Dual Storage Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Instance Storage Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Soroban Instance Storage</h3>
                <span className="text-[11px] font-mono text-purple-400">env.storage().instance()</span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 font-mono font-semibold border border-purple-500/20">
              Single-Key Root
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Stores singleton protocol parameters tied directly to the contract code's lifecycle. Loaded into host memory whenever any contract entry point is called.
          </p>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">DataKey::Admin:</span>
              <span className="text-purple-300">GB7B3XW9QZ...4X9R2M</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">DataKey::StreamSequence:</span>
              <span className="text-white font-bold">1,003</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Footprint Size:</span>
              <span className="text-emerald-400 font-semibold">128 Bytes</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Host Load Gas:</span>
              <span className="text-emerald-400 font-semibold">Minimal (Shared Instance)</span>
            </div>
          </div>
        </div>

        {/* Persistent Storage Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Soroban Persistent Storage</h3>
                <span className="text-[11px] font-mono text-emerald-400">env.storage().persistent()</span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 font-mono font-semibold border border-emerald-500/20">
              Sharded Per Stream
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Each stream is stored under an isolated key <code className="text-emerald-400 font-mono">DataKey::Stream(u64)</code>. Allows millions of concurrent streams without inflating the read footprint of unrelated calls.
          </p>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Storage Key:</span>
              <span className="text-emerald-300">DataKey::Stream(id)</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Stream Struct Size:</span>
              <span className="text-white font-bold">~248 Bytes / stream</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Threshold / Bump:</span>
              <span className="text-slate-300 font-semibold">120,960 / 518,400 Ledgers</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Archival Immunity:</span>
              <span className="text-emerald-400 font-semibold">Guaranteed via auto extend_ttl</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time State & Benchmark Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-slate-500 block text-[11px] font-medium">Stellar Testnet Ledger</span>
          <span className="text-white font-bold font-mono text-lg">#{currentLedger.toLocaleString()}</span>
          <span className="text-[10px] text-emerald-400 block mt-0.5">~5.0 sec ledger latency</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-slate-500 block text-[11px] font-medium">TTL Safe Buffer</span>
          <span className="text-emerald-400 font-bold font-mono text-lg">{ttlRemaining.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Ledgers (~30 days)</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-slate-500 block text-[11px] font-medium">Compiled Wasm Footprint</span>
          <span className="text-teal-300 font-bold font-mono text-lg">42.8 KB</span>
          <span className="text-[10px] text-teal-400 block mt-0.5">opt-level = 'z' + lto</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-slate-500 block text-[11px] font-medium">Avg Withdrawal Gas Fee</span>
          <span className="text-white font-bold font-mono text-lg">100 Stroops</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">&lt; $0.00005 USD / claim</span>
        </div>
      </div>
    </div>
  );
};
