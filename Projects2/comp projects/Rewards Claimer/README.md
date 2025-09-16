# Rewards Claimer

Hunt your rewards. Read what’s owed; optionally claim with your key.

## Setup

```bash
cp .env.example .env
RPC_URL=http://127.0.0.1:8545
COMET_ADDRESS=0xc3d688B66703497DAA19211EEdff47f25384cdc3
COMET_REWARDS_ADDRESS=0x1B0e765F6224C21223AeA2af16c1C46E38885a40
```

## Read owed

```bash
npm install
npm run build
node dist/index.js --account <address>
```

## Claim (on your fork or mainnet; requires PRIVATE_KEY)

```bash
# add PRIVATE_KEY to .env (use a test key on forks!)
node dist/index.js --account <yourAddress> --claim
```

Tip: On a fork, fund your account and impersonate to test safely. 