export const TIER = {
  Steward:     { color: "#B8902A", icon: "◆", min: 12000 },
  Arbiter:     { color: "#2E5BFF", icon: "▲", min: 3500  },
  Analyst:     { color: "#7C5CFF", icon: "●", min: 800   },
  Contributor: { color: "#4A4A6A", icon: "◐", min: 150   },
  Novice:      { color: "#2A2A3A", icon: "○", min: 0     },
};

export const CAT_COLORS = {
  Airdrops:       { bg: "#051A0E", text: "#3DBA6F" },
  Accountability: { bg: "#050F1F", text: "#4D7AFF" },
  Security:       { bg: "#1A0A05", text: "#D4703A" },
  Projects:       { bg: "#110820", text: "#9B6FD8" },
  Trust:          { bg: "#1F0A0A", text: "#E0556E" },
  Other:          { bg: "#0F0F1A", text: "#4A4A6A" },
};

// Claim types for the Anchor constraint engine
export const CLAIM_TYPES = [
  { id: 'binary',      label: 'Binary Outcome',   tag: 'YES / NO',    example: 'ETH will hit $5,000 by Sep 30 2026' },
  { id: 'numeric',     label: 'Numeric Target',   tag: 'THRESHOLD',   example: 'BTC dominance will exceed 58% by Q4' },
  { id: 'comparative', label: 'Comparative',      tag: 'A vs B',      example: 'SOL will outperform ETH by 40% in 90 days' },
  { id: 'event',       label: 'Event Outcome',    tag: 'OCCURRENCE',  example: 'Polymarket will launch a token before 2027' },
];

// Metric definitions for the Anchor constraint engine
export const METRICS = {
  price:     { id: 'price',     label: 'Price',          unit: 'USD',   source: 'Chainlink / market feed',  availableFor: ['binary','numeric','comparative'] },
  pct:       { id: 'pct',       label: '% Change',       unit: '%',     source: 'CoinGecko / protocol feed', availableFor: ['numeric','comparative'] },
  mcap:      { id: 'mcap',      label: 'Market Cap',     unit: 'USD',   source: 'CoinGecko',                 availableFor: ['numeric','comparative'] },
  volume:    { id: 'volume',    label: 'Volume (24h)',   unit: 'USD',   source: 'DEX aggregator',            availableFor: ['numeric','comparative'] },
  tvl:       { id: 'tvl',       label: 'TVL',            unit: 'USD',   source: 'DefiLlama',                 availableFor: ['numeric','comparative'] },
  users:     { id: 'users',     label: 'User Count',     unit: 'COUNT', source: 'Protocol analytics',        availableFor: ['numeric'] },
  rank:      { id: 'rank',      label: 'Rank Position',  unit: '#N',    source: 'CoinGecko ranking',         availableFor: ['numeric'] },
  event:     { id: 'event',     label: 'Event Complete', unit: 'BOOL',  source: 'On-chain event / admin',    availableFor: ['event','binary'] },
  deploy:    { id: 'deploy',    label: 'On-chain Deploy',unit: 'BOOL',  source: 'Block explorer',            availableFor: ['event'] },
  launch:    { id: 'launch',    label: 'Token Launch',   unit: 'BOOL',  source: 'Base oracle',                availableFor: ['event'] },
};

// Relative window presets for Step 3 timeframe picker
export const RELATIVE_WINDOWS = [
  { label: '7 days',   days: 7   },
  { label: '30 days',  days: 30  },
  { label: '90 days',  days: 90  },
  { label: '6 months', days: 182 },
  { label: '1 year',   days: 365 },
  { label: '2 years',  days: 730 },
];

export const PROOF_TYPES = [
  { id: "on-chain",  label: "On-chain Data",  multiplier: 6.0, color: "#B8902A",  desc: "Transaction hash, contract state, verified event" },
  { id: "article",   label: "Article / Post", multiplier: 2.0, color: "#2E5BFF",  desc: "News article, official announcement, blog post" },
  { id: "document",  label: "Document",       multiplier: 2.0, color: "#7C5CFF",  desc: "Filing, whitepaper, official document" },
  { id: "social",    label: "Social Proof",   multiplier: 1.5, color: "#3DBA6F",  desc: "Tweet, Discord from verified official source" },
  { id: "none",      label: "No Proof",       multiplier: 0.02,color: "#2A2A3A",  desc: "Opinion only — nearly weightless" },
];

export const INITIAL_CLAIMS = [];
