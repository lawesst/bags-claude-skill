import dotenv from 'dotenv';
dotenv.config();

import { Command } from 'commander';
import { Contract, JsonRpcProvider } from 'ethers';
import fs from 'fs';
import path from 'path';
import CometAbi from './abi/Comet.json';
import { loadEnv } from './config';

async function main(): Promise<void> {
  const env = loadEnv();
  const program = new Command();
  program.option('-o, --out <file>', 'Output CSV file (defaults to stdout)').parse(process.argv);
  const { out } = program.opts<{ out?: string }>();

  if (!env.COMET_ADDRESS) throw new Error('COMET_ADDRESS not set');
  const provider = new JsonRpcProvider(env.RPC_URL);
  const comet = new Contract(env.COMET_ADDRESS, CometAbi as any, provider);

  const [name, symbol, decimals] = await Promise.all([
    comet.name().catch(() => 'Comet'),
    comet.symbol().catch(() => 'COMET'),
    comet.decimals().catch(() => 18),
  ]);

  const header = ['market_name','market_symbol','market_decimals','index','asset','priceFeed','scale','borrowCollateralFactor','liquidateCollateralFactor','liquidationFactor','supplyCap'];
  const rows: string[] = [];
  rows.push(header.join(','));

  const numAssets = Number(await comet.numAssets().catch(() => 0));
  for (let i = 0; i < numAssets; i++) {
    const info = await comet.getAssetInfo(i);
    const row = [
      JSON.stringify(name),
      JSON.stringify(symbol),
      String(decimals),
      String(info.offset ?? i),
      String(info.asset),
      String(info.priceFeed),
      String(info.scale),
      String(info.borrowCollateralFactor),
      String(info.liquidateCollateralFactor),
      String(info.liquidationFactor),
      String(info.supplyCap),
    ];
    rows.push(row.join(','));
  }

  const csv = rows.join('\n') + '\n';
  if (out) {
    const p = path.resolve(process.cwd(), out);
    fs.writeFileSync(p, csv);
    console.log('Wrote CSV to', p);
  } else {
    process.stdout.write(csv);
  }
}

main().catch((err) => { console.error(err); process.exit(1); }); 