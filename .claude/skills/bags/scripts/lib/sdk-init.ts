import "dotenv/config";
import { z } from "zod";
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";
import { BagsSDK } from "@bagsfm/bags-sdk";

const envSchema = z.object({
  BAGS_API_KEY: z.string().min(1, "BAGS_API_KEY is required — get one at https://dev.bags.fm"),
  SOLANA_PRIVATE_KEY: z.string().min(1, "SOLANA_PRIVATE_KEY is required (base58 encoded)"),
  SOLANA_RPC_URL: z.string().url().default("https://api.mainnet-beta.solana.com"),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;
let _keypair: Keypair | null = null;
let _connection: Connection | null = null;
let _sdk: BagsSDK | null = null;

export function getEnv(): Env {
  if (!_env) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      const missing = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
      console.error(JSON.stringify({
        success: false,
        error: "Environment not configured",
        missing: result.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
        hint: "Run /bags setup to configure your environment",
      }));
      process.exit(1);
    }
    _env = result.data;
  }
  return _env;
}

export function getKeypair(): Keypair {
  if (!_keypair) {
    const env = getEnv();
    try {
      _keypair = Keypair.fromSecretKey(bs58.decode(env.SOLANA_PRIVATE_KEY));
    } catch {
      console.error(JSON.stringify({
        success: false,
        error: "Invalid SOLANA_PRIVATE_KEY — must be base58 encoded",
      }));
      process.exit(1);
    }
  }
  return _keypair;
}

export function getConnection(): Connection {
  if (!_connection) {
    const env = getEnv();
    _connection = new Connection(env.SOLANA_RPC_URL, "confirmed");
  }
  return _connection;
}

export function getSDK(): BagsSDK {
  if (!_sdk) {
    const env = getEnv();
    const connection = getConnection();
    _sdk = new BagsSDK(env.BAGS_API_KEY, connection);
  }
  return _sdk;
}

export async function getBalance(): Promise<number> {
  const connection = getConnection();
  const keypair = getKeypair();
  const lamports = await connection.getBalance(keypair.publicKey);
  return lamports / LAMPORTS_PER_SOL;
}

export function output(data: Record<string, unknown>): void {
  console.log(JSON.stringify(data, null, 2));
}
