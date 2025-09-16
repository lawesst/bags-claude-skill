import dotenv from 'dotenv';
dotenv.config();

import { Contract, JsonRpcProvider, formatUnits } from 'ethers';
import CometAbi from './abi/Comet.json';
import { loadEnv } from './config';

async function main(): Promise<void> {
  const env = loadEnv();
  const provider = new JsonRpcProvider(env.RPC_URL);

  if (!env.COMET_ADDRESS) {
    console.log('Set COMET_ADDRESS in .env');
    return;
  }

  const comet = new Contract(env.COMET_ADDRESS, CometAbi as any, provider);

  const chainId = Number((await provider.getNetwork()).chainId);
  const utilization = (await comet.getUtilization()) as bigint;

  console.log(`Chain: ${chainId}`);
  console.log(`Comet: ${env.COMET_ADDRESS}`);
  console.log(`Utilization: ${formatUnits(utilization, 18)}`);

  try {
    const borrowRate = (await comet.getBorrowRate(utilization)) as bigint;
    const supplyRate = (await comet.getSupplyRate(utilization)) as bigint;
    console.log(`Borrow rate (raw): ${borrowRate.toString()}`);
    console.log(`Supply rate (raw): ${supplyRate.toString()}`);
  } catch {
    console.log('Rate functions unavailable in this ABI/market; showing utilization only.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}); 