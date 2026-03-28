import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getSDK, getKeypair, getConnection, output } from "./lib/sdk-init.js";

async function main() {
  const keypair = getKeypair();
  const connection = getConnection();
  const sdk = getSDK();
  const wallet = keypair.publicKey;

  // SOL balance
  const lamports = await connection.getBalance(wallet);
  const solBalance = lamports / LAMPORTS_PER_SOL;

  // SPL token accounts
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, {
    programId: TOKEN_PROGRAM_ID,
  });
  const tokens = tokenAccounts.value
    .map((ta) => {
      const info = ta.account.data.parsed.info;
      return {
        mint: info.mint,
        balance: info.tokenAmount.uiAmount,
        decimals: info.tokenAmount.decimals,
      };
    })
    .filter((t) => t.balance > 0);

  // Partner config
  let partnerStats = null;
  try {
    const stats = await sdk.partner.getPartnerConfigClaimStats(wallet);
    partnerStats = {
      claimedFees: (Number(stats.claimedFees) / LAMPORTS_PER_SOL).toFixed(4) + " SOL",
      unclaimedFees: (Number(stats.unclaimedFees) / LAMPORTS_PER_SOL).toFixed(4) + " SOL",
    };
  } catch {
    partnerStats = null;
  }

  // Claimable positions
  let claimablePositions: Array<{ baseMint: string; claimableSol: number }> = [];
  try {
    const positions = await sdk.fee.getAllClaimablePositions(wallet);
    claimablePositions = positions
      .filter((p) => p.totalClaimableLamportsUserShare > 0)
      .map((p) => ({
        baseMint: p.baseMint,
        claimableSol: p.totalClaimableLamportsUserShare / LAMPORTS_PER_SOL,
      }));
  } catch {
    // May fail if no positions
  }

  output({
    success: true,
    wallet: wallet.toBase58(),
    solBalance: solBalance.toFixed(4) + " SOL",
    solBalanceLamports: lamports,
    tokenCount: tokens.length,
    tokens,
    partnerStats,
    claimablePositions,
    totalClaimable:
      claimablePositions.reduce((sum, p) => sum + p.claimableSol, 0).toFixed(4) + " SOL",
  });
}

main().catch((err) => {
  console.error(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
});
