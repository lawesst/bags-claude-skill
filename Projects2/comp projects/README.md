# Compound v3 Hackathon Toolkit

Fifteen bite‑size tools for Compound v3 (Comet), each in its own folder. Point `.env` in each project to your node (`RPC_URL`) and market proxy (`COMET_ADDRESS`).

## Local mainnet fork (optional)

```bash
cd "local-fork"
npm install
npm run node
# RPC: http://127.0.0.1:8545
```

## Projects

- [APY & Utilization Mini‑Dashboard](./APY%20%26%20Utilization%20Mini%E2%80%91Dashboard/) — quick market pulse (utilization + raw rates)
  - Run: `cd "APY & Utilization Mini‑Dashboard" && npm run dev`
- [Comet Config Inspector](./Comet%20Config%20Inspector/) — base metadata + all collateral configs
  - Run: `cd "Comet Config Inspector" && npm run dev`
- [Risk Parameters Explorer](./Risk%20Parameters%20Explorer/) — utilization, curve params, per‑asset factors/caps
  - Run: `cd "Risk Parameters Explorer" && npm run dev`
- [Market Change Notifier](./Market%20Change%20Notifier/) — logs utilization and cap changes
  - Run: `cd "Market Change Notifier" && node dist/index.js -n 1 -i 1`
- [CSV Exporter](./CSV%20Exporter/) — export market params to CSV
  - Run: `cd "CSV Exporter" && node dist/index.js --out market.csv`
- [Rewards Claimer](./Rewards%20Claimer/) — read owed; optional claim with PRIVATE_KEY
  - Run: `cd "Rewards Claimer" && node dist/index.js --account <address>`
- [Comet CLI](./Comet%20CLI/) — market snapshot + account balances
  - Run: `cd "Comet CLI" && node dist/index.js market`
- [Borrow Limit What‑If Calculator](./Borrow%20Limit%20What%E2%80%91If%20Calculator/) — estimate capacity from chosen collateral
  - Run: `cd "Borrow Limit What‑If Calculator" && node dist/index.js -c <asset>:<amount> -p <asset>:<price>`
- [Health Monitor & Alerts](./Health%20Monitor%20%26%20Alerts/) — check account health + non‑zero collateral
  - Run: `cd "Health Monitor & Alerts" && node dist/index.js -a <address>`
- [Liquidation Simulator](./Liquidation%20Simulator/) — read‑only: is target liquidatable now?
  - Run: `cd "Liquidation Simulator" && node dist/index.js -t <address>`
- [Liquidator Sandbox](./Liquidator%20Sandbox/) — encode `absorb`/`buyCollateral` call data
  - Run: `cd "Liquidator Sandbox" && node dist/index.js -m absorb --absorber <addr> --targets <a,b>`
- [Oracle Deviation Watchdog](./Oracle%20Deviation%20Watchdog/) — compare Comet oracle vs UniswapV2 USDC
  - Run: `cd "Oracle Deviation Watchdog" && node dist/index.js`
- [Bulker Batch UI](./Bulker%20Batch%20UI/) — dry‑run supply/withdraw (callStatic without key)
  - Run: `cd "Bulker Batch UI" && node dist/index.js -a <asset> -m supply -n 1`
- [Safe Withdraw & Repay Wizard](./Safe%20Withdraw%20%26%20Repay%20Wizard/) — conservative suggestions
  - Run: `cd "Safe Withdraw & Repay Wizard" && node dist/index.js -a <address>`
- [Embeddable Widgets](./Embeddable%20Widgets/) — generate `health-widget.html` (utilization bar)
  - Run: `cd "Embeddable Widgets" && node dist/index.js`

## Env quick reference (per project)

```
RPC_URL=http://127.0.0.1:8545
COMET_ADDRESS=0xc3d688B66703497DAA19211EEdff47f25384cdc3
# Optional per-tool
COMET_REWARDS_ADDRESS=0x1B0e765F6224C21223AeA2af16c1C46E38885a40
PRIVATE_KEY= # only for tx‑sending tools
``` 