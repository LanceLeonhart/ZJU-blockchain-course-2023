import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("BorrowYourCar Contract", function () {
  // Define a fixture to reuse the same setup in every test
  async function deployFixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();

    const MyERC20 = await ethers.getContractFactory("MyERC20");
    const myERC20 = await MyERC20.deploy();

    const BorrowYourCar = await ethers.getContractFactory("BorrowYourCar");
    const borrowYourCar = await BorrowYourCar.deploy(myERC20.address);

    // Distribute cars to users
    await borrowYourCar.connect(owner).distributeCar(user1.address);
    await borrowYourCar.connect(owner).distributeCar(user2.address);
    await borrowYourCar.connect(owner).distributeCar(user3.address);

    // Transfer some tokens to users
    const initialTokens = ethers.utils.parseEther("10000"); // Initial token balance for users
    await myERC20.transfer(user1.address, initialTokens);
    await myERC20.transfer(user2.address, initialTokens);
    await myERC20.transfer(user3.address, initialTokens);

    return { borrowYourCar, myERC20, owner, user1, user2, user3 };
  }

  // Test case 1: Test viewing owned and available cars
  it("Should allow users to view owned and available cars", async function () {
    const { borrowYourCar, myERC20, user1, user2, user3 } = await loadFixture(deployFixture);

    // Make sure the users approve enough tokens for renting a car
    const rentAmount = 100000; 
    await myERC20.connect(user1).approve(borrowYourCar.address, rentAmount);
    await myERC20.connect(user2).approve(borrowYourCar.address, rentAmount);
    await myERC20.connect(user3).approve(borrowYourCar.address, rentAmount);
    // User 1 borrows a car
    await borrowYourCar.connect(user1).borrowCar(2, 1); // Borrow car 2 for 1 hour

    // Check if the car is now borrowed by user1
    const carInfo = await borrowYourCar.getCarInfo(2);
    expect(carInfo.currentBorrower).to.equal(user1.address);

    // User 2 tries to borrow the same car, should fail
    await expect(borrowYourCar.connect(user2).borrowCar(2, 1)).to.be.revertedWith("Car is already borrowed");
  });

  // Test case 2: Test querying car owner and current borrower
  it("Should allow users to query car owner and current borrower", async function () {
    const { borrowYourCar, myERC20, owner, user1, user2, user3 } = await loadFixture(deployFixture);

    // Make sure the users approve enough tokens for renting a car
    const rentAmount = 100000; 
    await myERC20.connect(user1).approve(borrowYourCar.address, rentAmount);
    await myERC20.connect(user2).approve(borrowYourCar.address, rentAmount);
    await myERC20.connect(user3).approve(borrowYourCar.address, rentAmount);
    // User1 borrows a car (not their own)
    await borrowYourCar.connect(user1).borrowCar(2, 1); // Borrow car 2 for 1 hour

    // User2 tries to borrow the same car (should fail)
    await expect(borrowYourCar.connect(user2).borrowCar(2, 1)).to.be.revertedWith("Car is already borrowed");

    // Query car owner and current borrower
    const [carOwner, currentBorrower, ,] = await borrowYourCar.getCarInfo(2);

    // Check if car owner is correct
    expect(carOwner).to.equal(user3.address);

    // Check if current borrower is correct
    expect(currentBorrower).to.equal(user1.address);
  });

  // Test case 3: Test borrowing a car
  it("Should allow a user to borrow an available car for a specified duration", async function () {
    const { borrowYourCar, myERC20, owner, user1, user2, user3 } = await loadFixture(deployFixture);

    // Make sure the users approve enough tokens for renting a car
    const rentAmount = 100000; 
    await myERC20.connect(user1).approve(borrowYourCar.address, rentAmount);
    await myERC20.connect(user2).approve(borrowYourCar.address, rentAmount);
    await myERC20.connect(user3).approve(borrowYourCar.address, rentAmount);
    // User borrows a car (not their own)
    await borrowYourCar.connect(user1).borrowCar(2, 2); // Borrow car 2 for 2 hour

    // Check if the car is now borrowed
    const carInfo = await borrowYourCar.getCarInfo(2);
    expect(carInfo.currentBorrower).to.equal(user1.address);
  });
});
