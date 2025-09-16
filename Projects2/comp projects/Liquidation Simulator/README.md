# Liquidation Simulator (Read‑Only)

Lab tool to check if targets are currently liquidatable.

## Run

```bash
cp .env.example .env
RPC_URL=http://127.0.0.1:8545
COMET_ADDRESS=0xc3d688B66703497DAA19211EEdff47f25384cdc3

npm install
npm run build
node dist/index.js -t 0x0000000000000000000000000000000000000000
```

Outputs a boolean per account. Pair with a fork + price shocks for scenarios. 