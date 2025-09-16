# Risk Parameters Explorer

Your fast lane to market risk: utilization, curve params, and per‑asset limits.

## Spin it up

```bash
cp .env.example .env
# choose your node (fork or hosted)
RPC_URL=http://127.0.0.1:8545
COMET_ADDRESS=0xc3d688B66703497DAA19211EEdff47f25384cdc3

npm install
npm run dev
```

What you get:
- Live utilization (18‑dec fixed‑point)
- Rate curve raw params (baseRate, slopes, kink)
- Per‑asset factors + caps (+ spot price if available)

## Handy
- Pipe to CSV later or snapshot to files for governance reviews.
- Use alongside the CSV Exporter for spreadsheet‑ready data. 