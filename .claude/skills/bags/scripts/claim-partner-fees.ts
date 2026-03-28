import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getSDK, getKeypair, getConnection, output } from "./lib/sdk-init.js";

async function main() {
  const sdk = getSDK();
  const keypair = getKeypair();
  const connection = getConnection();
  const wallet = keypair.publicKey;
  const execute = process.argv.includes("--execute");

  // Get partner stats
  let stats;
  try {
    stats = await sdk.partner.getPartnerConfigClaimStats(wallet);
  } catch (err: any) {
    output({
      success: false,
      error: "No partner config found for this wallet",
      hint: "Run /bags setup to create a partner config and start earning 25% of trading fees",
      wallet: wallet.toBase58(),
    });
    process.exit(1);
  }

  const claimed = Number(stats.claimedFees) / LAMPORTS_PER_SOL;
  const unclaimed = Number(stats.unclaimedFees) / LAMPORTS_PER_SOL;

  if (!execute) {
    output({
      success: true,
      action: "preview",
      wallet: wallet.toBase58(),
      claimedFees: claimed.toFixed(6) + " SOL",
      unclaimedFees: unclaimed.toFixed(6) + " SOL",
      totalLifetimeFees: (claimed + unclaimed).toFixed(6) + " SOL",
      hint: unclaimed > 0
        ? "Re-run with --execute to claim your partner fees"
        : "No unclaimed partner fees at this time",
    });
    return;
  }

  if (unclaimed <= 0) {
    output({
      success: true,
      action: "nothing_to_claim",
      message: "No unclaimed partner fees",
      wallet: wallet.toBase58(),
    });
    return;
  }

  // Claim partner fees
  const claimTxs = await sdk.partner.getPartnerConfigClaimTransactions(wallet);
  const signatures: string[] = [];

  for (const { transaction, blockhash } of claimTxs) {
    transaction.sign([keypair]);
    const sig = await connection.sendTransaction(transaction);
    await connection.confirmTransaction(
      { signature: sig, ...blockhash },
      "confirmed"
    );
    signatures.push(sig);
  }

  output({
    success: true,
    action: "claimed",
    wallet: wallet.toBase58(),
    claimedAmount: unclaimed.toFixed(6) + " SOL",
    signatures,
  });
}

main().catch((err) => {
  console.error(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
});
