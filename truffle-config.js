require("dotenv").config();
const path = require("path");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const mnemonic = process.env.MNEMONIC
const infuraProjectIdRopsten = process.env.INFURA_PROJECT_ID_ROPSTEN

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "app/src/contracts"),
  networks: {
    develop: {
      port: 8545
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(mnemonic, `https://ropsten.infura.io/v3/${infuraProjectIdRopsten}`)
      },
      network_id: "3",
      gas: 3000000,
      // networkCheckTimeout: 1000,
      timeoutBlocks: 200,
      skipDryRun: true,
    }
  },
  compilers: {
    solc: {
      version: "0.6.0"
    }
  }
};
