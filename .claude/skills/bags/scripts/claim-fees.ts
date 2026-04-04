import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getSDK, getKeypair, getConnection, output } from "./lib/sdk-init.js";

async function main() {
  const sdk = getSDK();
  const keypair = getKeypair();
  const connection = getConnection();
  const wallet = keypair.publicKey;

  const tokenMintFilter = process.argv.find((a) => a.startsWith("--token-mint"))
    ? process.argv[process.argv.indexOf("--token-mint") + 1]
    : null;
  const execute = process.argv.includes("--execute");

  // Discover all claimable positions
  const positions = await sdk.fee.getAllClaimablePositions(wallet);
  const claimable = positions
    .filter((p) => p.totalClaimableLamportsUserShare > 0)
    .filter((p) => !tokenMintFilter || p.baseMint === tokenMintFilter);

  if (claimable.length === 0) {
    output({
      success: true,
      action: "check",
      message: "No claimable fees found",
      wallet: wallet.toBase58(),
    });
    return;
  }

  const totalLamports = claimable.reduce(
    (sum, p) => sum + p.totalClaimableLamportsUserShare,
    0
  );

  const summary = claimable.map((p) => ({
    baseMint: p.baseMint,
    claimableSol: (p.totalClaimableLamportsUserShare / LAMPORTS_PER_SOL).toFixed(6),
    claimableLamports: p.totalClaimableLamportsUserShare,
    isMigrated: "isMigrated" in p ? p.isMigrated : undefined,
    isCustomFeeVault: p.isCustomFeeVault,
  }));

  if (!execute) {
    output({
      success: true,
      action: "preview",
      wallet: wallet.toBase58(),
      positions: summary,
      totalClaimable: (totalLamports / LAMPORTS_PER_SOL).toFixed(6) + " SOL",
      hint: "Re-run with --execute to claim all fees",
    });
    return;
  }

  // Claim each position
  const results: Array<{ baseMint: string; signature?: string; error?: string }> = [];

  for (const position of claimable) {
    try {
      const txs = await sdk.fee.getClaimTransactions(
        wallet,
        new PublicKey(position.baseMint)
      );
      for (const tx of txs) {
        tx.sign(keypair);
        const sig = await connection.sendTransaction(tx as any);
        await connection.confirmTransaction(sig, "confirmed");
        results.push({ baseMint: position.baseMint, signature: sig });
      }
    } catch (err: any) {
      results.push({ baseMint: position.baseMint, error: err.message });
    }
  }

  output({
    success: true,
    action: "claimed",
    wallet: wallet.toBase58(),
    totalClaimed: (totalLamports / LAMPORTS_PER_SOL).toFixed(6) + " SOL",
    results,
  });
}

main().catch((err) => {
  console.error(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
});
