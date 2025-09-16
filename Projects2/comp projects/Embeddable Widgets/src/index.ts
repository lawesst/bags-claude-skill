import dotenv from 'dotenv';
dotenv.config();

import { Contract, JsonRpcProvider, Wallet, formatUnits } from 'ethers';
import CometAbi from './abi/Comet.json';
import { loadEnv } from './config';

import fs from 'fs';
import path from 'path';

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
.widget{font-family:system-ui,Arial,sans-serif;border:1px solid #e5e7eb;border-radius:12px;padding:16px;width:320px;background:#fff}
.hrow{display:flex;justify-content:space-between;align-items:center;margin:6px 0}
.bar{height:10px;background:#e5e7eb;border-radius:6px;overflow:hidden}
.fill{height:100%;background:linear-gradient(90deg,#22c55e,#ef4444)}
.label{font-size:12px;color:#64748b}
.value{font-weight:600}
</style>
</head>
<body>
<div class="widget">
  <div class="hrow"><div class="label">Market</div><div id="market" class="value">-</div></div>
  <div class="bar"><div id="bar" class="fill" style="width:0%"></div></div>
  <div class="hrow"><div class="label">Utilization</div><div id="util" class="value">0%</div></div>
</div>
<script>
(async function(){
  try{
    const res = await fetch('https://api.allorigins.win/raw?url='+encodeURIComponent('https://api.compound.finance/api/v3/markets/mainnet/usdc'));
    const data = await res.json();
    const util = Number(data.utilization ?? 0) * 100;
    document.getElementById('market').textContent = data.symbol || 'cUSDCv3';
    document.getElementById('util').textContent = util.toFixed(2)+'%';
    document.getElementById('bar').style.width = Math.max(0, Math.min(util, 100))+'%';
  }catch(e){ console.error(e); }
})();
</script>
</body>
</html>`;

const out = path.resolve(process.cwd(), 'health-widget.html');
fs.writeFileSync(out, html);
console.log('Wrote', out);

async function main(): Promise<void> {
  const env = loadEnv();
  const provider = new JsonRpcProvider(env.RPC_URL);
  const signer = env.PRIVATE_KEY ? new Wallet(env.PRIVATE_KEY, provider) : undefined;

  const net = await provider.getNetwork();
  console.log(`Connected to chainId=${Number(net.chainId)}`);

  if (!env.COMET_ADDRESS) {
    console.log('Template ready. Set COMET_ADDRESS in .env to interact.');
    return;
  }

  const comet = new Contract(env.COMET_ADDRESS, CometAbi as any, signer ?? provider);

  let baseDecimals = 6;
  try {
    baseDecimals = await comet.decimals();
  } catch {}

  if (signer) {
    const addr = await signer.getAddress();
    const baseSupply = (await comet.balanceOf(addr)) as bigint;
    const borrow = (await comet.borrowBalanceOf(addr).catch(() => 0n)) as bigint;
    console.log(`Base supply balance: ${formatUnits(baseSupply, baseDecimals)}`);
    console.log(`Borrow balance: ${formatUnits(borrow, baseDecimals)}`);
  } else {
    console.log('No PRIVATE_KEY set. Read-only mode.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}); 