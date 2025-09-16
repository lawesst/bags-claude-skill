require('dotenv').config();

module.exports = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      forking: process.env.MAINNET_RPC_URL ? { url: process.env.MAINNET_RPC_URL } : undefined,
      chainId: 31337
    }
  }
}; 