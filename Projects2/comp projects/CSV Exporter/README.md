# CSV Exporter

Grab market parameters into a tidy CSV for spreadsheets and BI tools.

## Runbook

```bash
cp .env.example .env
RPC_URL=http://127.0.0.1:8545
COMET_ADDRESS=0xc3d688B66703497DAA19211EEdff47f25384cdc3

npm install
npm run build
node dist/index.js --out market.csv
```

First rows look like:

```csv
market_name,market_symbol,market_decimals,index,asset,priceFeed,scale,borrowCollateralFactor,liquidateCollateralFactor,liquidationFactor,supplyCap
"Compound USDC","cUSDCv3",6,0,0x...,0x...,1000000...,5000...,7000...,7500...,1000000...
```

Import into Sheets, Excel, DuckDB, or pandas—your call. 