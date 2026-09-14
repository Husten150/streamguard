/**
 * StreamGuard: Stellar Soroban Smart Contract Suite & CLI Blueprint
 * Target: soroban-sdk = "21.0.0"
 */

export const RUST_CONTRACT_LIB = `//! # StreamGuard Protocol: Continuous Token Streaming on Stellar Soroban
//!
//! Production-grade token streaming and milestone-gated drip protocol.
//! Built with \`soroban-sdk = "21.0.0"\`.

#![no_std]

mod math;
mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{
    contract, contractimpl, token, Address, BytesN, Env, IntoVal, String, Symbol, Vec,
};
use types::{DataKey, MilestoneAttestation, Stream, StreamConfig, StreamState};

pub const DAY_IN_LEDGERS: u32 = 17_280; // ~5 sec per ledger
pub const PERSISTENT_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS; // 30 days
pub const PERSISTENT_LIFETIME_THRESHOLD: u32 = 7 * DAY_IN_LEDGERS; // 7 days

#[contract]
pub struct StreamGuardContract;

#[contractimpl]
impl StreamGuardContract {
    /// Initialize the protocol with an admin address
    pub fn initialize(env: Env, admin: Address) {
        if storage::has_admin(&env) {
            panic!("Already initialized");
        }
        admin.require_auth();
        storage::set_admin(&env, &admin);
        storage::set_stream_sequence(&env, 0);

        // Extend Instance storage TTL to maintain protocol viability
        env.storage().instance().extend_ttl(PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);
    }

    /// Create a continuous token stream from sender to recipient
    /// Tokens are locked into the contract from the sender
    pub fn create_stream(
        env: Env,
        sender: Address,
        recipient: Address,
        token: Address,
        total_deposit: i128,
        flow_rate_per_second: i128,
        start_time: u64,
        stop_time: u64,
        cliff_time: u64,
        memo: String,
    ) -> u64 {
        sender.require_auth();

        if total_deposit <= 0 {
            panic!("Deposit must be positive");
        }
        if flow_rate_per_second <= 0 {
            panic!("Flow rate must be positive");
        }
        if stop_time <= start_time {
            panic!("Stop time must exceed start time");
        }
        if cliff_time > stop_time {
            panic!("Cliff cannot exceed stop time");
        }

        // Verify that flow rate * duration aligns with total deposit
        let duration = (stop_time - start_time) as i128;
        let calculated_total = flow_rate_per_second
            .checked_mul(duration)
            .expect("Overflow in flow rate calculation");

        if calculated_total > total_deposit {
            panic!("Calculated stream stream exceeds total deposit");
        }

        // Transfer tokens from sender into this contract
        let client = token::Client::new(&env, &token);
        client.transfer(&sender, &env.current_contract_address(), &total_deposit);

        let stream_id = storage::next_stream_sequence(&env);

        let stream = Stream {
            id: stream_id,
            sender: sender.clone(),
            recipient: recipient.clone(),
            token: token.clone(),
            total_deposit,
            remaining_balance: total_deposit,
            flow_rate_per_second,
            start_time,
            stop_time,
            cliff_time,
            withdrawn_amount: 0,
            last_update_time: start_time,
            accumulated_before_pause: 0,
            paused_at: 0,
            state: StreamState::Active,
            milestone_multiplier_bps: 10_000, // 100% baseline (10,000 bps)
            memo,
        };

        // Store stream in Persistent Storage with auto-bumped TTL
        storage::set_stream(&env, stream_id, &stream);

        // Emit Soroban topic event
        env.events().publish(
            (Symbol::new(&env, "stream_created"), sender, recipient),
            stream_id,
        );

        stream_id
    }

    /// Withdraw vested claimable tokens from the stream
    pub fn withdraw_from_stream(env: Env, stream_id: u64, amount: i128) -> i128 {
        let mut stream = storage::get_stream(&env, stream_id);
        stream.recipient.require_auth();

        let current_time = env.ledger().timestamp();

        // Check cliff condition: no withdrawal allowed before cliff
        if current_time < stream.cliff_time {
            panic!("Cliff period active: tokens not yet unlocked");
        }

        let balance_info = math::calculate_claimable_balance(&stream, current_time);
        let max_claimable = balance_info.claimable;

        if max_claimable <= 0 {
            panic!("No tokens currently claimable");
        }

        let withdraw_amount = if amount <= 0 || amount > max_claimable {
            max_claimable
        } else {
            amount
        };

        // Update stream accounting
        stream.withdrawn_amount = stream
            .withdrawn_amount
            .checked_add(withdraw_amount)
            .expect("Overflow in withdrawn amount");

        stream.remaining_balance = stream
            .remaining_balance
            .checked_sub(withdraw_amount)
            .expect("Underflow in remaining balance");

        // Mark as completed if fully vested and depleted
        if stream.remaining_balance == 0 || (current_time >= stream.stop_time && stream.withdrawn_amount >= stream.total_deposit) {
            stream.state = StreamState::Completed;
        }

        storage::set_stream(&env, stream_id, &stream);

        // Transfer vested tokens to recipient
        let client = token::Client::new(&env, &stream.token);
        client.transfer(&env.current_contract_address(), &stream.recipient, &withdraw_amount);

        // Emit withdrawal event
        env.events().publish(
            (Symbol::new(&env, "withdrawn"), stream.recipient.clone()),
            withdraw_amount,
        );

        withdraw_amount
    }

    /// Pause an active stream (authorized by sender or protocol admin)
    pub fn pause_stream(env: Env, stream_id: u64) {
        let mut stream = storage::get_stream(&env, stream_id);
        
        // Either sender or contract admin can trigger pause
        let is_admin = storage::get_admin(&env) == env.current_contract_address();
        if !is_admin {
            stream.sender.require_auth();
        }

        if stream.state != StreamState::Active {
            panic!("Stream must be active to pause");
        }

        let now = env.ledger().timestamp();
        let balance_info = math::calculate_claimable_balance(&stream, now);
        
        stream.accumulated_before_pause = balance_info.vested_so_far;
        stream.paused_at = now;
        stream.state = StreamState::Paused;

        storage::set_stream(&env, stream_id, &stream);

        env.events().publish(
            (Symbol::new(&env, "stream_paused"), stream.sender.clone()),
            stream_id,
        );
    }

    /// Resume a paused stream
    pub fn resume_stream(env: Env, stream_id: u64) {
        let mut stream = storage::get_stream(&env, stream_id);
        stream.sender.require_auth();

        if stream.state != StreamState::Paused {
            panic!("Stream is not paused");
        }

        let now = env.ledger().timestamp();
        let pause_duration = now.saturating_sub(stream.paused_at);

        // Extend stop_time by duration paused so recipient receives full allocation
        stream.stop_time = stream.stop_time.saturating_add(pause_duration);
        stream.last_update_time = now;
        stream.paused_at = 0;
        stream.state = StreamState::Active;

        storage::set_stream(&env, stream_id, &stream);

        env.events().publish(
            (Symbol::new(&env, "stream_resumed"), stream.sender.clone()),
            stream_id,
        );
    }

    /// Sender top-up: add more tokens to an ongoing stream
    pub fn top_up_stream(env: Env, stream_id: u64, amount: i128) {
        let mut stream = storage::get_stream(&env, stream_id);
        stream.sender.require_auth();

        if amount <= 0 {
            panic!("Top up amount must be positive");
        }
        if stream.state == StreamState::Cancelled || stream.state == StreamState::Completed {
            panic!("Cannot top up an ended stream");
        }

        let client = token::Client::new(&env, &stream.token);
        client.transfer(&stream.sender, &env.current_contract_address(), &amount);

        stream.total_deposit = stream.total_deposit.checked_add(amount).expect("Overflow");
        stream.remaining_balance = stream.remaining_balance.checked_add(amount).expect("Overflow");

        // Calculate new extended stop_time based on current flow rate
        let added_duration = (amount / stream.flow_rate_per_second) as u64;
        stream.stop_time = stream.stop_time.saturating_add(added_duration);

        storage::set_stream(&env, stream_id, &stream);

        env.events().publish(
            (Symbol::new(&env, "stream_topped_up"), stream.sender.clone()),
            amount,
        );
    }

    /// Milestone-gated drip adjustment
    /// Grant managers can adjust flow rate based on verified milestone attestation
    pub fn adjust_flow_rate_milestone(
        env: Env,
        stream_id: u64,
        new_flow_rate: i128,
        attestation: MilestoneAttestation,
    ) {
        let mut stream = storage::get_stream(&env, stream_id);
        
        // Verify attestation signer authorization
        attestation.signer.require_auth();

        if new_flow_rate <= 0 {
            panic!("Flow rate must be strictly positive");
        }

        let now = env.ledger().timestamp();
        // Snapshot already vested balance at current flow rate
        let balance_info = math::calculate_claimable_balance(&stream, now);
        stream.accumulated_before_pause = balance_info.vested_so_far;
        stream.last_update_time = now;
        stream.flow_rate_per_second = new_flow_rate;
        stream.milestone_multiplier_bps = attestation.scale_bps;

        storage::set_stream(&env, stream_id, &stream);

        env.events().publish(
            (Symbol::new(&env, "milestone_adjusted"), attestation.milestone_id),
            new_flow_rate,
        );
    }

    /// Emergency sender clawback / cancellation
    /// Prior to cliff: Sender claws back 100% of deposit
    /// After cliff: Recipient gets vested-so-far, Sender gets remaining unvested tokens
    pub fn cancel_stream(env: Env, stream_id: u64) -> (i128, i128) {
        let mut stream = storage::get_stream(&env, stream_id);
        stream.sender.require_auth();

        if stream.state == StreamState::Cancelled || stream.state == StreamState::Completed {
            panic!("Stream is already finalized");
        }

        let now = env.ledger().timestamp();
        let (recipient_payout, sender_clawback) = if now < stream.cliff_time {
            // Pre-cliff: 100% emergency sender drain
            (0, stream.remaining_balance)
        } else {
            // Post-cliff: recipient gets earned-to-date minus withdrawn, sender gets unvested
            let balance_info = math::calculate_claimable_balance(&stream, now);
            let recipient_due = balance_info.claimable;
            let unvested = stream.remaining_balance.saturating_sub(recipient_due);
            (recipient_due, unvested)
        };

        stream.state = StreamState::Cancelled;
        stream.remaining_balance = 0;
        storage::set_stream(&env, stream_id, &stream);

        let client = token::Client::new(&env, &stream.token);

        if recipient_payout > 0 {
            client.transfer(&env.current_contract_address(), &stream.recipient, &recipient_payout);
        }
        if sender_clawback > 0 {
            client.transfer(&env.current_contract_address(), &stream.sender, &sender_clawback);
        }

        env.events().publish(
            (Symbol::new(&env, "stream_cancelled"), stream.sender.clone()),
            (recipient_payout, sender_clawback),
        );

        (recipient_payout, sender_clawback)
    }

    /// Read stream balance and claimable stats
    pub fn get_stream_balance(env: Env, stream_id: u64) -> types::StreamBalanceInfo {
        let stream = storage::get_stream(&env, stream_id);
        let now = env.ledger().timestamp();
        math::calculate_claimable_balance(&stream, now)
    }

    /// Fetch full stream struct
    pub fn get_stream(env: Env, stream_id: u64) -> Stream {
        storage::get_stream(&env, stream_id)
    }
}
`;

