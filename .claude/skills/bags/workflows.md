# Bags.fm Workflow Playbooks

## 1. First-Time Setup

**When**: User has never used the skill before, or .env is missing/incomplete.

1. Run `npx tsx .claude/skills/bags/scripts/setup.ts check` to assess current state
2. If .env missing: run `npx tsx .claude/skills/bags/scripts/setup.ts create-env` to create template
3. Guide user to:
   - Get API key from https://dev.bags.fm (requires connecting a wallet)
   - Either provide their Solana private key (base58) or generate one with `npx tsx .claude/skills/bags/scripts/setup.ts generate-wallet`
   - Set RPC URL (recommend Helius or Triton for production)
4. After .env is configured, run `npx tsx .claude/skills/bags/scripts/wallet-info.ts` to verify
5. Create partner config: `npx tsx .claude/skills/bags/scripts/setup.ts create-partner`

## 2. Launch a Token

**When**: User wants to create and launch a new token on Bags.fm.

**Gather from user**: name, symbol, description, image URL (optional), initial buy amount in SOL, fee sharing setup

1. **Preview first** (always):
   ```
   npx tsx .claude/skills/bags/scripts/launch-token.ts \
     --name "Token Name" \
     --symbol "TKN" \
     --description "Description here" \
     --image-url "https://..." \
     --initial-buy-sol 0.1 \
     --fee-claimers '[{"wallet":"ADDRESS","bps":10000}]'
   ```
2. Present the preview to the user: token details, initial buy, fee share breakdown
3. **Only after user confirms**, re-run with `--confirm`:
   ```
   npx tsx .claude/skills/bags/scripts/launch-token.ts \
     --name "Token Name" --symbol "TKN" --description "..." \
     --initial-buy-sol 0.1 --fee-claimers '[...]' --confirm
   ```

**Fee share tips for the user**:
- BPS must sum to exactly 10,000 (100%)
- 5000 bps = 50%, 2500 bps = 25%, 1000 bps = 10%, etc.
- Default: 100% to launcher if no claimers specified
- Can specify config type: `--config-type DEFAULT` or other types

## 3. Trade Tokens

**When**: User wants to buy or sell tokens.

**Buy shortcut**:
```
npx tsx .claude/skills/bags/scripts/trade.ts --buy TOKEN_MINT --sol 0.5
```

**Sell shortcut**:
```
npx tsx .claude/skills/bags/scripts/trade.ts --sell TOKEN_MINT --amount 1000000
```

**Full format**:
```
npx tsx .claude/skills/bags/scripts/trade.ts \
  --input-mint INPUT_MINT --output-mint OUTPUT_MINT --amount-lamports AMOUNT
```

1. Always run without `--confirm` first to get a quote
2. Present quote to user: input/output amounts, price impact, slippage, warnings
3. **Warn if price impact > 5%**. Strongly discourage if > 10%
4. Only after user confirms, re-run with `--confirm`

## 4. Claim Fees

**When**: User wants to collect earned trading fees.

**Check claimable amounts**:
```
npx tsx .claude/skills/bags/scripts/claim-fees.ts
```

**Claim for specific token**:
```
npx tsx .claude/skills/bags/scripts/claim-fees.ts --token-mint TOKEN_MINT --execute
```

**Claim all**:
```
npx tsx .claude/skills/bags/scripts/claim-fees.ts --execute
```

Always show the preview first, then confirm before executing.

## 5. Claim Partner Fees

**When**: User wants to collect earned partner revenue.

**Check stats**:
```
npx tsx .claude/skills/bags/scripts/claim-partner-fees.ts
```

**Claim**:
```
npx tsx .claude/skills/bags/scripts/claim-partner-fees.ts --execute
```

## 6. Configure Fee Sharing

**When**: User wants to set up or modify fee sharing for a token.

**List tokens where user is admin**:
```
npx tsx .claude/skills/bags/scripts/configure-fee-share.ts --action list-admin
```

**Update fee share config**:
```
npx tsx .claude/skills/bags/scripts/configure-fee-share.ts \
  --action update --token-mint MINT \
  --fee-claimers '[{"wallet":"ADDR1","bps":5000},{"wallet":"ADDR2","bps":5000}]'
```

**Transfer admin**:
```
npx tsx .claude/skills/bags/scripts/configure-fee-share.ts \
  --action transfer-admin --token-mint MINT --new-admin NEW_WALLET
```

Always preview first, confirm before executing. Warn that admin transfer is permanent.

## 7. Analytics & Research

**Leaderboard** (top tokens by lifetime fees):
```
npx tsx .claude/skills/bags/scripts/analytics.ts --action leaderboard --limit 10
```

**Token lifetime fees**:
```
npx tsx .claude/skills/bags/scripts/analytics.ts --action token-fees --token-mint MINT
```

**Token creators**:
```
npx tsx .claude/skills/bags/scripts/analytics.ts --action token-creators --token-mint MINT
```

**Claim stats** (who claimed what):
```
npx tsx .claude/skills/bags/scripts/analytics.ts --action claim-stats --token-mint MINT
```

**Claim events** (history):
```
npx tsx .claude/skills/bags/scripts/analytics.ts --action claim-events --token-mint MINT --limit 20
```

## 8. Check Wallet

**When**: User wants to see their balance, holdings, or overall status.

```
npx tsx .claude/skills/bags/scripts/wallet-info.ts
```

Shows: SOL balance, token holdings, partner stats, claimable positions.
