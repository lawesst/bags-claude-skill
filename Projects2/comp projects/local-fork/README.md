# Local Hardhat Mainnet Fork

## Setup

1. Copy `.env.example` to `.env` and set `MAINNET_RPC_URL`.
2. Install dependencies:

```bash
npm install
```

3. Start a local mainnet fork:

```bash
npm run node
```

This spins up a JSON-RPC node at `http://127.0.0.1:8545` impersonating Ethereum mainnet. Use it as `RPC_URL` in the app `.env`. 