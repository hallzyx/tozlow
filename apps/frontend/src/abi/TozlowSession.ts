import type { Address } from "viem";

// ============================================================
// ABI exportado desde: cargo stylus export-abi
// Contrato: TozlowSession (Arbitrum Stylus / Rust)
// Desplegado: 0x8199e24ee11dfed71aa8c0002cca639cbbf5f4f1
// ============================================================

export const TOZLOW_ADDRESS = (process.env.NEXT_PUBLIC_TOZLOW_ADDRESS ??
  "0x") as Address;

export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS ??
  "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d") as Address;

// ABI del contrato TozlowSession
export const tozlowAbi = [
  // ---- Write functions ----
  {
    type: "function",
    name: "initialize",
    inputs: [{ name: "usdc", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createSession",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "voting_period", type: "uint256" },
      { name: "participants", type: "address[]" },
    ],
    outputs: [{ type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deposit",
    inputs: [{ name: "session_id", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "castVote",
    inputs: [
      { name: "session_id", type: "uint256" },
      { name: "absent", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "finalizeSession",
    inputs: [{ name: "session_id", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // ---- View functions ----
  {
    type: "function",
    name: "getSession",
    inputs: [{ name: "session_id", type: "uint256" }],
    outputs: [
      { name: "host", type: "address" },
      { name: "amount_per_person", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "voting_period", type: "uint256" },
      { name: "finalized", type: "bool" },
      { name: "active", type: "bool" },
      { name: "participant_count", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getParticipantAt",
    inputs: [
      { name: "session_id", type: "uint256" },
      { name: "index", type: "uint256" },
    ],
    outputs: [{ type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasDeposited",
    inputs: [
      { name: "session_id", type: "uint256" },
      { name: "addr", type: "address" },
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasVoted",
    inputs: [
      { name: "session_id", type: "uint256" },
      { name: "addr", type: "address" },
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "absenceVoteCount",
    inputs: [
      { name: "session_id", type: "uint256" },
      { name: "addr", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "votingDeadline",
    inputs: [{ name: "session_id", type: "uint256" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "usdcAddress",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "sessionCount",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  // ---- Events ----
  {
    type: "event",
    name: "SessionCreated",
    inputs: [
      { name: "session_id", type: "uint256", indexed: true },
      { name: "host", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "deadline", type: "uint256", indexed: false },
      { name: "voting_period", type: "uint256", indexed: false },
      { name: "participant_count", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Deposited",
    inputs: [
      { name: "session_id", type: "uint256", indexed: true },
      { name: "participant", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "VoteCast",
    inputs: [
      { name: "session_id", type: "uint256", indexed: true },
      { name: "voter", type: "address", indexed: true },
      { name: "absent", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "Finalized",
    inputs: [
      { name: "session_id", type: "uint256", indexed: true },
      { name: "absentee_count", type: "uint256", indexed: false },
      { name: "reward_per_attendee", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Refunded",
    inputs: [
      { name: "session_id", type: "uint256", indexed: true },
    ],
  },
  // ---- Errors ----
  { type: "error", name: "AlreadyInitialized", inputs: [] },
  { type: "error", name: "NotParticipant", inputs: [] },
  { type: "error", name: "AlreadyDeposited", inputs: [] },
  { type: "error", name: "DeadlineNotReached", inputs: [] },
  { type: "error", name: "DeadlineReached", inputs: [] },
  { type: "error", name: "AlreadyFinalized", inputs: [] },
  { type: "error", name: "NotEnoughParticipants", inputs: [] },
  { type: "error", name: "TooManyParticipants", inputs: [] },
  { type: "error", name: "TransferFailed", inputs: [] },
  { type: "error", name: "AlreadyVoted", inputs: [] },
  { type: "error", name: "InvalidAbsent", inputs: [] },
  { type: "error", name: "NotAllDeposited", inputs: [] },
  { type: "error", name: "VotingNotOpen", inputs: [] },
  { type: "error", name: "VotingClosed", inputs: [] },
  { type: "error", name: "SessionNotActive", inputs: [] },
  { type: "error", name: "CannotVoteSelf", inputs: [] },
] as const;

// ABI del ERC-20 (USDC) — solo lo necesario para approve
export const erc20Abi = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ type: "uint8" }],
    stateMutability: "view",
  },
] as const;
