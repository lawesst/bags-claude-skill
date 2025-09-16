import dotenv from 'dotenv';
dotenv.config();

import { Contract, JsonRpcProvider } from 'ethers';
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

  const [name, symbol, decimals, numAssets] = await Promise.all([
    comet.name().catch(() => 'Comet'),
    comet.symbol().catch(() => 'COMET'),
    comet.decimals().catch(() => 18),
    comet.numAssets().catch(() => 0)
  ]);

  console.log({ name, symbol, decimals, numAssets: Number(numAssets) });

  const assets = [] as Array<any>;
  for (let i = 0; i < Number(numAssets); i++) {
    try {
      const info = await comet.getAssetInfo(i);
      assets.push({
        index: Number(info.offset ?? i),
        asset: info.asset,
        priceFeed: info.priceFeed,
        scale: info.scale?.toString?.() ?? '',
        borrowCollateralFactor: info.borrowCollateralFactor?.toString?.() ?? '',
        liquidateCollateralFactor: info.liquidateCollateralFactor?.toString?.() ?? '',
        liquidationFactor: info.liquidationFactor?.toString?.() ?? '',
        supplyCap: info.supplyCap?.toString?.() ?? ''
      });
    } catch (e) {
      console.log(`Failed to read asset ${i}:`, e);
    }
  }

  console.log({ assets });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}); 