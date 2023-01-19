import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  paths: {
    artifacts: "./src/artifacts",
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
  },
};

export default config;

// require("@nomicfoundation/hardhat-toolbox");
// // require("@nomicfoundation/hardhat-chai-matchers");
// // require("@nomiclabs/hardhat-ethers");

// module.exports = {
//   solidity: "0.8.9",
//   paths: {
//     artifacts: "./src/artifacts",
//   },
//   networks: {
//     hardhat: {
//       chainId: 1337,
//     },
//   },
// };