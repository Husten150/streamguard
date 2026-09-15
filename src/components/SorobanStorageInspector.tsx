import React, { useState } from 'react';
import { Database, HardDrive, Cpu, RefreshCw } from 'lucide-react';

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
    <div>
      {/* Banner */}
      <div className="section-banner">
        <div>
          <div className="eyebrow">
            <Database style={{ width: 14, height: 14 }} />
            Soroban Host Environment Architecture
          </div>
          <h2 className="banner-heading">
            Instance vs. Persistent Storage & TTL Rent Engine
          </h2>
          <p className="banner-subtitle">
            StreamGuard implements a dual-tier storage strategy designed specifically for Soroban State Archival and Storage Rent rules, preventing state bloat and guaranteeing lifetime persistence.
          </p>
        </div>

        <button
          onClick={handleBumpTtl}
          disabled={isBumping}
          className="btn btn-secondary font-mono"
          style={{ padding: '8px 16px', fontSize: '12px', color: 'var(--accent-emerald)' }}
        >
          <RefreshCw style={{ width: 14, height: 14 }} className={isBumping ? 'pulsing' : ''} />
          Invoke extend_ttl()
        </button>
      </div>

      {/* Dual Storage Comparison Cards */}
      <div className="grid-cols-2" style={{ marginBottom: '20px' }}>
        {/* Instance Storage Card */}
        <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)' }}>
                <Cpu style={{ width: 20, height: 20 }} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Soroban Instance Storage</h3>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)' }}>env.storage().instance()</span>
              </div>
            </div>
            <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#d8b4fe', fontFamily: 'var(--font-mono)' }}>
              Single-Key Root
            </span>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Stores singleton protocol parameters tied directly to the contract code's lifecycle. Loaded into host memory whenever any contract entry point is called.
          </p>

          <div style={{ background: 'var(--bg-surface-inset)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>DataKey::Admin:</span>
              <span style={{ color: '#d8b4fe' }}>GB7B3XW9QZ...4X9R2M</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>DataKey::StreamSequence:</span>
              <span style={{ color: '#ffffff', fontWeight: 700 }}>1,003</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Footprint Size:</span>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>128 Bytes</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Host Load Gas:</span>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>Minimal (Shared Instance)</span>
            </div>
          </div>
        </div>

        {/* Persistent Storage Card */}
        <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--border-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald)' }}>
                <HardDrive style={{ width: 20, height: 20 }} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Soroban Persistent Storage</h3>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>env.storage().persistent()</span>
              </div>
            </div>
            <span className="badge badge-active font-mono">
              Sharded Per Stream
            </span>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Each stream is stored under an isolated key <code style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>DataKey::Stream(u64)</code>. Allows millions of concurrent streams without inflating the read footprint.
          </p>

          <div style={{ background: 'var(--bg-surface-inset)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-md)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Storage Key:</span>
              <span style={{ color: 'var(--accent-emerald)' }}>DataKey::Stream(id)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Stream Struct Size:</span>
              <span style={{ color: '#ffffff', fontWeight: 700 }}>~248 Bytes / stream</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Threshold / Bump:</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>120,960 / 518,400 Ledgers</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Archival Immunity:</span>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>Guaranteed via auto extend_ttl</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Metrics Grid */}
      <div className="grid-cols-4">
        <div className="panel-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Stellar Testnet Ledger</span>
          <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#ffffff', display: 'block', marginTop: '2px' }}>#{currentLedger.toLocaleString()}</span>
          <span style={{ fontSize: '10px', color: 'var(--accent-emerald)', display: 'block', marginTop: '4px' }}>~5.0 sec ledger latency</span>
        </div>

        <div className="panel-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>TTL Safe Buffer</span>
          <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)', display: 'block', marginTop: '2px' }}>{ttlRemaining.toLocaleString()}</span>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>Ledgers (~30 days)</span>
        </div>

        <div className="panel-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Compiled Wasm Footprint</span>
          <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-teal)', display: 'block', marginTop: '2px' }}>42.8 KB</span>
          <span style={{ fontSize: '10px', color: 'var(--accent-teal)', display: 'block', marginTop: '4px' }}>opt-level = 'z' + lto</span>
        </div>

        <div className="panel-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Avg Withdrawal Gas Fee</span>
          <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#ffffff', display: 'block', marginTop: '2px' }}>100 Stroops</span>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>&lt; $0.00005 USD / claim</span>
        </div>
      </div>
    </div>
  );
};
