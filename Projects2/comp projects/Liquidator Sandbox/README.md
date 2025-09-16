# Liquidator Sandbox

Practice liquidation mechanics safely: encode `absorb` and `buyCollateral` calls.

## Configure

```bash
cp .env.example .env
RPC_URL=http://127.0.0.1:8545
COMET_ADDRESS=0xc3d688B66703497DAA19211EEdff47f25384cdc3
```

## Encode calls

- Absorb (targets comma‑separated)
```bash
npm install && npm run build
node dist/index.js -m absorb --absorber 0x0000...dead --targets 0x0000...0000
```

- Buy collateral
```bash
node dist/index.js -m buy \
  --asset 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 \
  --min 0 \
  --base 10 \
  --to 0x0000...dead
```

Outputs `to` and `data`. Use with your favorite bundler/signer on a fork. 