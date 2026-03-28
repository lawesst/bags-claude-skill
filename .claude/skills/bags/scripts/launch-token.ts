import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getSDK, getKeypair, getConnection, output } from "./lib/sdk-init.js";
import { WRAPPED_SOL_MINT } from "@bagsfm/bags-sdk";

interface LaunchArgs {
  name: string;
  symbol: string;
  description: string;
  imageUrl?: string;
  initialBuySol?: number;
  feeClaimers?: Array<{ wallet: string; bps: number }>;
  bagsConfigType?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  confirm?: boolean;
}

function parseArgs(): LaunchArgs {
  const args: LaunchArgs = { name: "", symbol: "", description: "" };
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--name":
        args.name = argv[++i];
        break;
      case "--symbol":
        args.symbol = argv[++i];
        break;
      case "--description":
        args.description = argv[++i];
        break;
      case "--image-url":
        args.imageUrl = argv[++i];
        break;
      case "--initial-buy-sol":
        args.initialBuySol = parseFloat(argv[++i]);
        break;
      case "--fee-claimers":
        args.feeClaimers = JSON.parse(argv[++i]);
        break;
      case "--config-type":
        args.bagsConfigType = argv[++i];
        break;
      case "--twitter":
        args.twitter = argv[++i];
        break;
      case "--telegram":
        args.telegram = argv[++i];
        break;
      case "--website":
        args.website = argv[++i];
        break;
      case "--confirm":
        args.confirm = true;
        break;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs();
  const sdk = getSDK();
  const keypair = getKeypair();
  const connection = getConnection();
  const wallet = keypair.publicKey;

  if (!args.name || !args.symbol || !args.description) {
    output({
      success: false,
      error: "Missing required fields: --name, --symbol, --description",
    });
    process.exit(1);
  }

  // Step 1: Create token info and metadata
  const tokenInfoParams: any = {
    name: args.name,
    symbol: args.symbol.toUpperCase(),
    description: args.description,
    ...(args.twitter && { twitter: args.twitter }),
    ...(args.telegram && { telegram: args.telegram }),
    ...(args.website && { website: args.website }),
  };

  if (args.imageUrl) {
    tokenInfoParams.imageUrl = args.imageUrl;
  }

  const tokenInfo = await sdk.tokenLaunch.createTokenInfoAndMetadata(tokenInfoParams);

  // Step 2: Configure fee sharing
  const initialBuyLamports = Math.floor((args.initialBuySol || 0.01) * LAMPORTS_PER_SOL);

  // Default: 100% to the launcher if no claimers specified
  const feeClaimers = args.feeClaimers
    ? args.feeClaimers.map((c) => ({
        user: new PublicKey(c.wallet),
        userBps: c.bps,
      }))
    : [{ user: wallet, userBps: 10000 }];

  // Validate BPS sum
  const totalBps = feeClaimers.reduce((sum, c) => sum + c.userBps, 0);
  if (totalBps !== 10000) {
    output({
      success: false,
      error: `Fee claimer BPS must sum to 10000, got ${totalBps}`,
      feeClaimers: feeClaimers.map((c) => ({
        wallet: c.user.toBase58(),
        bps: c.userBps,
        pct: (c.userBps / 100).toFixed(2) + "%",
      })),
    });
    process.exit(1);
  }

  const tokenMint = new PublicKey(tokenInfo.tokenMint);

  if (!args.confirm) {
    // Dry run — output plan for Claude to present to user
    output({
      success: true,
      action: "preview",
      token: {
        name: args.name,
        symbol: args.symbol.toUpperCase(),
        description: args.description,
        mint: tokenInfo.tokenMint,
        metadata: tokenInfo.tokenMetadata,
      },
      initialBuy: {
        sol: initialBuyLamports / LAMPORTS_PER_SOL,
        lamports: initialBuyLamports,
      },
      feeShare: feeClaimers.map((c) => ({
        wallet: c.user.toBase58(),
        bps: c.userBps,
        pct: (c.userBps / 100).toFixed(2) + "%",
      })),
      configType: args.bagsConfigType || "DEFAULT",
      hint: "Re-run with --confirm to execute the launch",
    });
    return;
  }

  // Step 3: Create fee share config
  const configResult = await sdk.config.createBagsFeeShareConfig({
    feeClaimers,
    payer: wallet,
    baseMint: tokenMint,
    ...(args.bagsConfigType && { bagsConfigType: args.bagsConfigType as any }),
  });

  // Sign and send config transactions
  for (const bundle of configResult.bundles) {
    for (const tx of bundle) {
      tx.sign([keypair]);
      const sig = await connection.sendTransaction(tx);
      await connection.confirmTransaction(sig, "confirmed");
    }
  }
  for (const tx of configResult.transactions) {
    tx.sign([keypair]);
    const sig = await connection.sendTransaction(tx);
    await connection.confirmTransaction(sig, "confirmed");
  }

  // Step 4: Create launch transaction
  const launchTx = await sdk.tokenLaunch.createLaunchTransaction({
    metadataUrl: tokenInfo.tokenMetadata,
    tokenMint,
    launchWallet: wallet,
    initialBuyLamports,
    configKey: configResult.meteoraConfigKey,
  });

  launchTx.sign([keypair]);
  const launchSig = await connection.sendTransaction(launchTx);
  await connection.confirmTransaction(launchSig, "confirmed");

  output({
    success: true,
    action: "launched",
    token: {
      name: args.name,
      symbol: args.symbol.toUpperCase(),
      mint: tokenInfo.tokenMint,
      metadata: tokenInfo.tokenMetadata,
    },
    configKey: configResult.meteoraConfigKey.toBase58(),
    launchSignature: launchSig,
    initialBuySol: initialBuyLamports / LAMPORTS_PER_SOL,
    feeShare: feeClaimers.map((c) => ({
      wallet: c.user.toBase58(),
      bps: c.userBps,
    })),
    viewUrl: `https://bags.fm/${args.symbol.toLowerCase()}`,
  });
}

main().catch((err) => {
  console.error(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
});
