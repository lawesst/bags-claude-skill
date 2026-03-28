import { PublicKey } from "@solana/web3.js";
import { getSDK, getKeypair, getConnection, output } from "./lib/sdk-init.js";
import type { BagsFeeClaimer } from "@bagsfm/bags-sdk";

interface ConfigArgs {
  action: "create" | "update" | "transfer-admin" | "list-admin";
  tokenMint?: string;
  feeClaimers?: Array<{ wallet: string; bps: number }>;
  newAdmin?: string;
  bagsConfigType?: string;
  confirm?: boolean;
}

function parseArgs(): ConfigArgs {
  const args: ConfigArgs = { action: "create" };
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--action":
        args.action = argv[++i] as ConfigArgs["action"];
        break;
      case "--token-mint":
        args.tokenMint = argv[++i];
        break;
      case "--fee-claimers":
        args.feeClaimers = JSON.parse(argv[++i]);
        break;
      case "--new-admin":
        args.newAdmin = argv[++i];
        break;
      case "--config-type":
        args.bagsConfigType = argv[++i];
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

  if (args.action === "list-admin") {
    const mints = await sdk.feeShareAdmin.getAdminTokenMints(wallet);
    output({
      success: true,
      action: "list-admin",
      wallet: wallet.toBase58(),
      tokenMints: mints,
      count: mints.length,
    });
    return;
  }

  if (!args.tokenMint) {
    output({ success: false, error: "Missing --token-mint" });
    process.exit(1);
  }

  const baseMint = new PublicKey(args.tokenMint);

  if (args.action === "transfer-admin") {
    if (!args.newAdmin) {
      output({ success: false, error: "Missing --new-admin for transfer" });
      process.exit(1);
    }

    if (!args.confirm) {
      output({
        success: true,
        action: "preview-transfer",
        tokenMint: args.tokenMint,
        currentAdmin: wallet.toBase58(),
        newAdmin: args.newAdmin,
        warning: "This will permanently transfer fee share admin control",
        hint: "Re-run with --confirm to execute",
      });
      return;
    }

    const { transaction, blockhash } = await sdk.feeShareAdmin.getTransferAdminTransaction({
      baseMint,
      currentAdmin: wallet,
      newAdmin: new PublicKey(args.newAdmin),
      payer: wallet,
    });
    transaction.sign([keypair]);
    const sig = await connection.sendTransaction(transaction);
    await connection.confirmTransaction({ signature: sig, ...blockhash }, "confirmed");

    output({
      success: true,
      action: "admin-transferred",
      tokenMint: args.tokenMint,
      newAdmin: args.newAdmin,
      signature: sig,
    });
    return;
  }

  // Create or Update fee share config
  if (!args.feeClaimers || args.feeClaimers.length === 0) {
    output({ success: false, error: "Missing --fee-claimers (JSON array of {wallet, bps})" });
    process.exit(1);
  }

  const feeClaimers: BagsFeeClaimer[] = args.feeClaimers.map((c) => ({
    user: new PublicKey(c.wallet),
    userBps: c.bps,
  }));

  const totalBps = feeClaimers.reduce((sum, c) => sum + c.userBps, 0);
  if (totalBps !== 10000) {
    output({
      success: false,
      error: `Fee claimer BPS must sum to 10000, got ${totalBps}`,
    });
    process.exit(1);
  }

  if (!args.confirm) {
    output({
      success: true,
      action: `preview-${args.action}`,
      tokenMint: args.tokenMint,
      feeClaimers: args.feeClaimers.map((c) => ({
        ...c,
        pct: (c.bps / 100).toFixed(2) + "%",
      })),
      hint: "Re-run with --confirm to execute",
    });
    return;
  }

  if (args.action === "update") {
    const updateTxs = await sdk.feeShareAdmin.getUpdateConfigTransactions({
      feeClaimers,
      payer: wallet,
      baseMint,
    });

    const signatures: string[] = [];
    for (const { transaction, blockhash } of updateTxs) {
      transaction.sign([keypair]);
      const sig = await connection.sendTransaction(transaction);
      await connection.confirmTransaction({ signature: sig, ...blockhash }, "confirmed");
      signatures.push(sig);
    }

    output({
      success: true,
      action: "config-updated",
      tokenMint: args.tokenMint,
      signatures,
    });
  } else {
    // Create new config
    const configResult = await sdk.config.createBagsFeeShareConfig({
      feeClaimers,
      payer: wallet,
      baseMint,
      ...(args.bagsConfigType && { bagsConfigType: args.bagsConfigType as any }),
    });

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

    output({
      success: true,
      action: "config-created",
      tokenMint: args.tokenMint,
      configKey: configResult.meteoraConfigKey.toBase58(),
    });
  }
}

main().catch((err) => {
  console.error(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
});
