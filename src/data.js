export const TIER = {
  Steward:     { color: "#B8902A", icon: "◆", min: 12000 },
  Arbiter:     { color: "#2E5BFF", icon: "▲", min: 3500  },
  Analyst:     { color: "#7C5CFF", icon: "●", min: 800   },
  Contributor: { color: "#4A4A6A", icon: "◐", min: 150   },
  Novice:      { color: "#2A2A3A", icon: "○", min: 0     },
};

export const CAT_COLORS = {
  Crypto:   { bg: "#050F1F", text: "#4D7AFF" },
  Airdrops: { bg: "#051A0E", text: "#3DBA6F" },
  Politics: { bg: "#110820", text: "#9B6FD8" },
  Sports:   { bg: "#1A0A05", text: "#D4703A" },
  Finance:  { bg: "#051A18", text: "#2AC4B3" },
  Other:    { bg: "#0F0F1A", text: "#4A4A6A" },
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

export const INITIAL_CLAIMS = [
  {
    id: 1,
    title: "Base will launch a token before Q4 2026",
    category: "Crypto",
    chain: "Base",
    anchorer: "0x9f3b...a2c1",
    tier: "Steward",
    capital: 420,
    honorStaked: 8420,
    callers: 18,
    proven: 67,
    faded: 33,
    status: "open",
    daysLeft: 14,
    description: "Coinbase's Base L2 has been hinting at token launch for months. Treasury wallets, recent hiring of tokenomics lead, and Coinbase's incentive structure all point to Q3.",
    calls: [
      {
        wallet: "0x9f3b...a2c1",
        tier: "Steward",
        side: "proven",
        honorStaked: 200,
        capitalStaked: 50,
        proofs: [
          { type: "on-chain", content: "Base treasury wallet received token contract deploy bytecode matching ERC-20 standard at block 46,201,334.", url: "https://sepolia.basescan.org/tx/0x..." },
          { type: "document", content: "Coinbase Q2 2026 filing references 'network token incentive program' in forward-looking statements.", url: null },
        ],
        weight: 1200,
      },
      {
        wallet: "0x2a1c...f9e3",
        tier: "Analyst",
        side: "faded",
        honorStaked: 50,
        capitalStaked: 20,
        proofs: [
          { type: "article", content: "Circle blog post Q1 2026 suggests no token plans disclosed for this fiscal year.", url: "https://circle.com/blog/..." },
        ],
        weight: 100,
      },
      {
        wallet: "0x7f4a...b3d1",
        tier: "Contributor",
        side: "proven",
        honorStaked: 25,
        capitalStaked: 20,
        proofs: [],
        weight: 0.5,
      },
    ],
  },
  {
    id: 2,
    title: "Polymarket will airdrop before end of 2026",
    category: "Airdrops",
    chain: "Polygon",
    anchorer: "0x2a1c...f9e3",
    tier: "Arbiter",
    capital: 1240,
    honorStaked: 12400,
    callers: 34,
    proven: 82,
    faded: 18,
    status: "open",
    daysLeft: 203,
    description: "Polymarket raised $70M Series B and has no token. Active users are clearly farming. The POLY token is inevitable.",
    calls: [],
  },
  {
    id: 3,
    title: "Nigeria's inflation will exceed 35% by December 2026",
    category: "Politics",
    chain: "Base",
    anchorer: "0x7f4a...b3d1",
    tier: "Analyst",
    capital: 80,
    honorStaked: 1200,
    callers: 7,
    proven: 44,
    faded: 56,
    status: "dead_zone",
    daysLeft: 198,
    description: "CBN policy trajectory and naira weakness suggest inflation will remain elevated.",
    calls: [],
  },
  {
    id: 4,
    title: "Hyperliquid Season 2 airdrop by Q3 2026",
    category: "Airdrops",
    chain: "Hyperliquid",
    anchorer: "0x9f3b...a2c1",
    tier: "Steward",
    capital: 800,
    honorStaked: 18200,
    callers: 62,
    proven: 91,
    faded: 9,
    status: "proven",
    daysLeft: 0,
    description: "HYPE Season 2 criteria confirmed by team. Snapshot criteria leaked from Discord mod.",
    calls: [],
  },
];
