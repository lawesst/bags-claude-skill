# Comet CLI

Swiss‑army knife for quick market/account reads.

## Setup

```bash
cp .env.example .env
RPC_URL=http://127.0.0.1:8545
COMET_ADDRESS=0xc3d688B66703497DAA19211EEdff47f25384cdc3
npm install && npm run build
```

## Commands

- Market snapshot
```bash
node dist/index.js market
```

- Account balances
```bash
node dist/index.js account -a 0x0000000000000000000000000000000000000000
```

Pro‑tip: combine with `jq` for automation. 