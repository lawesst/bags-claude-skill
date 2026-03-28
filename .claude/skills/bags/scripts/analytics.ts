import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getSDK, getKeypair, output } from "./lib/sdk-init.js";

type Action = "leaderboard" | "token-fees" | "token-creators" | "claim-stats" | "claim-events";

function parseArgs(): { action: Action; tokenMint?: string; limit?: number } {
  const argv = process.argv.slice(2);
  let action: Action = "leaderboard";
  let tokenMint: string | undefined;
  let limit = 20;

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--action":
        action = argv[++i] as Action;
        break;
      case "--token-mint":
        tokenMint = argv[++i];
        break;
      case "--limit":
        limit = parseInt(argv[++i]);
        break;
    }
  }
  return { action, tokenMint, limit };
}

async function main() {
  const { action, tokenMint, limit } = parseArgs();
  const sdk = getSDK();

  switch (action) {
    case "leaderboard": {
      const items = await sdk.state.getTopTokensByLifetimeFees();
      const top = items.slice(0, limit).map((item, i) => ({
        rank: i + 1,
        token: item.tokenInfo?.symbol || item.token.slice(0, 8) + "...",
        mint: item.token,
        lifetimeFees: (Number(item.lifetimeFees) / LAMPORTS_PER_SOL).toFixed(4) + " SOL",
        marketCap: item.tokenInfo?.mcap
          ? "$" + (item.tokenInfo.mcap / 1e6).toFixed(2) + "M"
          : "N/A",
        price: item.tokenLatestPrice
          ? "$" + item.tokenLatestPrice.priceUSD.toFixed(6)
          : "N/A",
        holders: item.tokenInfo?.holderCount ?? "N/A",
      }));
      output({ success: true, action: "leaderboard", tokens: top });
      break;
    }

    case "token-fees": {
      if (!tokenMint) {
        output({ success: false, error: "Missing --token-mint" });
        process.exit(1);
      }
      const fees = await sdk.state.getTokenLifetimeFees(new PublicKey(tokenMint));
      output({
        success: true,
        action: "token-fees",
        tokenMint,
        lifetimeFees: (fees / LAMPORTS_PER_SOL).toFixed(6) + " SOL",
        lifetimeFeesLamports: fees,
      });
      break;
    }

    case "token-creators": {
      if (!tokenMint) {
        output({ success: false, error: "Missing --token-mint" });
        process.exit(1);
      }
      const creators = await sdk.state.getTokenCreators(new PublicKey(tokenMint));
      output({
        success: true,
        action: "token-creators",
        tokenMint,
        creators: creators.map((c) => ({
          username: c.providerUsername || c.username,
          provider: c.provider,
          wallet: c.wallet,
          royaltyBps: c.royaltyBps,
          royaltyPct: (c.royaltyBps / 100).toFixed(2) + "%",
          isCreator: c.isCreator,
          isAdmin: c.isAdmin,
        })),
      });
      break;
    }

    case "claim-stats": {
      if (!tokenMint) {
        output({ success: false, error: "Missing --token-mint" });
        process.exit(1);
      }
      const stats = await sdk.state.getTokenClaimStats(new PublicKey(tokenMint));
      output({
        success: true,
        action: "claim-stats",
        tokenMint,
        claimers: stats.map((s) => ({
          username: s.providerUsername || s.username,
          provider: s.provider,
          wallet: s.wallet,
          royaltyBps: s.royaltyBps,
          royaltyPct: (s.royaltyBps / 100).toFixed(2) + "%",
          totalClaimed: (Number(s.totalClaimed) / LAMPORTS_PER_SOL).toFixed(6) + " SOL",
          isCreator: s.isCreator,
        })),
      });
      break;
    }

    case "claim-events": {
      if (!tokenMint) {
        output({ success: false, error: "Missing --token-mint" });
        process.exit(1);
      }
      const events = await sdk.state.getTokenClaimEvents(new PublicKey(tokenMint), {
        limit: limit,
      });
      output({
        success: true,
        action: "claim-events",
        tokenMint,
        events: events.map((e) => ({
          wallet: e.wallet,
          amount: (Number(e.amount) / LAMPORTS_PER_SOL).toFixed(6) + " SOL",
          isCreator: e.isCreator,
          signature: e.signature,
          timestamp: new Date(e.timestamp * 1000).toISOString(),
        })),
      });
      break;
    }

    default:
      output({
        success: false,
        error: `Unknown action: ${action}`,
        validActions: ["leaderboard", "token-fees", "token-creators", "claim-stats", "claim-events"],
      });
  }
}

main().catch((err) => {
  console.error(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
});
