import { ethers } from "hardhat";

async function main() {
  // Deploy the MyERC20 token contract
  const MyERC20 = await ethers.getContractFactory("MyERC20");
  const myERC20 = await MyERC20.deploy();
  await myERC20.deployed();

  console.log(`MyERC20 deployed to: ${myERC20.address}`);

  // Deploy the BorrowYourCar contract, passing the address of the MyERC20 contract
  const BorrowYourCar = await ethers.getContractFactory("BorrowYourCar");
  const borrowYourCar = await BorrowYourCar.deploy(myERC20.address);
  await borrowYourCar.deployed();

  console.log(`BorrowYourCar deployed to: ${borrowYourCar.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
