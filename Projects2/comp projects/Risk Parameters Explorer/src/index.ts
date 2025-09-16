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

  const [name, symbol] = await Promise.all([
    comet.name().catch(() => 'Comet'),
    comet.symbol().catch(() => 'COMET')
  ]);

  const utilization = (await comet.getUtilization().catch(() => 0n)) as bigint;
  const borrowRate = (await comet.getBorrowRate?.(utilization).catch(() => 0n)) as bigint;
  const supplyRate = (await comet.getSupplyRate?.(utilization).catch(() => 0n)) as bigint;
  const reserveRate = (await comet.reserveRate?.().catch(() => 0n)) as bigint;
  const kink = (await comet.kink?.().catch(() => 0n)) as bigint;
  const baseRate = (await comet.baseRate?.().catch(() => 0n)) as bigint;
  const slopeLow = (await comet.slopeLow?.().catch(() => 0n)) as bigint;
  const slopeHigh = (await comet.slopeHigh?.().catch(() => 0n)) as bigint;
  const storefront = (await comet.storeFrontPriceFactor?.().catch(() => 0n)) as bigint;

  console.log('Market:', { name, symbol });
  console.log('Rates/raw:', { utilization: formatUnits(utilization, 18), borrowRate: borrowRate.toString(), supplyRate: supplyRate.toString() });
  console.log('Curve/raw:', { reserveRate: reserveRate.toString(), kink: kink.toString(), baseRate: baseRate.toString(), slopeLow: slopeLow.toString(), slopeHigh: slopeHigh.toString() });
  console.log('Other/raw:', { storeFrontPriceFactor: storefront.toString() });

  const numAssets = Number(await comet.numAssets().catch(() => 0));
  const assets: Array<any> = [];
  for (let i = 0; i < numAssets; i++) {
    const info = await comet.getAssetInfo(i);
    const price = (await comet.getPrice(info.asset).catch(() => 0n)) as bigint;
    assets.push({
      index: Number(info.offset ?? i),
      asset: info.asset,
      priceFeed: info.priceFeed,
      scale: info.scale?.toString?.() ?? '',
      borrowCollateralFactor: info.borrowCollateralFactor?.toString?.() ?? '',
      liquidateCollateralFactor: info.liquidateCollateralFactor?.toString?.() ?? '',
      liquidationFactor: info.liquidationFactor?.toString?.() ?? '',
      supplyCap: info.supplyCap?.toString?.() ?? '',
      price: price.toString()
    });
  }
  console.log({ assets });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}); 