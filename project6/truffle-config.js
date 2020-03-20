const HDWallet = require('truffle-hdwallet-provider');
const fs = require('fs');
const infuraAccount = fs.readFileSync(".infura").toString().trim().split(' '); 

module.exports = {
  networks: {
    develop: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    },
    // rinkeby: {
    //   provider: () => new HDWallet(infuraAccount[2], `https://rinkeby.infura.io/v3/${infuraAccount[1]}`),
    //   from: infuraAccount[0], // account from local secret file
    //   network_id: 4,       // Rinkeby's id
    //   gas: 5500000,        // Rinkeby has a lower block limit than mainnet
    //   confirmations: 2,    // # of confs to wait between deployments. (default: 0)
    //   timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
    //   skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    // }
  }
};