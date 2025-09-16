import dotenv from 'dotenv';
dotenv.config();

import { Contract, JsonRpcProvider, Wallet, formatUnits } from 'ethers';
import CometAbi from './abi/Comet.json';
import { loadEnv } from './config';

async function main(): Promise<void> {
  const env = loadEnv();
  const provider = new JsonRpcProvider(env.RPC_URL);
  const signer = env.PRIVATE_KEY ? new Wallet(env.PRIVATE_KEY, provider) : undefined;

  const net = await provider.getNetwork();
  console.log(`Connected to chainId=${Number(net.chainId)}`);

  if (!env.COMET_ADDRESS) {
    console.log('Template ready. Set COMET_ADDRESS in .env to interact.');
    return;
  }

  const comet = new Contract(env.COMET_ADDRESS, CometAbi as any, signer ?? provider);

  let baseDecimals = 6;
  try {
    baseDecimals = await comet.decimals();
  } catch {}

  if (signer) {
    const addr = await signer.getAddress();
    const baseSupply = (await comet.balanceOf(addr)) as bigint;
    const borrow = (await comet.borrowBalanceOf(addr).catch(() => 0n)) as bigint;
    console.log(`Base supply balance: ${formatUnits(baseSupply, baseDecimals)}`);
    console.log(`Borrow balance: ${formatUnits(borrow, baseDecimals)}`);
  } else {
    console.log('No PRIVATE_KEY set. Read-only mode.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}); 