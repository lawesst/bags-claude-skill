# Compound v3 Tool Scaffold

This project is preconfigured for interacting with Compound v3 (Comet) using TypeScript and ethers v6.

## Setup

1. Copy `.env.example` to `.env` and fill values:
   - `RPC_URL` (required)
   - `PRIVATE_KEY` (optional)
   - `COMET_ADDRESS` (optional)
   - `COMET_REWARDS_ADDRESS` (optional)

2. Install dependencies:

```bash
npm install
```

3. Run in dev (TS) or build and start (JS):

```bash
npm run dev
# or
npm run build && npm start
```

## Notes
- If `COMET_ADDRESS` is not set, the app connects read-only to the RPC and exits after showing chain info.
- Add your logic in `src/index.ts` or additional modules. 