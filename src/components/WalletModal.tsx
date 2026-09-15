import React, { useState } from 'react';
import { WalletAccount } from '../types/stream';
import { INITIAL_WALLETS } from '../data/mockStreams';
import { X, Check, RefreshCw, Plus } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAccount: WalletAccount | null;
  onSelectAccount: (account: WalletAccount) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  activeAccount,
  onSelectAccount,
}) => {
  const [wallets, setWallets] = useState<WalletAccount[]>(INITIAL_WALLETS);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerateTestnetAccount = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newAcc: WalletAccount = {
        address: `G${randomHex}TEST...99X7K`,
        name: `Dev Testnet Account #${wallets.length + 1}`,
        type: 'simulated',
        balanceXlm: 10000.0,
        balanceUsdc: 2500.0,
        network: 'testnet',
      };
      setWallets((prev) => [...prev, newAcc]);
      onSelectAccount(newAcc);
      setIsGenerating(false);
      onClose();
    }, 450);
  };

  const handleFaucetAirdrop = (e: React.MouseEvent, addr: string) => {
    e.stopPropagation();
    setWallets((prev) =>
      prev.map((w) =>
        w.address === addr ? { ...w, balanceXlm: w.balanceXlm + 1000 } : w
      )
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-icon" style={{ width: 32, height: 32, fontSize: '13px' }}>
              SG
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Stellar Wallets Kit</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Select wallet or dev testnet account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '6px', border: 'none', background: 'transparent' }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Wallets list */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            Supported Stellar Wallets & Testnet Signers
          </div>

          {wallets.map((wallet) => {
            const isSelected = activeAccount?.address === wallet.address;
            return (
              <div
                key={wallet.address}
                onClick={() => {
                  onSelectAccount(wallet);
                  onClose();
                }}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-lg)',
                  border: isSelected ? '1px solid var(--border-emerald)' : '1px solid var(--border-dim)',
                  background: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface-elevated)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 140ms ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-inset)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    {wallet.type === 'freighter' && '🚢'}
                    {wallet.type === 'xbull' && '🐂'}
                    {wallet.type === 'albedo' && '✨'}
                    {wallet.type === 'simulated' && '🔑'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>{wallet.name}</span>
                      <span className="badge" style={{ background: 'var(--bg-surface-subtle)', color: 'var(--text-secondary)', fontSize: '10px' }}>
                        {wallet.type}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {wallet.address}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'right' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                      {wallet.balanceXlm.toLocaleString()} XLM
                    </div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {wallet.balanceUsdc.toLocaleString()} USDC
                    </div>
                  </div>

                  {isSelected ? (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-emerald)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check style={{ width: 14, height: 14, strokeWidth: 3 }} />
                    </div>
                  ) : (
                    <button
                      onClick={(e) => handleFaucetAirdrop(e, wallet.address)}
                      title="Request 1,000 Testnet XLM Faucet"
                      className="btn btn-secondary"
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                    >
                      +Faucet
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <button
            onClick={handleGenerateTestnetAccount}
            disabled={isGenerating}
            className="btn btn-secondary"
            style={{ width: '100%', borderStyle: 'dashed', padding: '12px', marginTop: '6px' }}
          >
            {isGenerating ? (
              <>
                <RefreshCw style={{ width: 14, height: 14 }} className="pulsing" />
                Generating Stellar Keypair on Testnet...
              </>
            ) : (
              <>
                <Plus style={{ width: 14, height: 14 }} />
                Generate Fresh Testnet Keypair (with Friendbot Faucet)
              </>
            )}
          </button>
        </div>

        {/* Footer info */}
        <div style={{ background: 'var(--bg-surface-inset)', padding: '12px 24px', borderTop: '1px solid var(--border-dim)', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)' }}>
            <span className="status-dot pulsing" />
            Stellar Soroban Testnet RPC Connected
          </span>
          <span>Protocol 21 Enabled</span>
        </div>
      </div>
    </div>
  );
};
