# Bags.fm API & SDK Reference

## Platform Overview

Bags.fm is a Solana-based token launchpad where creators earn 1% from every trade. Tokens launch on Meteora Dynamic Bonding Curves (DBC) and graduate to DAMM v2 AMM pools.

**Key concepts:**
- **Token Launch**: Create a token with metadata → configure fee sharing → deploy on bonding curve
- **Fee Sharing**: Up to 100 fee claimers per token, each assigned basis points (BPS). Must sum to exactly 10,000 (100%)
- **Partner Program**: Apps that facilitate trades earn 25% of trading fees (2,500 BPS default)
- **Token Lifecycle**: PRE_LAUNCH → PRE_GRAD (bonding curve) → MIGRATING → MIGRATED (AMM pool)

## SDK: @bagsfm/bags-sdk

### Initialization
```typescript
import { BagsSDK } from "@bagsfm/bags-sdk";
const sdk = new BagsSDK(apiKey, connection, commitment?);
```

### Services

| Service | Access | Purpose |
|---------|--------|---------|
| `sdk.tokenLaunch` | Token creation & launch | createTokenInfoAndMetadata, createLaunchTransaction |
| `sdk.trade` | Trading | getQuote, createSwapTransaction |
| `sdk.fee` | Fee claiming | getAllClaimablePositions, getClaimTransactions |
| `sdk.config` | Fee share config | createBagsFeeShareConfig, getConfigCreationLookupTableTransactions |
| `sdk.partner` | Partner program | getPartnerConfig, getPartnerConfigCreationTransaction, getPartnerConfigClaimStats, getPartnerConfigClaimTransactions |
| `sdk.state` | Read-only queries | getTokenLifetimeFees, getTokenCreators, getTopTokensByLifetimeFees, getTokenClaimStats, getTokenClaimEvents, getLaunchWalletV2 |
| `sdk.feeShareAdmin` | Admin operations | getAdminTokenMints, getTransferAdminTransaction, getUpdateConfigTransactions |
| `sdk.solana` | Transaction submission | sendBundle, getBundleStatuses, getJitoRecentFees |
| `sdk.dexscreener` | Dexscreener listing | createOrder, checkAvailability, submitPayment |

## Key Constraints

- **Token name**: max 32 chars
- **Token symbol**: max 10 chars, auto-uppercased
- **Description**: max 1000 chars
- **Fee claimers**: max 100 per token, BPS must sum to exactly 10,000
- **Lookup tables**: auto-created when >15 fee claimers (BAGS_FEE_SHARE_V2_MAX_CLAIMERS_NON_LUT = 15)
- **Partner key**: one per wallet
- **Rate limit**: 1,000 requests/hour per user and per IP
- **API key**: from dev.bags.fm, header `x-api-key`

## Fee Config Types

| Type | Pre-Migration | Post-Migration | Use Case |
|------|---------------|----------------|----------|
| DEFAULT | 2% (1% protocol, 1% creator) | 2% | Simple, predictable |
| Low Pre / High Post | 0.25% | 1% + 0.5% compounding | Encourage early volume |
| High Pre / Low Post | 1% | 0.25% + 0.125% compounding | Maximize early revenue |
| High Flat + Compounding | 10% | 10% + 5% compounding | Maximum fee + liquidity |

Config type IDs:
- `DEFAULT`: `fa29606e-5e48-4c37-827f-4b03d58ee23d`
- `BPS25PRE_BPS100POST_5000_COMPOUNDING`: `d16d3585-6488-4a6c-9a6f-e6c39ca0fda3`
- `BPS100PRE_BPS25POST_5000_COMPOUNDING`: `a7c8e1f2-3d4b-5a6c-9e0f-1b2c3d4e5f6a`
- `BPS1000PRE_BPS1000POST_5000_COMPOUNDING`: `48e26d2f-0a9d-4625-a3cc-c3987d874b9e`

## Social Providers

Supported for fee claimers: `twitter`, `tiktok`, `kick`, `github`
All providers: `apple`, `google`, `email`, `solana`, `twitter`, `tiktok`, `kick`, `instagram`, `onlyfans`, `github`

## Program IDs

| Program | Address |
|---------|---------|
| Bags Fee Share V2 | `FEE2tBhCKAt7shrod19QttSVREUYPiyMzoku1mL1gqVK` |
| Bags Fee Share V1 (legacy) | `FEEhPbKVKnco9EXnaY3i4R5rQVUx91wgVfu8qokixywi` |
| Meteora DAMM v2 | `cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG` |
| Meteora DBC | `dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN` |

## Wrapped SOL Mint

`So11111111111111111111111111111111111111112`

## Common Patterns

### Signing and sending transactions
```typescript
// VersionedTransaction
tx.sign([keypair]);
const sig = await connection.sendTransaction(tx);
await connection.confirmTransaction(sig, "confirmed");

// Transaction (legacy, used by fee claims)
tx.sign(keypair);  // Note: no array wrapper for legacy Transaction
const sig = await connection.sendTransaction(tx);
```

### Jito bundles (for atomic multi-tx execution)
```typescript
const bundleId = await sdk.solana.sendBundle(signedTransactions);
const status = await sdk.solana.getBundleStatuses([bundleId]);
```
