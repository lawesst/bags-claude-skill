import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getSDK, getKeypair, getConnection, output } from "./lib/sdk-init.js";
import { WRAPPED_SOL_MINT } from "@bagsfm/bags-sdk";

interface TradeArgs {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
  confirm?: boolean;
}

function parseArgs(): TradeArgs {
  const args: TradeArgs = { inputMint: "", outputMint: "", amount: 0 };
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--input-mint":
        args.inputMint = argv[++i];
        break;
      case "--output-mint":
        args.outputMint = argv[++i];
        break;
      case "--amount":
        args.amount = parseFloat(argv[++i]);
        break;
      case "--amount-lamports":
        args.amount = parseInt(argv[++i]);
        break;
      case "--slippage-bps":
        args.slippageBps = parseInt(argv[++i]);
        break;
      case "--confirm":
        args.confirm = true;
        break;
      // Shortcuts for SOL trading
      case "--buy":
        // --buy TOKEN_MINT --sol 0.1
        args.inputMint = WRAPPED_SOL_MINT.toBase58();
        args.outputMint = argv[++i];
        break;
      case "--sell":
        // --sell TOKEN_MINT --amount 1000
        args.outputMint = WRAPPED_SOL_MINT.toBase58();
        args.inputMint = argv[++i];
        break;
      case "--sol":
        args.amount = Math.floor(parseFloat(argv[++i]) * LAMPORTS_PER_SOL);
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

  if (!args.inputMint || !args.outputMint || !args.amount) {
    output({
      success: false,
      error: "Missing required fields. Use: --buy TOKEN_MINT --sol AMOUNT or --input-mint X --output-mint Y --amount Z",
      examples: [
        "npx tsx trade.ts --buy <TOKEN_MINT> --sol 0.5",
        "npx tsx trade.ts --sell <TOKEN_MINT> --amount 1000000",
        "npx tsx trade.ts --input-mint SOL_MINT --output-mint TOKEN_MINT --amount-lamports 500000000",
      ],
    });
    process.exit(1);
  }

  if (args.amount <= 0) {
    output({
      success: false,
      error: "Trade amount must be greater than zero",
    });
    process.exit(1);
  }

  if (args.inputMint === args.outputMint) {
    output({
      success: false,
      error: "Input and output mints cannot be the same",
    });
    process.exit(1);
  }

  // Check SOL balance before buying
  const isBuying = args.inputMint === WRAPPED_SOL_MINT.toBase58();
  const balance = await connection.getBalance(keypair.publicKey);
  if (isBuying && args.amount > balance) {
    output({
      success: false,
      error: "Insufficient SOL balance",
      required: (args.amount / LAMPORTS_PER_SOL).toFixed(4) + " SOL",
      available: (balance / LAMPORTS_PER_SOL).toFixed(4) + " SOL",
      wallet: keypair.publicKey.toBase58(),
    });
    process.exit(1);
  }

  // Get quote
  const quote = await sdk.trade.getQuote({
    inputMint: new PublicKey(args.inputMint),
    outputMint: new PublicKey(args.outputMint),
    amount: args.amount,
    slippageMode: args.slippageBps ? "manual" : "auto",
    ...(args.slippageBps && { slippageBps: args.slippageBps }),
  });

  const priceImpact = parseFloat(quote.priceImpactPct);

  const quoteResult = {
    success: true,
    action: "quote",
    direction: isBuying ? "BUY" : "SELL",
    inputMint: quote.inputMint,
    outputMint: quote.outputMint,
    inAmount: quote.inAmount,
    outAmount: quote.outAmount,
    minOutAmount: quote.minOutAmount,
    priceImpactPct: quote.priceImpactPct,
    slippageBps: quote.slippageBps,
    route: quote.routePlan.map((leg) => ({
      venue: leg.venue,
      inAmount: leg.inAmount,
      outAmount: leg.outAmount,
    })),
    platformFee: quote.platformFee
      ? {
          amount: quote.platformFee.amount,
          feeBps: quote.platformFee.feeBps,
        }
      : null,
    warnings: [] as string[],
  };

  if (priceImpact > 5) {
    quoteResult.warnings.push(`HIGH PRICE IMPACT: ${priceImpact.toFixed(2)}% — consider smaller trade`);
  }
  if (priceImpact > 10) {
    quoteResult.warnings.push(`VERY HIGH PRICE IMPACT: ${priceImpact.toFixed(2)}% — strongly recommend against this trade`);
  }

  if (!args.confirm) {
    output({ ...quoteResult, hint: "Re-run with --confirm to execute the swap" });
    return;
  }

  // Execute swap
  const swapResult = await sdk.trade.createSwapTransaction({
    quoteResponse: quote,
    userPublicKey: keypair.publicKey,
  });

  swapResult.transaction.sign([keypair]);
  const sig = await connection.sendTransaction(swapResult.transaction);
  await connection.confirmTransaction(sig, "confirmed");

  output({
    ...quoteResult,
    action: "swapped",
    signature: sig,
    computeUnitLimit: swapResult.computeUnitLimit,
    prioritizationFeeLamports: swapResult.prioritizationFeeLamports,
  });
}

main().catch((err) => {
  console.error(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
});
