import { existsSync, writeFileSync, readFileSync } from "fs";
import { resolve } from "path";
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";

const ENV_PATH = resolve(process.cwd(), ".env");
const ENV_TEMPLATE = `# Bags.fm Configuration
# Get your API key at https://dev.bags.fm
BAGS_API_KEY=

# Your Solana wallet private key (base58 encoded)
# WARNING: Keep this secret! Never commit this file.
SOLANA_PRIVATE_KEY=

# Solana RPC URL (defaults to public mainnet if empty)
# Recommended: Helius (https://helius.dev) or Triton (https://triton.one)
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
`;

async function main() {
  const action = process.argv[2] || "full";
  const result: Record<string, unknown> = { action };

  if (action === "check" || action === "full") {
    // Check SDK
    try {
      require.resolve("@bagsfm/bags-sdk");
      result.sdkInstalled = true;
    } catch {
      result.sdkInstalled = false;
    }

    // Check .env
    result.envExists = existsSync(ENV_PATH);

    if (result.envExists) {
      const env = readFileSync(ENV_PATH, "utf-8");
      result.apiKeySet = /^BAGS_API_KEY=.+$/m.test(env);
      result.privateKeySet = /^SOLANA_PRIVATE_KEY=.+$/m.test(env);
      result.rpcUrlSet = /^SOLANA_RPC_URL=.+$/m.test(env);

      // Validate wallet if key is set
      if (result.privateKeySet) {
        const match = env.match(/^SOLANA_PRIVATE_KEY=(.+)$/m);
        if (match) {
          try {
            const keypair = Keypair.fromSecretKey(bs58.decode(match[1].trim()));
            result.walletAddress = keypair.publicKey.toBase58();

            const rpcMatch = env.match(/^SOLANA_RPC_URL=(.+)$/m);
            const rpcUrl = rpcMatch?.[1]?.trim() || "https://api.mainnet-beta.solana.com";
            const connection = new Connection(rpcUrl, "confirmed");
            const balance = await connection.getBalance(keypair.publicKey);
            result.solBalance = balance / LAMPORTS_PER_SOL;
          } catch (e: any) {
            result.walletError = e.message;
          }
        }
      }
    }

    if (action === "check") {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
  }

  if (action === "full" || action === "create-env") {
    if (!existsSync(ENV_PATH)) {
      writeFileSync(ENV_PATH, ENV_TEMPLATE, "utf-8");
      result.envCreated = true;
      result.envPath = ENV_PATH;
    } else {
      result.envCreated = false;
      result.envPath = ENV_PATH;
      result.hint = ".env already exists — edit it to update your config";
    }
  }

  if (action === "generate-wallet") {
    const keypair = Keypair.generate();
    result.newWallet = {
      publicKey: keypair.publicKey.toBase58(),
      privateKey: bs58.encode(keypair.secretKey),
    };
    result.warning = "Save this private key securely! It cannot be recovered.";
  }

  if (action === "create-partner") {
    const { getSDK, getKeypair, output } = await import("./lib/sdk-init.js");
    const sdk = getSDK();
    const keypair = getKeypair();

    try {
      const existing = await sdk.partner.getPartnerConfig(keypair.publicKey);
      result.partnerConfig = "already_exists";
      result.partnerData = existing;
    } catch {
      const { transaction, blockhash } =
        await sdk.partner.getPartnerConfigCreationTransaction(keypair.publicKey);
      transaction.sign([keypair]);
      const connection = sdk.state.getConnection();
      const sig = await connection.sendTransaction(transaction);
      await connection.confirmTransaction(
        { signature: sig, ...blockhash },
        "confirmed"
      );
      result.partnerConfig = "created";
      result.signature = sig;
      result.wallet = keypair.publicKey.toBase58();
    }
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
});
