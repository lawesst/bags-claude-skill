import dotenv from 'dotenv';
dotenv.config();

import { Command } from 'commander';
import { Contract, JsonRpcProvider } from 'ethers';
import CometAbi from './abi/Comet.json';
import { loadEnv } from './config';

async function main(): Promise<void> {
  const env = loadEnv();
  const program = new Command();
  program.requiredOption('-t, --targets <addresses>', 'Comma-separated target accounts').parse(process.argv);
  const { targets } = program.opts<{ targets: string }>();
  const list = targets.split(',').map((s: string) => s.trim()).filter(Boolean);

  if (!env.COMET_ADDRESS) throw new Error('COMET_ADDRESS not set');
  const provider = new JsonRpcProvider(env.RPC_URL);
  const comet = new Contract(env.COMET_ADDRESS, CometAbi as any, provider);

  for (const a of list) {
    const healthy = await comet.isBorrowCollateralized(a).catch(() => true);
    console.log({ account: a, liquidatable: !healthy });
  }
}

main().catch((err) => { console.error(err); process.exit(1); }); 