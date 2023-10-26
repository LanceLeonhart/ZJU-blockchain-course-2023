import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("BorrowYourCar Contract", function () {
  // Define a fixture to reuse the same setup in every test
  async function deployFixture() {
    const [owner, user] = await ethers.getSigners();

    const BorrowYourCar = await ethers.getContractFactory("BorrowYourCar");
    const borrowYourCar = await BorrowYourCar.deploy();

    return { borrowYourCar, owner, user };
  }

  // Test case 1: Test car borrowing
  it("Should allow a user to borrow a car", async function () {
    const { borrowYourCar, owner, user } = await loadFixture(deployFixture);

    // User borrows a car (not their own)
    await borrowYourCar.connect(user).borrowCar(4, 3600); // Borrow car 0 for 1 hour

    // Check if the car is now borrowed
    const carInfo = await borrowYourCar.getCarInfo(4);
    expect(carInfo.currentBorrower).to.equal(user.address);
  });

  // Test case 2: Test getting owned cars
  it("Should return the list of owned cars for a user", async function () {
    const { borrowYourCar, owner, user } = await loadFixture(deployFixture);

    // Check the list of owned cars for the owner
    const ownerCars = await borrowYourCar.getOwnedCars();
    expect(ownerCars).to.have.lengthOf(5);

    // Check the list of owned cars for the user
    const userCars = await borrowYourCar.connect(user).getOwnedCars();
    expect(userCars).to.have.lengthOf(0); // User doesn't own any cars initially
  });

  // Test case 3: Test getting available cars
  it("Should return the list of available cars for borrowing", async function () {
    const { borrowYourCar, owner, user } = await loadFixture(deployFixture);

    // Get the list of available cars
    const availableCars = await borrowYourCar.getAvailableCars();
    expect(availableCars).to.have.lengthOf(5);
  });

  // Test case 4: Test querying car owner and current borrower
  it("Should allow a user to query car owner and current borrower", async function () {
    const { borrowYourCar, owner, user } = await loadFixture(deployFixture);

    // User borrows a car (not their own)
    await borrowYourCar.connect(user).borrowCar(0, 3600); // Borrow car 0 for 1 hour

    // Query car owner and current borrower
    const [carOwner, currentBorrower, ,] = await borrowYourCar.getCarInfo(0);
    
    // Check if car owner is correct
    expect(carOwner).to.equal(owner.address);

    // Check if current borrower is correct
    expect(currentBorrower).to.equal(user.address);
  });

});
