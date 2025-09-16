# APY & Utilization Mini‑Dashboard

Tiny terminal dashboard for Compound v3 markets. One glance = market pulse.

## Quickstart

1) Copy env and set values

```bash
cp .env.example .env
# RPC of your choice (local fork or provider)
RPC_URL=http://127.0.0.1:8545
# USDC market proxy (mainnet)
COMET_ADDRESS=0xc3d688B66703497DAA19211EEdff47f25384cdc3
```

2) Install & run

```bash
npm install
npm run dev
```

You’ll see:

```text
Chain: 31337
Comet: 0xc3d6...cdc3
Utilization: 0.90...
Borrow rate (raw): 1755216536
Supply rate (raw): 1459583920
```

## Notes
- Works read‑only; no private key needed.
- Raw rates are protocol units. Convert to APY in your app as needed.
- Pairs well with a mainnet fork for deterministic output. 