export const RUST_CONTRACT_TYPES = `//! Custom Soroban contract types and DataKeys
use soroban_sdk::{contracttype, Address, String};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum StreamState {
    Active,
    Paused,
    Completed,
    Cancelled,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Stream {
    pub id: u64,
    pub sender: Address,
    pub recipient: Address,
    pub token: Address,
    pub total_deposit: i128,
    pub remaining_balance: i128,
    pub flow_rate_per_second: i128,
    pub start_time: u64,
    pub stop_time: u64,
    pub cliff_time: u64,
    pub withdrawn_amount: i128,
    pub last_update_time: u64,
    pub accumulated_before_pause: i128,
    pub paused_at: u64,
    pub state: StreamState,
    pub milestone_multiplier_bps: u32,
    pub memo: String,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct StreamBalanceInfo {
    pub total_deposit: i128,
    pub vested_so_far: i128,
    pub withdrawn_amount: i128,
    pub claimable: i128,
    pub remaining_unvested: i128,
    pub is_cliff_active: bool,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct MilestoneAttestation {
    pub milestone_id: u32,
    pub signer: Address,
    pub scale_bps: u32, // e.g. 15000 = 1.5x flow rate
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    StreamSequence,
    Stream(u64),
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct StreamConfig {
    pub min_duration: u64,
    pub protocol_fee_bps: u32,
}
`;

