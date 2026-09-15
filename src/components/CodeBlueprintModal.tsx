import React, { useState } from 'react';
import {
  RUST_CONTRACT_LIB,
  RUST_CONTRACT_TYPES,
  RUST_CONTRACT_STORAGE,
  RUST_CONTRACT_MATH,
  RUST_CARGO_TOML,
  CLI_DEPLOYMENT_GUIDE,
  NEXTJS_FRONTEND_CODE,
  HOOK_SOURCE_CODE,
  TICKER_COMPONENT_CODE,
} from '../contracts/rustSource';
import { Code2, Copy, Check, Terminal, FileCode, Layers, Download } from 'lucide-react';

interface FileEntry {
  id: string;
  name: string;
  language: string;
  category: 'Rust Contract' | 'Deployment & CLI' | 'Next.js Frontend';
  code: string;
  description: string;
}

const FILES: FileEntry[] = [
  {
    id: 'lib_rs',
    name: 'contracts/streamguard/src/lib.rs',
    language: 'rust',
    category: 'Rust Contract',
    code: RUST_CONTRACT_LIB,
    description: 'Main Soroban smart contract containing create_stream, withdraw_from_stream, pause, cancel, and milestone drip scaling.',
  },
  {
    id: 'types_rs',
    name: 'contracts/streamguard/src/types.rs',
    language: 'rust',
    category: 'Rust Contract',
    code: RUST_CONTRACT_TYPES,
    description: 'Soroban contract types: Stream, StreamState, DataKey, and MilestoneAttestation structs.',
  },
  {
    id: 'storage_rs',
    name: 'contracts/streamguard/src/storage.rs',
    language: 'rust',
    category: 'Rust Contract',
    code: RUST_CONTRACT_STORAGE,
    description: 'Instance vs Persistent storage segregation with automated extend_ttl() calls.',
  },
  {
    id: 'math_rs',
    name: 'contracts/streamguard/src/math.rs',
    language: 'rust',
    category: 'Rust Contract',
    code: RUST_CONTRACT_MATH,
    description: 'Stroop-precision linear decay & flow rate calculation with cliff conditions.',
  },
  {
    id: 'cargo_toml',
    name: 'contracts/streamguard/Cargo.toml',
    language: 'toml',
    category: 'Rust Contract',
    code: RUST_CARGO_TOML,
    description: 'Cargo configuration with soroban-sdk = "21.0.0" and release profile optimization.',
  },
  {
    id: 'deploy_cli',
    name: 'scripts/deploy_testnet.sh',
    language: 'bash',
    category: 'Deployment & CLI',
    code: CLI_DEPLOYMENT_GUIDE,
    description: 'Soroban CLI workflow for wasm compilation, optimization, testnet deployment, and TS bindings.',
  },
  {
    id: 'wallet_provider',
    name: 'components/StellarWalletProvider.tsx',
    language: 'typescript',
    category: 'Next.js Frontend',
    code: NEXTJS_FRONTEND_CODE,
    description: 'Stellar Wallets Kit React context provider supporting Freighter, xBull, and Albedo.',
  },
  {
    id: 'hook_stream',
    name: 'hooks/useSorobanStream.ts',
    language: 'typescript',
    category: 'Next.js Frontend',
    code: HOOK_SOURCE_CODE,
    description: 'Custom React hook utilizing requestAnimationFrame 60fps streaming calculations.',
  },
  {
    id: 'ticker_comp',
    name: 'components/StreamTicker60fps.tsx',
    language: 'typescript',
    category: 'Next.js Frontend',
    code: TICKER_COMPONENT_CODE,
    description: 'Real-time animated ticker component displaying claimable balance to 7 decimal places.',
  },
];

export const CodeBlueprintModal: React.FC = () => {
  const [selectedFileId, setSelectedFileId] = useState<string>('lib_rs');
  const [copied, setCopied] = useState<boolean>(false);

  const selectedFile = FILES.find((f) => f.id === selectedFileId) || FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([selectedFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.name.split('/').pop() || 'file.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Banner */}
      <div className="section-banner">
        <div>
          <div className="eyebrow">
            <Code2 style={{ width: 14, height: 14 }} />
            Complete Production Code Suite
          </div>
          <h2 className="banner-heading">
            Soroban Contracts, CLI Guide & Next.js SDK
          </h2>
          <p className="banner-subtitle">
            Fully typed, linted, and directly runnable source files ready for git repository commit and Soroban testnet deployment.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleDownloadFile}
            className="btn btn-secondary"
          >
            <Download style={{ width: 14, height: 14 }} />
            Download File
          </button>
          <button
            onClick={handleCopy}
            className="btn btn-primary"
          >
            {copied ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
            {copied ? 'Copied to Clipboard!' : 'Copy Code'}
          </button>
        </div>
      </div>

      {/* Main Code Explorer Container */}
      <div className="code-suite-grid">
        {/* Left Column: File Tree */}
        <div className="file-tree-panel">
          <div className="file-tree-heading">
            Project Files ({FILES.length})
          </div>

          {(['Rust Contract', 'Deployment & CLI', 'Next.js Frontend'] as const).map((cat) => (
            <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '6px 8px 2px 8px' }}>
                {cat}
              </div>
              {FILES.filter((f) => f.category === cat).map((file) => {
                const isSelected = file.id === selectedFileId;
                return (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    className={`file-btn ${isSelected ? 'active' : ''}`}
                  >
                    {file.category === 'Rust Contract' && <FileCode style={{ width: 14, height: 14, color: '#fb923c', flexShrink: 0 }} />}
                    {file.category === 'Deployment & CLI' && <Terminal style={{ width: 14, height: 14, color: '#60a5fa', flexShrink: 0 }} />}
                    {file.category === 'Next.js Frontend' && <Layers style={{ width: 14, height: 14, color: 'var(--accent-teal)', flexShrink: 0 }} />}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name.split('/').pop()}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Right Column: Code Viewer */}
        <div className="code-viewer-panel">
          {/* File Header */}
          <div className="code-header">
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                {selectedFile.name}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {selectedFile.description}
              </p>
            </div>
            <span className="badge" style={{ background: 'var(--bg-surface-subtle)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {selectedFile.language}
            </span>
          </div>

          {/* Code content */}
          <div className="code-pre">
            <pre style={{ margin: 0, fontFamily: 'inherit' }}>
              <code>{selectedFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
