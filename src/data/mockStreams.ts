import { Stream, TokenInfo, WalletAccount } from '../types/stream';

export const SUPPORTED_TOKENS: TokenInfo[] = [
  {
    symbol: 'XLM',
    name: 'Native Stellar Lumens',
    address: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    decimals: 7,
    icon: '⚡',
  },
  {
    symbol: 'USDC',
    name: 'Circle USD Coin (SAC)',
    address: 'CBIELTK6YBZJU5UP2WWQEUCYJLPU6QXNGB4HSA37V6ZOHCTJCRJ54MTC',
    decimals: 7,
    icon: '💵',
  },
  {
    symbol: 'DRIP',
    name: 'StreamGuard Governance Token',
    address: 'CDRIPGUARD7XLM99201948271638192039485762019283746192837461',
    decimals: 7,
    icon: '💧',
  },
];

export const INITIAL_WALLETS: WalletAccount[] = [
  {
    address: 'GB7B3XW9QZ...4X9R2M',
    name: 'Stellar Foundation Grant Manager',
    type: 'freighter',
    balanceXlm: 24580.45,
    balanceUsdc: 15400.0,
    network: 'testnet',
  },
  {
    address: 'GA489M2Q...9LPX8K',
    name: 'Lead Soroban Core Contributor',
    type: 'xbull',
    balanceXlm: 1250.3,
    balanceUsdc: 500.0,
    network: 'testnet',
  },
  {
    address: 'GC91K28X...3V7TR0',
    name: 'Security Audit Consortium',
    type: 'albedo',
    balanceXlm: 432.1,
    balanceUsdc: 8500.0,
    network: 'testnet',
  },
];

// Helper to calculate seconds
const nowSec = Math.floor(Date.now() / 1000);

export const INITIAL_STREAMS: Stream[] = [
  {
    id: 'SG-1001',
    title: 'Stellar Community Fund: Wave 1 Core Dev Grant',
    sender: 'GB7B3XW9QZ...4X9R2M',
    recipient: 'GA489M2Q...9LPX8K',
    token: SUPPORTED_TOKENS[0], // XLM
    totalDeposit: 50000, // 50,000 XLM
    flowRatePerSecond: 0.0192901, // ~50,000 XLM over 30 days
    startTime: nowSec - 86400 * 5, // started 5 days ago
    stopTime: nowSec + 86400 * 25, // finishes in 25 days
    cliffTime: nowSec - 86400 * 2, // cliff passed 2 days ago
    withdrawnAmount: 4800, // already claimed
    lastUpdateTimestamp: nowSec - 86400 * 5,
    accumulatedBeforePause: 0,
    status: 'active',
    canSenderClawback: true,
    ledgerSequence: 498102,
    memo: 'SCF Drips Wave milestone-gated allocation for Soroban smart contracts',
    milestones: [
      {
        id: 'M1',
        title: 'Core Soroban Contract Engine & Test Suite',
        description: 'Implement linear decay math, withdrawal guardrails, and persistent storage layout.',
        scaleMultiplierBps: 10000,
        status: 'approved',
        attestationSigner: 'GB7B3XW9QZ...4X9R2M',
        completedAt: nowSec - 86400 * 3,
      },
      {
        id: 'M2',
        title: 'Milestone Attestation & Emergency Drain Mechanics',
        description: 'Verify multisig manager attestation and sender cliff safety checks.',
        scaleMultiplierBps: 15000, // scales flow rate by 1.5x
        status: 'pending',
      },
      {
        id: 'M3',
        title: 'Mainnet Verification & Security Audit Report',
        description: 'Formal verification with Trail of Bits and public mainnet release.',
        scaleMultiplierBps: 20000, // scales flow rate by 2.0x
        status: 'pending',
      },
    ],
    activeMilestoneId: 'M2',
  },
  {
    id: 'SG-1002',
    title: 'Security Retainer: Automated Soroban Fuzzing',
    sender: 'GB7B3XW9QZ...4X9R2M',
    recipient: 'GC91K28X...3V7TR0',
    token: SUPPORTED_TOKENS[1], // USDC
    totalDeposit: 15000, // 15,000 USDC
    flowRatePerSecond: 0.005787, // ~15,000 USDC over 30 days
    startTime: nowSec - 86400 * 2, // started 2 days ago
    stopTime: nowSec + 86400 * 28,
    cliffTime: nowSec + 86400 * 5, // Cliff is in the FUTURE (5 days away) - sender can clawback!
    withdrawnAmount: 0,
    lastUpdateTimestamp: nowSec - 86400 * 2,
    accumulatedBeforePause: 0,
    status: 'active',
    canSenderClawback: true,
    ledgerSequence: 498320,
    memo: 'Ongoing continuous retainer with 7-day cliff execution buffer',
    milestones: [
      {
        id: 'SEC-1',
        title: 'Invariant & Fuzz Testing Harness',
        description: 'Coverage report exceeding 95% of state transitions.',
        scaleMultiplierBps: 10000,
        status: 'pending',
      },
    ],
  },
  {
    id: 'SG-1003',
    title: 'Ecosystem Contributor Drip Fellowship',
    sender: 'GA489M2Q...9LPX8K',
    recipient: 'GB7B3XW9QZ...4X9R2M',
    token: SUPPORTED_TOKENS[2], // DRIP
    totalDeposit: 250000,
    flowRatePerSecond: 0.09645,
    startTime: nowSec - 86400 * 10,
    stopTime: nowSec + 86400 * 20,
    cliffTime: nowSec - 86400 * 7,
    withdrawnAmount: 42000,
    lastUpdateTimestamp: nowSec - 86400 * 1,
    accumulatedBeforePause: 0,
    status: 'active',
    canSenderClawback: true,
    ledgerSequence: 497880,
    memo: 'Continuous drip stream for community SDK engineering',
    milestones: [],
  },
];
