# Bags Claude Skill

A Claude Code skill that turns Claude into a Bags.fm operations expert. Launch tokens, trade, configure fee sharing, and claim fees — all through natural language in your terminal.

## What It Does

Instead of learning the Bags.fm API, just tell Claude what you want:

```
/bags launch a meme token called MOON with 50/50 fee split between me and @alice
/bags buy 0.5 SOL of MOON
/bags show my claimable fees
/bags claim all fees
/bags show the top tokens by lifetime fees
```

Claude handles the multi-step orchestration, presents human-readable confirmations, and executes transactions only after your approval.

## Why a Skill, Not an MCP Server?

| Feature | MCP Server | This Skill |
|---------|-----------|------------|
| Integration | 46 raw API tools dumped into context | Domain knowledge + workflow orchestration |
| UX | Raw JSON output | "Swap 0.5 SOL for ~12K TOKEN (0.3% impact). Proceed?" |
| Safety | None | Confirms txs, warns on high price impact, redacts keys |
| Setup | Manual config | Auto-detects state, guides you through onboarding |
| Revenue | Manual | Auto partner config — earn 25% of trading fees |
| Infrastructure | Run an MCP server | Zero infra — just files in `.claude/skills/` |

## Quick Start

### 1. Install

```bash
git clone https://github.com/lawesst/bags-claude-skill.git
cd bags-claude-skill
npm install
```

### 2. Open in Claude Code

```bash
claude
```

### 3. Set Up

```
/bags setup
```

Claude will guide you through:
- Getting an API key from [dev.bags.fm](https://dev.bags.fm)
- Configuring your Solana wallet
- Setting up your partner config (starts earning 25% of trading fees)

### 4. Use It

```
/bags launch a token called TEST with symbol TST and description "Just testing"
/bags buy 0.1 SOL of <TOKEN_MINT>
/bags check my wallet
/bags show leaderboard
/bags claim fees
```

## Available Commands

| Command | What It Does |
|---------|-------------|
| `/bags setup` | Configure API key, wallet, partner config |
| `/bags launch ...` | Create and deploy a new token |
| `/bags buy/sell ...` | Trade tokens with quote preview |
| `/bags claim fees` | Discover and claim earned trading fees |
| `/bags claim partner fees` | Claim partner program revenue |
| `/bags configure fee share ...` | Set up or modify fee sharing |
| `/bags show wallet` | Balance, holdings, claimable positions |
| `/bags show leaderboard` | Top tokens by lifetime fees |
| `/bags show token stats <mint>` | Creators, fees, claim history |

## Architecture

```
.claude/skills/bags/
├── SKILL.md              # Main skill — Claude reads this first
├── api-reference.md      # SDK/API reference for Claude's knowledge
├── workflows.md          # Step-by-step playbooks
└── scripts/
    ├── lib/
    │   ├── sdk-init.ts   # Shared SDK initialization
    │   └── display.ts    # Formatting helpers
    ├── setup.ts          # Onboarding flow
    ├── wallet-info.ts    # Wallet status
    ├── launch-token.ts   # Token launch pipeline
    ├── trade.ts          # Trading with quote preview
    ├── claim-fees.ts     # Fee claiming
    ├── claim-partner-fees.ts
    ├── configure-fee-share.ts
    └── analytics.ts      # Leaderboards, stats, history
```

**How it works**: SKILL.md gives Claude domain expertise about Bags.fm. When you ask Claude to do something, it reads the workflow playbooks, runs the appropriate TypeScript script, parses the JSON output, and presents a human-readable summary. Transactions always require your explicit confirmation.

## Partner Fee Revenue

Every operation through this skill routes through the Bags partner program:
- **25% of all trading fees** on trades executed through the skill
- Automatic partner config creation during setup
- Claim partner fees anytime with `/bags claim partner fees`

## Tech Stack

- **Claude Code Skills** — markdown-based skill system with dynamic context injection
- **@bagsfm/bags-sdk** — official Bags.fm TypeScript SDK
- **@solana/web3.js** — Solana blockchain interaction
- **tsx** — zero-config TypeScript execution
- **zod** — runtime environment validation

## License

MIT
