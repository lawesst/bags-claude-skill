import dotenv from 'dotenv';
dotenv.config();

import { Command } from 'commander';
import { Contract, JsonRpcProvider, formatUnits, parseUnits } from 'ethers';
import CometAbi from './abi/Comet.json';
import Erc20Abi from './abi/ERC20.json';
import { loadEnv } from './config';

function parseKeyVal(input: string): { key: string; val: string } {
  const idx = input.indexOf(':');
  if (idx === -1) throw new Error(`Invalid arg: ${input}. Use <address>:<value>`);
  return { key: input.slice(0, idx), val: input.slice(idx + 1) };
}

async function main(): Promise<void> {
  const env = loadEnv();
  const program = new Command();
  program
    .option('-c, --collat <spec...>', 'Collateral entries: <asset>:<amount> (human units)')
    .option('-p, --price <spec...>', 'Price overrides: <asset>:<price> (human, e.g. 2500 for ETH)')
    .parse(process.argv);

  const { collat = [], price = [] } = program.opts<{ collat?: string[]; price?: string[] }>();
  if (!env.COMET_ADDRESS) throw new Error('COMET_ADDRESS not set');

  const provider = new JsonRpcProvider(env.RPC_URL);
  const comet = new Contract(env.COMET_ADDRESS, CometAbi as any, provider);

  const baseDecimals = Number(await comet.decimals().catch(() => 6));

  const priceOverrides = new Map<string, number>();
  for (const p of price) {
    const { key, val } = parseKeyVal(p);
    priceOverrides.set(key.toLowerCase(), Number(val));
  }

  let capacityRaw = 0n;
  const details: any[] = [];

  for (const c of collat) {
    const { key: asset, val: amtStr } = parseKeyVal(c);
    const info = await comet.getAssetInfoByAddress(asset);
    const erc20 = new Contract(asset, Erc20Abi as any, provider);
    const assetDecimals: number = await erc20.decimals().catch(() => 18);

    const amountAtomic = parseUnits(amtStr, assetDecimals);

    let priceNum = priceOverrides.get(asset.toLowerCase());
    if (priceNum === undefined) {
      const raw = (await comet.getPrice(asset).catch(() => 0n)) as bigint;
      if (raw > 0n) priceNum = Number(formatUnits(raw, 8));
    }

    const factor = Number(formatUnits(info.borrowCollateralFactor as bigint, 18));
    const scale = Number(info.scale ?? 1n);

    let contribBase = 0;
    if (priceNum !== undefined && scale > 0) {
      const amtHuman = Number(formatUnits(amountAtomic, assetDecimals));
      // Approximate: base contribution = amount * price * factor (assumes base ~ $1)
      contribBase = amtHuman * priceNum * factor;
    }

    capacityRaw += BigInt(Math.floor(contribBase * 10 ** baseDecimals)) as bigint;

    details.push({ asset, amount: amtStr, price: priceNum ?? null, factor, contribBase });
  }

  console.log('What-If Inputs:', details);
  console.log('Estimated borrow capacity (approx, base units):', capacityRaw.toString());
}

main().catch((err) => { console.error(err); process.exit(1); }); 