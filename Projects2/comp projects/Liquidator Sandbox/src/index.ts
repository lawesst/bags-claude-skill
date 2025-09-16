import dotenv from 'dotenv';
dotenv.config();

import { Command } from 'commander';
import { Contract, JsonRpcProvider, parseUnits } from 'ethers';
import CometAbi from './abi/Comet.json';
import { loadEnv } from './config';

async function main(): Promise<void> {
  const env = loadEnv();
  const program = new Command();
  program
    .requiredOption('-m, --method <absorb|buy>', 'Method to encode')
    .option('--absorber <address>', 'Absorber (for absorb)')
    .option('--targets <addresses>', 'Comma-separated targets (for absorb)')
    .option('--asset <address>', 'Collateral asset (for buy)')
    .option('--min <amount>', 'Min collateral amount (human, for buy)', '0')
    .option('--base <amount>', 'Base amount to spend (human, for buy)', '0')
    .option('--to <address>', 'Recipient (for buy)')
    .parse(process.argv);

  const opts = program.opts();
  if (!env.COMET_ADDRESS) throw new Error('COMET_ADDRESS not set');
  const provider = new JsonRpcProvider(env.RPC_URL);
  const comet = new Contract(env.COMET_ADDRESS, CometAbi as any, provider);

  if (opts.method === 'absorb') {
    const absorber = opts.absorber ?? '0x0000000000000000000000000000000000000001';
    const accounts = String(opts.targets ?? '').split(',').filter(Boolean);
    const data = comet.interface.encodeFunctionData('absorb', [absorber, accounts]);
    console.log('to:', env.COMET_ADDRESS);
    console.log('data:', data);
  } else if (opts.method === 'buy') {
    const decimals = await comet.decimals().catch(() => 6);
    const asset = opts.asset as string;
    const minAmount = parseUnits(String(opts.min), decimals);
    const baseAmount = parseUnits(String(opts.base), decimals);
    const recipient = (opts.to as string) ?? '0x0000000000000000000000000000000000000001';
    const data = comet.interface.encodeFunctionData('buyCollateral', [asset, minAmount, baseAmount, recipient]);
    console.log('to:', env.COMET_ADDRESS);
    console.log('data:', data);
  } else {
    throw new Error('Invalid --method');
  }
}

main().catch((err) => { console.error(err); process.exit(1); }); 