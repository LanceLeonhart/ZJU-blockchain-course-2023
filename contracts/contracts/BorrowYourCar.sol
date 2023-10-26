// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

// 导入 OpenZeppelin 的 ERC721 以获取 NFT 功能
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "hardhat/console.sol";

contract BorrowYourCar is ERC721 {
    event CarBorrowed(uint32 carTokenId, address borrower, uint256 startTime, uint256 duration);

    // 存储汽车信息的结构体
    struct Car {
        address owner;         // 汽车所有者
        address borrower;      // 当前借用者
        uint256 borrowUntil;   // 借用到期时间
    }

    // 存储汽车信息的数组
    Car[] public cars;

    // 将用户地址映射到其拥有的汽车令牌
    mapping(address => uint32[]) public userOwnedCars;

    uint32 public totalCars; // 汽车的总数量

    constructor() ERC721("BorrowYourCar", "BYC") {
        console.log("use the constructor");

        for (uint32 i = 0; i < 5; i++) {
            _mint(msg.sender, i); // 创建汽车 NFT 并分配给合约创建者
            cars.push(Car(msg.sender, address(0), 0)); // 初始化汽车数组
            totalCars++;
            userOwnedCars[msg.sender].push(i); // 记录合约创建者拥有的汽车
        }
    }

    function borrowCar(uint32 carTokenId, uint256 duration) external {
        console.log("carTokenId is %s and duration is %s",carTokenId, duration);

        // 检查汽车是否存在
        require(ownerOf(carTokenId) != address(0), "Car does not exist");
        // 检查汽车是否已被借用
        require(cars[carTokenId].borrower == address(0), "Car is already borrowed");
        // 检查用户是否尝试借用自己的汽车
        require(ownerOf(carTokenId) != msg.sender, "You cannot borrow your own car");

        // 更新汽车的借用者和借用到期时间
        cars[carTokenId].borrower = msg.sender;
        cars[carTokenId].borrowUntil = block.timestamp + duration;

        // 触发 CarBorrowed 事件，通知其他用户
        emit CarBorrowed(carTokenId, msg.sender, block.timestamp, duration);
    }

    function getOwnedCars() external view returns (uint32[] memory) {
        console.log("getOwnedCars");

        // 返回用户拥有的汽车令牌列表
        return userOwnedCars[msg.sender];
    }

    function getAvailableCars() external view returns (uint32[] memory) {
        console.log("getAvailableCars");

        // 存储可供借用的汽车令牌的临时数组
        uint32[] memory availableCars = new uint32[](totalCars);
        uint32 availableCount = 0;

        // 遍历汽车数组以查找未被借用的汽车
        for (uint32 i = 0; i < totalCars; i++) {
            if (cars[i].borrower == address(0)) {
                availableCars[availableCount] = i;
                availableCount++;
            }
        }

        // 创建一个大小适当的数组，只包含可供借用的汽车令牌
        uint32[] memory result = new uint32[](availableCount);
        for (uint32 j = 0; j < availableCount; j++) {
            result[j] = availableCars[j];
        }

        return result;
    }

    function getCarInfo(uint32 carTokenId) external view returns (address owner, address currentBorrower, uint256 startTime, uint256 duration) {
        console.log("carTokenId is %s",carTokenId);
        
        // 检查汽车是否存在
        require(ownerOf(carTokenId) != address(0), "Car does not exist");

        // 获取汽车的信息并返回
        Car storage car = cars[carTokenId];
        
        console.log("owner is %s, borrower is %s and duration is %s",car.owner,car.borrower,car.borrowUntil);

        return (car.owner, car.borrower, block.timestamp, car.borrowUntil - block.timestamp);
    }
}
