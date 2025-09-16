import dotenv from 'dotenv';
dotenv.config();

import { Command } from 'commander';
import { Contract, JsonRpcProvider, formatUnits } from 'ethers';
import CometAbi from './abi/Comet.json';
import { loadEnv } from './config';

async function main(): Promise<void> {
  const env = loadEnv();
  const program = new Command();
  program.name('comet-cli');

  program
    .command('market')
    .description('Show market info')
    .action(async () => {
      if (!env.COMET_ADDRESS) throw new Error('COMET_ADDRESS not set');
      const provider = new JsonRpcProvider(env.RPC_URL);
      const comet = new Contract(env.COMET_ADDRESS, CometAbi as any, provider);
      const [name, symbol, decimals, util] = await Promise.all([
        comet.name().catch(() => 'Comet'),
        comet.symbol().catch(() => 'COMET'),
        comet.decimals().catch(() => 18),
        comet.getUtilization().catch(() => 0n)
      ]);
      console.log({ name, symbol, decimals, utilization: formatUnits(util, 18) });
      const numAssets = Number(await comet.numAssets().catch(() => 0));
      console.log('numAssets:', numAssets);
    });

  program
    .command('account')
    .requiredOption('-a, --address <address>', 'Account address')
    .description('Show account base and borrow balances')
    .action(async (opts) => {
      if (!env.COMET_ADDRESS) throw new Error('COMET_ADDRESS not set');
      const provider = new JsonRpcProvider(env.RPC_URL);
      const comet = new Contract(env.COMET_ADDRESS, CometAbi as any, provider);
      const decimals = await comet.decimals().catch(() => 18);
      const [base, debt] = await Promise.all([
        comet.balanceOf(opts.address).catch(() => 0n),
        comet.borrowBalanceOf(opts.address).catch(() => 0n)
      ]);
      console.log({ base: formatUnits(base, decimals), debt: formatUnits(debt, decimals) });
    });

  await program.parseAsync(process.argv);
}

main().catch((err) => { console.error(err); process.exit(1); }); 