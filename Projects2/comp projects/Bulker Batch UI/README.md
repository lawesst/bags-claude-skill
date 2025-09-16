# Bulker Batch UI (CLI, Dry‑Run)

Prototype for batching basic actions. Uses callStatic when no key is set.

## Setup

```bash
cp .env.example .env
RPC_URL=http://127.0.0.1:8545
COMET_ADDRESS=0xc3d688B66703497DAA19211EEdff47f25384cdc3
```

## Try it

```bash
npm install
npm run build
# Dry-run supply 1 base unit (adjust decimals to your market)
node dist/index.js -a 0xA0b8...6eB48 -m supply -n 1
```

If you add `PRIVATE_KEY`, it will attempt to send a tx on your network. Start safe on a fork. 