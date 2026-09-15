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
    <div className="app-shell">
      {/* Top Protocol Navbar */}
      <header className="topbar">
        <div className="topbar-inner">
          {/* Brand */}
          <div className="brand-group">
            <div className="brand-icon">
              <Zap style={{ width: 20, height: 20, fill: '#020617' }} />
            </div>
            <div>
              <div className="brand-title">
                StreamGuard
                <span className="brand-tag">Soroban Protocol</span>
              </div>
              <p className="brand-subtitle">Continuous Token Drips & Milestone Safety</p>
            </div>
          </div>

          {/* Wallet and Network Controls */}
          <div className="topbar-actions">
            <div className="network-indicator">
              <span className="status-dot pulsing" />
              <span>Testnet (Protocol 21)</span>
            </div>

            {activeAccount ? (
              <button
                onClick={() => setIsWalletModalOpen(true)}
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                <span className="status-dot" />
                <div style={{ textAlign: 'left', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ color: '#ffffff', fontWeight: 600 }}>{activeAccount.address}</div>
                  <div style={{ fontSize: '10px', color: 'var(--accent-emerald)' }}>{activeAccount.balanceXlm.toLocaleString()} XLM</div>
                </div>
              </button>
            ) : (
              <button
                onClick={() => setIsWalletModalOpen(true)}
                className="btn btn-primary"
              >
                <Wallet style={{ width: 14, height: 14 }} />
                Connect Stellar Wallet
              </button>
            )}
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="nav-tabs-wrapper">
          <div className="nav-tabs">
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
                  className={`nav-tab ${isActive ? 'active' : ''}`}
                >
                  <Icon style={{ width: 14, height: 14 }} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="tab-badge">{tab.badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="main-content">
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
      <footer className="app-footer">
        <div className="footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>StreamGuard Protocol</span>
            <span>•</span>
            <span>Stellar Drips Wave Submission</span>
            <span>•</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>soroban-sdk = "21.0.0"</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="status-dot" />
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
