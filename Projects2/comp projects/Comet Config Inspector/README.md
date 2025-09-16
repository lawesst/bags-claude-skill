# Comet Config Inspector

Peek under the hood: decode base metadata and all collateral configs.

## Field Manual

1. Configure environment

```bash
cp .env.example .env
RPC_URL=http://127.0.0.1:8545
COMET_ADDRESS=0xc3d688B66703497DAA19211EEdff47f25384cdc3
```

2. Install + launch

```bash
npm install
npm run dev
```

3. Output (snippet)

```json
{
  "name": "Compound USDC",
  "symbol": "cUSDCv3",
  "decimals": 6,
  "numAssets": 12
}
```

Each asset shows `asset`, `priceFeed`, `scale`, factors, and `supplyCap` for quick audits.

## Tips
- Point `RPC_URL` to mainnet or your fork for reproducible numbers.
- Pipe output to `jq` for scripting: `npm run dev | jq '.'`. 