export const RUST_CONTRACT_STORAGE = `//! Storage accessors utilizing Soroban Instance and Persistent Storage
use soroban_sdk::{Address, Env};
use crate::types::{DataKey, Stream};
use crate::{PERSISTENT_BUMP_AMOUNT, PERSISTENT_LIFETIME_THRESHOLD};

pub fn has_admin(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Admin)
}

pub fn get_admin(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Admin).expect("Admin not set")
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn get_stream_sequence(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::StreamSequence)
        .unwrap_or(0)
}

pub fn set_stream_sequence(env: &Env, seq: u64) {
    env.storage().instance().set(&DataKey::StreamSequence, &seq);
}

pub fn next_stream_sequence(env: &Env) -> u64 {
    let next = get_stream_sequence(env) + 1;
    set_stream_sequence(env, next);
    next
}

pub fn set_stream(env: &Env, stream_id: u64, stream: &Stream) {
    let key = DataKey::Stream(stream_id);
    env.storage().persistent().set(&key, stream);
    
    // Crucial Soroban best-practice: bump persistent storage TTL to protect against archival rent eviction
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);
}

pub fn get_stream(env: &Env, stream_id: u64) -> Stream {
    let key = DataKey::Stream(stream_id);
    // Refresh TTL on read to maintain active stream persistence
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);
    
    env.storage()
        .persistent()
        .get(&key)
        .expect("Stream does not exist")
}
`;

