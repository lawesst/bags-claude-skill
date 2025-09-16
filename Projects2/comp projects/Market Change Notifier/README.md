# Market Change Notifier

Keep a pulse on utilization and caps. Think of it as a pager for parameters.

## Usage

1. Env
```bash
cp .env.example .env
RPC_URL=http://127.0.0.1:8545
COMET_ADDRESS=0xc3d688B66703497DAA19211EEdff47f25384cdc3
```

2. Install & run
```bash
npm install
# one iteration @ 1s for a smoke test
node dist/index.js -n 1 -i 1
# watch forever, alert on ≥1% util delta
node dist/index.js -n 0 -i 5 -t 1
```

## Output
- Logs initial utilization
- Prints utilization changes over threshold
- Announces supply cap changes per asset

Pipe to your favorite notifier (Slack/Telegram) later. 