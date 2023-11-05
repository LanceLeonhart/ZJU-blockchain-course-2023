import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    ganache: {
      // rpc url, change it according to your ganache configuration
      url: 'http://127.0.0.1:8545',
      // the private key of signers, change it according to your ganache user
      accounts: [
        '0x00615bb2c5709ceb224c39b3357372d47cff104dedfd2097324b01ab4b31958b',
        '0x46c5776a9607156d1593193c3a5d764da79f59e0c2e021eaca2975943becdb5f',
        '0x384cedf282a74402426b68baab808d3c636fb7f4d7c396b7c77a09f51ad8bae9',
        '0x03e9f1ec21778e656735d662d1d577c3fc816a592fdc4ea10ef96f5a8a8a7d6b',
        '0xa564a5264bf314f0002016daa74f1f6de3f767663b79fa97cf972dcfc53d9165',
        '0x4441090ffd39152c1afcca59d96c5859a4550998114e072c522f921d3875b516',
        '0x6240d473101c7ace003adc7f701eef75bf84d30b4f8012aefbe39c343786513c',
        '0xb3428e35d8f057493a8ced607cf0ceaf543890ea0abe0641701bfb542759745e',
        '0x5e18481406766d7d6f6f2b7e7988b9966651eba1fdea4b4193657b38313a658f'
      ]
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};

export default config;
