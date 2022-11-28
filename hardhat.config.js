require("@nomicfoundation/hardhat-toolbox");
// require("@nomicfoundation/hardhat-chai-matchers");
// require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.9",
  paths: {
    artifacts: "./src/artifacts",
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
  },
};
