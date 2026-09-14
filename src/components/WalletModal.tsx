import React, { useState } from 'react';
import { WalletAccount, WalletType } from '../types/stream';
import { INITIAL_WALLETS } from '../data/mockStreams';
import { X, Check, ExternalLink, ShieldCheck, RefreshCw, Key, Plus } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
              SG
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Stellar Wallets Kit</h3>
              <p className="text-xs text-slate-400">Select wallet or dev testnet account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wallets list */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
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
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-950/20'
                    : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                    {wallet.type === 'freighter' && '🚢'}
                    {wallet.type === 'xbull' && '🐂'}
                    {wallet.type === 'albedo' && '✨'}
                    {wallet.type === 'simulated' && '🔑'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{wallet.name}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-300">
                        {wallet.type}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-0.5">
                      {wallet.address}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div>
                    <div className="text-xs font-mono text-emerald-400 font-semibold">
                      {wallet.balanceXlm.toLocaleString()} XLM
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      {wallet.balanceUsdc.toLocaleString()} USDC
                    </div>
                  </div>

                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <button
                      onClick={(e) => handleFaucetAirdrop(e, wallet.address)}
                      title="Request 1,000 Testnet XLM Faucet"
                      className="text-[11px] text-slate-400 hover:text-emerald-400 hover:bg-slate-700/50 p-1.5 rounded-lg border border-slate-700 transition-colors"
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
            className="w-full mt-3 py-3 px-4 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500/50 bg-slate-800/20 hover:bg-emerald-950/20 text-slate-300 hover:text-emerald-400 text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating Stellar Keypair on Testnet...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Generate Fresh Testnet Keypair (with Friendbot Faucet)
              </>
            )}
          </button>
        </div>

        {/* Footer info */}
        <div className="bg-slate-950/60 px-6 py-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Stellar Soroban Testnet RPC Connected
          </span>
          <span className="text-slate-500">Protocol 21 Enabled</span>
        </div>
      </div>
    </div>
  );
};
