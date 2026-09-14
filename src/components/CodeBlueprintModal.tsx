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
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Code2 className="w-4 h-4" />
            Complete Production Code Suite
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Soroban Contracts, CLI Guide & Next.js SDK
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Fully typed, linted, and directly runnable source files ready for git repository commit and Soroban testnet deployment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadFile}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download File
          </button>
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
          >
            {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied to Clipboard!' : 'Copy Code'}
          </button>
        </div>
      </div>

      {/* Main Code Explorer Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Column: File Tree */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
            Project Files ({FILES.length})
          </div>

          {(['Rust Contract', 'Deployment & CLI', 'Next.js Frontend'] as const).map((cat) => (
            <div key={cat} className="space-y-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 pt-2">
                {cat}
              </div>
              {FILES.filter((f) => f.category === cat).map((file) => {
                const isSelected = file.id === selectedFileId;
                return (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-mono transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {file.category === 'Rust Contract' && <FileCode className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                    {file.category === 'Deployment & CLI' && <Terminal className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                    {file.category === 'Next.js Frontend' && <Layers className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
                    <span className="truncate">{file.name.split('/').pop()}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Right Column: Code Viewer */}
        <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          {/* File Header */}
          <div className="bg-slate-900/90 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-mono text-xs text-slate-300 font-bold">{selectedFile.name}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">{selectedFile.description}</p>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {selectedFile.language}
            </span>
          </div>

          {/* Code content */}
          <div className="p-4 overflow-x-auto max-h-[600px] overflow-y-auto">
            <pre className="text-xs font-mono text-slate-200 leading-relaxed">
              <code>{selectedFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
