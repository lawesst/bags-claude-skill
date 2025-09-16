import dotenv from 'dotenv';
dotenv.config();

import { Command } from 'commander';
import { Contract, JsonRpcProvider, Wallet, parseUnits } from 'ethers';
import CometAbi from './abi/Comet.json';
import { loadEnv } from './config';

async function main(): Promise<void> {
  const env = loadEnv();
  const program = new Command();
  program
    .requiredOption('-a, --asset <address>', 'Asset address (base or collateral)')
    .requiredOption('-m, --mode <supply|withdraw>', 'Mode: supply or withdraw')
    .requiredOption('-n, --amount <human>', 'Amount in human units')
    .parse(process.argv);

  const { asset, mode, amount } = program.opts<{ asset: string; mode: string; amount: string }>();
  if (!env.COMET_ADDRESS) throw new Error('COMET_ADDRESS not set');
  const provider = new JsonRpcProvider(env.RPC_URL);
  const comet = new Contract(env.COMET_ADDRESS, CometAbi as any, provider) as any;

  const decimals = await comet.decimals().catch(() => 6);
  const amt = parseUnits(amount, decimals);

  if (!env.PRIVATE_KEY) {
    console.log('Dry-run only (no PRIVATE_KEY). Attempting callStatic...');
    try {
      if (mode === 'supply') await (comet.callStatic as any).supply(asset, amt);
      else if (mode === 'withdraw') await (comet.callStatic as any).withdraw(asset, amt);
      else throw new Error('Invalid mode');
      console.log('callStatic succeeded');
    } catch (e) {
      console.log('callStatic failed:', (e as any)?.reason || (e as any)?.message || e);
    }
    return;
  }

  const signer = new Wallet(env.PRIVATE_KEY, provider);
  const cometSigner = (comet as any).connect(signer);
  try {
    if (mode === 'supply') {
      const tx = await cometSigner.supply(asset, amt);
      console.log('Supply tx:', tx.hash);
    } else if (mode === 'withdraw') {
      const tx = await cometSigner.withdraw(asset, amt);
      console.log('Withdraw tx:', tx.hash);
    } else throw new Error('Invalid mode');
  } catch (e) {
    console.log('Tx failed:', (e as any)?.reason || (e as any)?.message || e);
  }
}

main().catch((err) => { console.error(err); process.exit(1); }); 