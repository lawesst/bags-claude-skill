# Borrow Limit What‑If Calculator

Model your borrow limit with quick what‑ifs. Great for planning and demos.

## Configure

```bash
cp .env.example .env
RPC_URL=http://127.0.0.1:8545
COMET_ADDRESS=0xc3d688B66703497DAA19211EEdff47f25384cdc3
```

## Examples

- 1 WETH as collateral, override price to $2500

```bash
npm install
npm run build
node dist/index.js \
  -c 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2:1 \
  -p 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2:2500
```

- Multiple collaterals

```bash
node dist/index.js \
  -c 0xC02a...C756Cc2:0.5 \
  -c 0x2260...C599:0.01 \
  -p 0x2260...C599:65000
```

Outputs an estimated borrow capacity (base units). Treat as a quick estimate, not exact risk math. 