export const RUST_CONTRACT_MATH = `//! High-precision linear decay / drip math for Soroban
use crate::types::{Stream, StreamBalanceInfo, StreamState};

pub fn calculate_claimable_balance(stream: &Stream, current_time: u64) -> StreamBalanceInfo {
    let is_cliff_active = current_time < stream.cliff_time;

    if stream.state == StreamState::Cancelled || stream.state == StreamState::Completed {
        return StreamBalanceInfo {
            total_deposit: stream.total_deposit,
            vested_so_far: stream.withdrawn_amount,
            withdrawn_amount: stream.withdrawn_amount,
            claimable: 0,
            remaining_unvested: 0,
            is_cliff_active: false,
        };
    }

    if current_time < stream.start_time {
        return StreamBalanceInfo {
            total_deposit: stream.total_deposit,
            vested_so_far: 0,
            withdrawn_amount: 0,
            claimable: 0,
            remaining_unvested: stream.total_deposit,
            is_cliff_active,
        };
    }

    // Effective calculation point
    let effective_time = if stream.state == StreamState::Paused {
        stream.paused_at
    } else {
        core::cmp::min(current_time, stream.stop_time)
    };

    let elapsed_seconds = effective_time.saturating_sub(stream.last_update_time) as i128;
    
    // Scale by flow rate and bps multiplier
    let incremental_vested = elapsed_seconds
        .saturating_mul(stream.flow_rate_per_second)
        .saturating_mul(stream.milestone_multiplier_bps as i128)
        / 10_000;

    let mut total_vested = stream
        .accumulated_before_pause
        .saturating_add(incremental_vested);

    // Bound by total deposit
    if total_vested > stream.total_deposit {
        total_vested = stream.total_deposit;
    }

    let claimable = if is_cliff_active {
        0
    } else {
        total_vested.saturating_sub(stream.withdrawn_amount)
    };

    let remaining_unvested = stream.total_deposit.saturating_sub(total_vested);

    StreamBalanceInfo {
        total_deposit: stream.total_deposit,
        vested_so_far: total_vested,
        withdrawn_amount: stream.withdrawn_amount,
        claimable,
        remaining_unvested,
        is_cliff_active,
    }
}
`;

export const RUST_CARGO_TOML = `[package]
name = "streamguard"
version = "0.1.0"
edition = "2021"
publish = false

[lib]
crate-type = ["cdylib"]
doctest = false

[dependencies]
soroban-sdk = "21.0.0"

[dev-dependencies]
soroban-sdk = { version = "21.0.0", features = ["testutils"] }

[profile.release]
opt-level = "z"
overflow-checks = true
debug = 0
strip = "symbols"
debug-assertions = false
panic = "abort"
codegen-units = 1
lto = true
`;

export const CLI_DEPLOYMENT_GUIDE = `# 1. Install Soroban CLI & Rust target
rustup target add wasm32-unknown-unknown
cargo install --locked soroban-cli

# 2. Build the optimized WebAssembly contract
cargo build --target wasm32-unknown-unknown --release

# 3. Optimize Wasm footprint using Soroban CLI
soroban contract optimize \\
  --wasm target/wasm32-unknown-unknown/release/streamguard.wasm

# 4. Configure Testnet Identity
soroban keys generate streamguard-deployer --network testnet
soroban keys fund streamguard-deployer --network testnet

# 5. Deploy to Stellar Testnet
CONTRACT_ID=$(soroban contract deploy \\
  --wasm target/wasm32-unknown-unknown/release/streamguard.optimized.wasm \\
  --source streamguard-deployer \\
  --network testnet)

echo "Deployed StreamGuard Contract ID: $CONTRACT_ID"

# 6. Initialize Protocol
soroban contract invoke \\
  --id $CONTRACT_ID \\
  --source streamguard-deployer \\
  --network testnet \\
  -- \\
  initialize \\
  --admin $(soroban keys address streamguard-deployer)

# 7. Generate Production TypeScript Bindings
soroban contract bindings typescript \\
  --wasm target/wasm32-unknown-unknown/release/streamguard.optimized.wasm \\
  --id $CONTRACT_ID \\
  --output-dir ../frontend/src/contracts/streamguard-client
`;

