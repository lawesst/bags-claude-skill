import dotenv from 'dotenv';
dotenv.config();

import { Command } from 'commander';
import { Contract, JsonRpcProvider, Wallet, formatUnits } from 'ethers';
import RewardsAbi from './abi/CometRewards.json';
import { loadEnv } from './config';

async function main(): Promise<void> {
  const env = loadEnv();
  const program = new Command();
  program
    .requiredOption('-a, --account <address>', 'Account to check/claim for')
    .option('--claim', 'Claim rewards using PRIVATE_KEY')
    .parse(process.argv);

  const { account, claim } = program.opts<{ account: string; claim?: boolean }>();

  if (!env.COMET_ADDRESS) throw new Error('COMET_ADDRESS not set');
  if (!env.COMET_REWARDS_ADDRESS) throw new Error('COMET_REWARDS_ADDRESS not set');

  const provider = new JsonRpcProvider(env.RPC_URL);
  const signer = env.PRIVATE_KEY ? new Wallet(env.PRIVATE_KEY, provider) : undefined;

  const rewards = new Contract(env.COMET_REWARDS_ADDRESS, RewardsAbi as any, signer ?? provider);
  const owed = await rewards.getRewardOwed(env.COMET_ADDRESS, account);

  const token = owed.token as string;
  const amount = owed.owed as bigint;
  console.log('Reward owed (raw):', { token, amount: amount.toString() });

  if (claim) {
    if (!signer) throw new Error('PRIVATE_KEY required to claim');
    if ((await signer.getAddress()).toLowerCase() !== account.toLowerCase()) {
      console.warn('Warning: Claiming for a different src than signer');
    }
    const tx = await rewards.claim(env.COMET_ADDRESS, account, true);
    console.log('Claim sent:', tx.hash);
    const rcpt = await tx.wait();
    console.log('Claim mined in block', rcpt.blockNumber);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}); 