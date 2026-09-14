export type StreamStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  icon: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  scaleMultiplierBps: number; // e.g. 15000 = 1.5x
  status: 'pending' | 'approved' | 'rejected';
  attestationSigner?: string;
  attestationSignature?: string;
  completedAt?: number;
}

export interface Stream {
  id: string;
  title: string;
  sender: string;
  recipient: string;
  token: TokenInfo;
  totalDeposit: number; // in token human units (e.g. XLM)
  flowRatePerSecond: number; // in token units per second
  startTime: number; // unix timestamp (seconds)
  stopTime: number; // unix timestamp (seconds)
  cliffTime?: number; // cliff timestamp before which recipient cannot withdraw
  withdrawnAmount: number; // in token units
  lastUpdateTimestamp: number; // unix timestamp of last contract mutation
  accumulatedBeforePause: number; // vested prior to pause
  pausedAt?: number; // timestamp when paused, if currently paused
  status: StreamStatus;
  milestones: Milestone[];
  activeMilestoneId?: string;
  canSenderClawback: boolean; // prior to cliff, or remaining unvested tokens
  memo?: string;
  ledgerSequence: number;
}

export type WalletType = 'freighter' | 'xbull' | 'albedo' | 'simulated';

export interface WalletAccount {
  address: string;
  name: string;
  type: WalletType;
  balanceXlm: number;
  balanceUsdc: number;
  network: 'testnet' | 'futurenet' | 'mainnet';
}

export interface SorobanStorageStats {
  instanceFootprintBytes: number;
  persistentFootprintBytes: number;
  ttlRemainingLedgers: number;
  ttlThresholdLedgers: number;
  ttlBumpLedgers: number;
  rentCostStroops: number;
  wasmSizeKb: number;
}