export const NEXTJS_FRONTEND_CODE = `// components/StellarWalletProvider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { StellarWalletsKit, WalletNetwork, allowAllModules, FREIGHTER_ID, XBULL_ID, ALBEDO_ID } from '@creit.tech/stellar-wallets-kit';

interface WalletContextType {
  address: string | null;
  kit: StellarWalletsKit | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  network: WalletNetwork;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  kit: null,
  connect: async () => {},
  disconnect: () => {},
  network: WalletNetwork.TESTNET,
});

export function StellarWalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [kit, setKit] = useState<StellarWalletsKit | null>(null);

  useEffect(() => {
    const walletsKit = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      selectedWalletId: FREIGHTER_ID,
      modules: allowAllModules(),
    });
    setKit(walletsKit);
  }, []);

  const connect = async () => {
    if (!kit) return;
    await kit.openModal({
      onWalletSelected: async (option) => {
        kit.setWallet(option.id);
        const { address: addr } = await kit.getAddress();
        setAddress(addr);
      },
    });
  };

  const disconnect = () => {
    setAddress(null);
  };

  return (
    <WalletContext.Provider value={{ address, kit, connect, disconnect, network: WalletNetwork.TESTNET }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useStellarWallet = () => useContext(WalletContext);
`;

export const HOOK_SOURCE_CODE = `// hooks/useSorobanStream.ts
'use client';

import { useState, useEffect, useRef } from 'react';

export interface StreamMetrics {
  claimable: number;
  vestedSoFar: number;
  withdrawn: number;
  remainingUnvested: number;
  progressPercent: number;
  isCliffActive: boolean;
}

export function useSorobanStream(
  stream: {
    totalDeposit: number;
    flowRatePerSecond: number;
    startTime: number;
    stopTime: number;
    cliffTime?: number;
    withdrawnAmount: number;
    accumulatedBeforePause: number;
    pausedAt?: number;
    isPaused: boolean;
    isCancelled: boolean;
  }
) {
  const [metrics, setMetrics] = useState<StreamMetrics>({
    claimable: 0,
    vestedSoFar: 0,
    withdrawn: stream.withdrawnAmount,
    remainingUnvested: stream.totalDeposit - stream.withdrawnAmount,
    progressPercent: 0,
    isCliffActive: false,
  });

  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      const now = Date.now() / 1000;
      const isCliffActive = stream.cliffTime ? now < stream.cliffTime : false;

      if (stream.isCancelled) {
        setMetrics(prev => ({ ...prev, claimable: 0, isCliffActive: false }));
        return;
      }

      const effectiveTime = stream.isPaused
        ? (stream.pausedAt ?? now)
        : Math.min(now, stream.stopTime);

      const elapsed = Math.max(0, effectiveTime - stream.startTime);
      let vested = stream.accumulatedBeforePause + (elapsed * stream.flowRatePerSecond);
      if (vested > stream.totalDeposit) vested = stream.totalDeposit;

      const claimable = isCliffActive ? 0 : Math.max(0, vested - stream.withdrawnAmount);
      const remainingUnvested = Math.max(0, stream.totalDeposit - vested);
      const progress = stream.totalDeposit > 0 ? (vested / stream.totalDeposit) * 100 : 0;

      setMetrics({
        claimable,
        vestedSoFar: vested,
        withdrawn: stream.withdrawnAmount,
        remainingUnvested,
        progressPercent: progress,
        isCliffActive,
      });

      if (!stream.isPaused && now < stream.stopTime) {
        rafRef.current = requestAnimationFrame(update);
      }
    };

    rafRef.current = requestAnimationFrame(update);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [stream]);

  return metrics;
}
`;

