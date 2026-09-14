import React, { useState } from 'react';
import { Stream, WalletAccount } from './types/stream';
import { INITIAL_STREAMS, INITIAL_WALLETS } from './data/mockStreams';
import { WalletModal } from './components/WalletModal';
import { SenderDashboard } from './components/SenderDashboard';
import { RecipientDashboard } from './components/RecipientDashboard';
import { GrantManagerView } from './components/GrantManagerView';
import { SorobanStorageInspector } from './components/SorobanStorageInspector';
import { GrantStrategySection } from './components/GrantStrategySection';
import { CodeBlueprintModal } from './components/CodeBlueprintModal';
import {
  Zap,
  Send,
  ArrowDownToLine,
  ShieldCheck,
  Database,
  Award,
  Code2,
  Wallet,
  Activity,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

type ActiveTab = 'sender' | 'recipient' | 'manager' | 'storage' | 'grant' | 'code';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('recipient');
  const [streams, setStreams] = useState<Stream[]>(INITIAL_STREAMS);
  const [activeAccount, setActiveAccount] = useState<WalletAccount | null>(INITIAL_WALLETS[1]); // Default to grantee
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);

  // Stream Mutation Handlers
  const handleCreateStream = (newStreamData: Partial<Stream>) => {
    const newStream: Stream = {
      id: `SG-${1000 + streams.length + 1}`,
      title: newStreamData.title || 'Continuous Drip Stream',
      sender: newStreamData.sender || activeAccount?.address || 'GB7B3XW9QZ...4X9R2M',
      recipient: newStreamData.recipient || 'GA489M2Q...9LPX8K',
      token: newStreamData.token || streams[0].token,
      totalDeposit: newStreamData.totalDeposit || 1000,
      flowRatePerSecond: newStreamData.flowRatePerSecond || 0.001,
      startTime: newStreamData.startTime || Math.floor(Date.now() / 1000),
      stopTime: newStreamData.stopTime || Math.floor(Date.now() / 1000) + 86400 * 30,
      cliffTime: newStreamData.cliffTime,
      withdrawnAmount: 0,
      lastUpdateTimestamp: Math.floor(Date.now() / 1000),
      accumulatedBeforePause: 0,
      status: 'active',
      canSenderClawback: true,
      ledgerSequence: 498700 + streams.length,
      memo: newStreamData.memo || 'Created via StreamGuard Protocol',
      milestones: newStreamData.milestones || [],
    };

    setStreams((prev) => [newStream, ...prev]);
  };

  const handleTopUpStream = (streamId: string, amount: number) => {
    setStreams((prev) =>
      prev.map((s) => {
        if (s.id !== streamId) return s;
        const addedDuration = Math.floor(amount / (s.flowRatePerSecond || 1));
        return {
          ...s,
          totalDeposit: s.totalDeposit + amount,
          stopTime: s.stopTime + addedDuration,
        };
      })
    );
  };

  const handlePauseStream = (streamId: string) => {
    const now = Math.floor(Date.now() / 1000);
    setStreams((prev) =>
      prev.map((s) => {
        if (s.id !== streamId) return s;
        const elapsed = Math.max(0, now - s.lastUpdateTimestamp);
        const incrementalVested = elapsed * s.flowRatePerSecond;
        return {
          ...s,
          status: 'paused',
          pausedAt: now,
          accumulatedBeforePause: s.accumulatedBeforePause + incrementalVested,
        };
      })
    );
  };

  const handleResumeStream = (streamId: string) => {
    const now = Math.floor(Date.now() / 1000);
    setStreams((prev) =>
      prev.map((s) => {
        if (s.id !== streamId || s.status !== 'paused') return s;
        const pauseDuration = s.pausedAt ? Math.max(0, now - s.pausedAt) : 0;
        return {
          ...s,
          status: 'active',
          pausedAt: undefined,
          lastUpdateTimestamp: now,
          stopTime: s.stopTime + pauseDuration,
        };
      })
    );
  };

  const handleCancelStream = (streamId: string) => {
    setStreams((prev) =>
      prev.map((s) => (s.id === streamId ? { ...s, status: 'cancelled' } : s))
    );
  };

  const handleAdjustFlowRate = (streamId: string, newRate: number) => {
    const now = Math.floor(Date.now() / 1000);
    setStreams((prev) =>
      prev.map((s) => {
        if (s.id !== streamId) return s;
        const elapsed = Math.max(0, now - s.lastUpdateTimestamp);
        const incrementalVested = elapsed * s.flowRatePerSecond;
        return {
          ...s,
          accumulatedBeforePause: s.accumulatedBeforePause + incrementalVested,
          lastUpdateTimestamp: now,
          flowRatePerSecond: newRate,
        };
      })
    );
  };

  const handleWithdraw = (streamId: string, specificAmount?: number) => {
    const now = Math.floor(Date.now() / 1000);
    setStreams((prev) =>
      prev.map((s) => {
        if (s.id !== streamId) return s;
        const elapsed = Math.max(0, (s.pausedAt ?? now) - s.lastUpdateTimestamp);
        const totalVested = Math.min(
          s.totalDeposit,
          s.accumulatedBeforePause + elapsed * s.flowRatePerSecond
        );
        const maxClaimable = Math.max(0, totalVested - s.withdrawnAmount);
        const actualClaim = specificAmount && specificAmount < maxClaimable ? specificAmount : maxClaimable;

        return {
          ...s,
          withdrawnAmount: s.withdrawnAmount + actualClaim,
        };
      })
    );
  };

  const handleApproveMilestone = (streamId: string, milestoneId: string, scaleBps: number) => {
    const now = Math.floor(Date.now() / 1000);
    setStreams((prev) =>
      prev.map((s) => {
        if (s.id !== streamId) return s;
        const elapsed = Math.max(0, now - s.lastUpdateTimestamp);
        const totalVested = s.accumulatedBeforePause + elapsed * s.flowRatePerSecond;

        const updatedMilestones = s.milestones.map((m) =>
          m.id === milestoneId
            ? {
                ...m,
                status: 'approved' as const,
                attestationSigner: activeAccount?.address || 'GB7B3XW9QZ...4X9R2M',
                completedAt: now,
              }
            : m
        );

        // Scale flow rate
        const multiplier = scaleBps / 10000;
        const newFlowRate = s.flowRatePerSecond * multiplier;

        return {
          ...s,
          milestones: updatedMilestones,
          accumulatedBeforePause: totalVested,
          lastUpdateTimestamp: now,
          flowRatePerSecond: newFlowRate,
        };
      })
    );
  };

  const handleToggleFreeze = (streamId: string) => {
    const target = streams.find((s) => s.id === streamId);
    if (!target) return;
    if (target.status === 'paused') {
      handleResumeStream(streamId);
    } else {
      handlePauseStream(streamId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Protocol Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 via-emerald-400 to-green-300 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <Zap className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">StreamGuard</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Soroban Protocol
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Continuous Token Drips & Milestone Safety</p>
            </div>
          </div>

          {/* Wallet and Network Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-mono">Testnet (Protocol 21)</span>
            </div>

            {activeAccount ? (
              <button
                onClick={() => setIsWalletModalOpen(true)}
                className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all text-xs"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <div className="text-left font-mono">
                  <div className="text-white font-semibold">{activeAccount.address}</div>
                  <div className="text-[10px] text-emerald-400">{activeAccount.balanceXlm.toLocaleString()} XLM</div>
                </div>
              </button>
            ) : (
              <button
                onClick={() => setIsWalletModalOpen(true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Wallet className="w-4 h-4" />
                Connect Stellar Wallet
              </button>
            )}
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/60 scrollbar-none">
          {[
            { id: 'recipient', label: 'Recipient Claim Portal', icon: ArrowDownToLine, badge: streams.length },
            { id: 'sender', label: 'Sender Streaming Control', icon: Send },
            { id: 'manager', label: 'Grant Manager Attestations', icon: ShieldCheck },
            { id: 'storage', label: 'Soroban Storage & TTL', icon: Database },
            { id: 'grant', label: 'Grant Proposal Strategy', icon: Award },
            { id: 'code', label: 'Code & Blueprint Hub', icon: Code2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'recipient' && (
          <RecipientDashboard
            streams={streams}
            activeAccount={activeAccount}
            onWithdraw={handleWithdraw}
          />
        )}

        {activeTab === 'sender' && (
          <SenderDashboard
            streams={streams}
            activeAccount={activeAccount}
            onCreateStream={handleCreateStream}
            onTopUpStream={handleTopUpStream}
            onPauseStream={handlePauseStream}
            onResumeStream={handleResumeStream}
            onCancelStream={handleCancelStream}
            onAdjustFlowRate={handleAdjustFlowRate}
          />
        )}

        {activeTab === 'manager' && (
          <GrantManagerView
            streams={streams}
            activeAccount={activeAccount}
            onApproveMilestone={handleApproveMilestone}
            onToggleFreeze={handleToggleFreeze}
          />
        )}

        {activeTab === 'storage' && <SorobanStorageInspector />}

        {activeTab === 'grant' && <GrantStrategySection />}

        {activeTab === 'code' && <CodeBlueprintModal />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">StreamGuard Protocol</span>
            <span>•</span>
            <span>Stellar Drips Wave Submission</span>
            <span>•</span>
            <span className="font-mono text-emerald-400">soroban-sdk = "21.0.0"</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Sub-second finality
            </span>
            <span>•</span>
            <span>Linear decay math</span>
            <span>•</span>
            <span>Persistent TTL safe</span>
          </div>
        </div>
      </footer>

      {/* Stellar Wallets Kit Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        activeAccount={activeAccount}
        onSelectAccount={setActiveAccount}
      />
    </div>
  );
}
