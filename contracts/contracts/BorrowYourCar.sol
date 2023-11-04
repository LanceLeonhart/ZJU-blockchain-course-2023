// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

//导入需要使用的库文件
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "./MyERC20.sol";

contract BorrowYourCar is ERC721, Ownable {
    event CarBorrowed(uint256 carTokenId, address borrower, uint256 startTime, uint256 duration);

    //定义一个Car的结构体，用于表示一辆车
    struct Car {
        address owner;         //汽车所有者
        address borrower;      //当前借用者
        uint256 borrowUntil;   //借用到期时间
    }

    mapping(address => uint256[]) public userOwnedCars;
    mapping(uint256 => Car) public cars; // 用 mapping 存储汽车信息
    uint256 public totalCars; // 汽车的总数量
    MyERC20 public token; // 代币合约引用

    constructor(address _tokenAddress) ERC721("BorrowYourCar", "BYC") {
        token = MyERC20(_tokenAddress);
        totalCars = 0;
    }

    function distributeCar() public {
        require(totalCars < 255, "Maximum cars reached");
        uint256 carTokenId = totalCars;
        _safeMint(msg.sender, carTokenId);      //调用_safeMint函数，创建一个NFT
        //将创建的NFT存入cars中保存
        cars[carTokenId] = Car({owner: msg.sender, borrower: address(0), borrowUntil: 0});
        totalCars++;
        //更新用户有的汽车列表
        userOwnedCars[msg.sender].push(carTokenId);
    }

    function borrowCar(uint256 carTokenId, uint256 duration) external {
        //检查汽车是否存在
        require(ownerOf(carTokenId) != address(0), "Car does not exist");
        //检查汽车是否已被借用
        require(cars[carTokenId].borrower == address(0), "Car is already borrowed");
        //检查用户是否尝试借用自己的汽车
        require(ownerOf(carTokenId) != msg.sender, "You cannot borrow your own car");

        address car_owner = ownerOf(carTokenId);    //调用ownerOf函数获取汽车的所有者

        //使用代币来支付租金
        uint256 rentAmount = calculateRent(duration);
        //函数调用者付款给汽车的拥有者
        require(token.transferFrom(msg.sender, car_owner, rentAmount), "Payment failed");

        //更新汽车的借用者和借用到期时间
        cars[carTokenId].borrower = msg.sender;
        //因为duration的时间单位是小时，所以需要*3600变成秒为单位
        cars[carTokenId].borrowUntil = block.timestamp + duration * 3600;

        //触发CarBorrowed事件，通知并且记录在block上
        emit CarBorrowed(carTokenId, msg.sender, block.timestamp, duration);
    }

    function getOwnedCars() external view returns (uint256[] memory) {
        //返回用户拥有的汽车列表
        return userOwnedCars[msg.sender];
    }

    function getAvailableCars() external view returns (uint256[] memory) {
        //availableCars是存储可供借用的汽车的临时数组
        uint256[] memory availableCars = new uint256[](totalCars);
        uint256 availableCount = 0;

        //遍历汽车数组以查找未被借用的汽车
        for (uint256 i = 0; i < totalCars; i++) {
            if (cars[i].borrower == address(0)) {
                availableCars[availableCount] = i;
                availableCount++;
            }
        }

        //创建一个大小适当的数组，只包含可供借用的汽车
        uint256[] memory result = new uint256[](availableCount);
        for (uint256 j = 0; j < availableCount; j++) {
            result[j] = availableCars[j];
        }

        return result;
    }

    function getCarInfo(uint256 carTokenId) external view returns (address owner, address currentBorrower, uint256 borrowUntil) {
        // 检查汽车是否存在
        require(ownerOf(carTokenId) != address(0), "Car does not exist");
        // 获取汽车的信息并返回
        Car storage car = cars[carTokenId];
        return (car.owner, car.borrower, car.borrowUntil);
    }

    //计算租金
    function calculateRent(uint256 duration) internal pure returns (uint256) {
        //定义租金逻辑，根据租用的时间来计算租金
        uint256 hourlyRate = 10; //每小时的租金为10个代币
        return hourlyRate * duration;   //duration的单位是小时
    }
}