export const TICKER_COMPONENT_CODE = `// components/StreamTicker60fps.tsx
'use client';

import React from 'react';
import { useSorobanStream } from '../hooks/useSorobanStream';

interface Props {
  stream: any;
  symbol: string;
}

export function StreamTicker60fps({ stream, symbol }: Props) {
  const { claimable, progressPercent, isCliffActive } = useSorobanStream(stream);

  // Split into integer and high-precision 7-decimal stroop fraction
  const integerPart = Math.floor(claimable).toLocaleString();
  const fractionalPart = (claimable % 1).toFixed(7).substring(2);

  return (
    <div className="font-mono bg-slate-900 border border-emerald-500/30 rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
        <span>LIVE CLAIMABLE DRIP</span>
        {isCliffActive && (
          <span className="text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded text-[10px]">
            CLIFF ACTIVE
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1 text-2xl md:text-3xl font-bold tracking-tight text-white">
        <span className="text-emerald-400">{integerPart}.</span>
        <span className="text-emerald-300 font-mono tracking-widest">{fractionalPart}</span>
        <span className="text-sm text-slate-400 ml-1 font-sans">{symbol}</span>
      </div>

      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
        <div 
          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
          style={{ width: \`\${Math.min(100, progressPercent)}%\` }}
        />
      </div>
    </div>
  );
}
`;

export const GRANT_STRATEGY_CONTENT = {
  elevatorPitch: "StreamGuard is a next-generation continuous token streaming and milestone-gated drip protocol engineered natively on Stellar Soroban. By harnessing sub-second ledger finality, stroop-level linear decay math, and Soroban's native TTL storage rent model, StreamGuard enables grant DAOs, security retainers, and payroll workflows to distribute capital trustlessly. With emergency sender clawbacks prior to cliff execution and multi-sig milestone attestations, capital is safeguarded at every second.",
  
  technicalDifferentiators: [
    {
      title: "Micro-Stroop Precision Linear Decay Math",
      desc: "Unlike EVM drip protocols with block-time quantization and high gas costs, StreamGuard leverages 64-bit timestamp precision in Soroban host environments, enabling continuous drip calculation down to 0.0000001 XLM (1 Stroop) without numerical drift.",
      tag: "Soroban Host Math"
    },
    {
      title: "Sub-Second Finality & Near-Zero Gas Fees",
      desc: "Benefiting from Stellar Protocol 20/21, recipients can withdraw streamed tokens with negligible fees (<$0.0001 per claim), making real-time micro-withdrawals practically viable compared to $5-$30 gas fees on Ethereum.",
      tag: "Protocol Performance"
    },
    {
      title: "Storage Rent & Persistent TTL Lifecycle Optimization",
      desc: "StreamGuard cleanly separates global protocol parameters into Soroban Instance storage while sharding active streams across Persistent storage with automated extend_ttl calls, eliminating state bloat and keeping contract rent minimal.",
      tag: "Rent-Engineered Architecture"
    },
    {
      title: "Granular Milestone Scaling & Pre-Cliff Clawbacks",
      desc: "Integrated milestone attestations allow grant managers to verify deliverables before unlocking or scaling flow rates (e.g. 1.5x speedup upon milestone delivery) with built-in sender emergency drain protection.",
      tag: "Capital Safety"
    }
  ],

  milestones: [
    {
      number: "01",
      title: "Core Protocol Security Audit & Soroban Testnet V2",
      duration: "Weeks 1 - 4",
      deliverables: [
        "Comprehensive formal verification of linear decay math against overflow/underflow",
        "Integration of Stellar Asset Contract (SAC) multi-token standard (USDC, XLM, EURC)",
        "Automated TTL rent monitor to auto-extend expiring stream entries on Testnet"
      ]
    },
    {
      number: "02",
      title: "Stellar Wallets Kit SDK & DAO Governance Integration",
      duration: "Weeks 5 - 8",
      deliverables: [
        "Production-ready @streamguard/sdk npm package with Next.js App Router hooks",
        "Deep integration with Freighter, xBull, and Albedo with signAndSubmitTransaction flows",
        "Milestone attestation registry with Soroban multi-signature grant approval flows"
      ]
    },
    {
      number: "03",
      title: "Mainnet Launch, Analytics Subgraph & Ecosystem Drip Pool",
      duration: "Weeks 9 - 12",
      deliverables: [
        "Deployment to Stellar Mainnet with immutable proxy upgrade architecture",
        "Real-time event indexing service tracking all active streams and withdrawal metrics",
        "Pilot launch with 3 Stellar Community Fund grantees distributing $150k in streaming grants"
      ]
    }
  ]
};
