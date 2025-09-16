import dotenv from 'dotenv';
dotenv.config();

import { Command } from 'commander';
import { Contract, JsonRpcProvider, formatUnits } from 'ethers';
import CometAbi from './abi/Comet.json';
import { loadEnv } from './config';

function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)); }

async function main(): Promise<void> {
  const env = loadEnv();
  const program = new Command();
  program
    .option('-i, --interval <sec>', 'Polling interval seconds', '10')
    .option('-n, --iterations <n>', 'Iterations to run (0 = infinite)', '5')
    .option('-t, --threshold <pct>', 'Utilization change threshold percent', '1')
    .parse(process.argv);

  const { interval, iterations, threshold } = program.opts<{ interval: string; iterations: string; threshold: string }>();
  if (!env.COMET_ADDRESS) throw new Error('COMET_ADDRESS not set');

  const provider = new JsonRpcProvider(env.RPC_URL);
  const comet = new Contract(env.COMET_ADDRESS, CometAbi as any, provider);

  const numAssets = Number(await comet.numAssets().catch(() => 0));
  const prevCaps = new Map<number, string>();
  for (let i = 0; i < numAssets; i++) {
    const info = await comet.getAssetInfo(i);
    prevCaps.set(i, String(info.supplyCap));
  }

  let prevUtil = (await comet.getUtilization()) as bigint;
  console.log('Initial utilization:', formatUnits(prevUtil, 18));

  const ms = Math.max(1, Number(interval)) * 1000;
  const n = Number(iterations);
  const pctThreshold = Number(threshold) / 100;

  let iter = 0;
  // eslint-disable-next-line no-constant-condition
  while (n === 0 || iter < n) {
    await sleep(ms);
    iter++;

    const util = (await comet.getUtilization()) as bigint;
    const utilF = Number(formatUnits(util, 18));
    const prevF = Number(formatUnits(prevUtil, 18));
    if (Math.abs(utilF - prevF) >= pctThreshold) {
      console.log(`Utilization changed: ${prevF.toFixed(6)} -> ${utilF.toFixed(6)}`);
      prevUtil = util;
    }

    for (let i = 0; i < numAssets; i++) {
      const info = await comet.getAssetInfo(i);
      const cap = String(info.supplyCap);
      const prev = prevCaps.get(i);
      if (prev !== undefined && prev !== cap) {
        console.log(`Supply cap changed for asset[${i}] ${info.asset}: ${prev} -> ${cap}`);
        prevCaps.set(i, cap);
      }
    }
  }
}

main().catch((err) => { console.error(err); process.exit(1); }); 