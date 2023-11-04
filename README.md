# ZJU-blockchain-course-2023

## 如何运行

1. 在本地启动ganache应用。

2. 在 `./contracts` 中安装需要的依赖，运行如下的命令：
    ```bash
    npm install
    ```
3. 在 `./contracts` 中编译合约，运行如下的命令：
    ```bash
    npx hardhat compile
    ```
4. 修改hardhat.config.ts文件，运行如下命令，将合约部署到ganache的本地链上：
    ```bash
    npx hardhat run ./scripts/deploy.ts --network ganache
    ```
5. 得到合约的部署地址，将其拷贝并粘贴到`./frontend/src/utils/contract-address.json`文件中
6. 将编译合约得到的abi文件拷贝到`./frontend/src/utils/abis`文件夹目录下
7. 在 `./frontend` 中安装需要的依赖，运行如下的命令：
    ```bash
    npm install
    ```
8. 在 `./frontend` 中启动前端程序，运行如下的命令：
    ```bash
    npm run start
    ```

## 功能实现分析

- 查看自己拥有的汽车列表和当前未被借用的汽车列表：
    
    为了查看拥有的汽车列表，我们在合约中维护一个名为userOwnedCars的数据结构，并在调用函数getOwnedCars()时直接返回这个mapping结构中某一用户地址对应的汽车列表。
    ```solidity
    mapping(address => uint256[]) public userOwnedCars;
    function getOwnedCars() external view returns (uint256[] memory) {
        //返回用户拥有的汽车列表
        return userOwnedCars[msg.sender];
    }
    ```

    为了查看当前未被借用的汽车列表，我们编写一个名为getAvailableCars()的函数，通过遍历判断的方法查找尚未被借用的汽车，并返回一个新的result数组来进行交互。
    ```solidity
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
    ```

  
- 查询一辆汽车的主人，以及该汽车当前的借用者（如果有）：

    为了查询一辆汽车的相关信息，我们先定义了汽车的结构体struct Car，然后编写getCarInfo函数，读取目标汽车的owner, borrower, borrowUntil信息并返回，从而实现对汽车信息的查询。

    如果汽车尚未被借用，那么borrower会显示为0地址，借用到期时间显示为0.

    ```solidity
    //定义一个Car的结构体，用于表示一辆车
    struct Car {
        address owner;         //汽车所有者
        address borrower;      //当前借用者
        uint256 borrowUntil;   //借用到期时间
    }

    function getCarInfo(uint256 carTokenId) external view returns (address owner, address currentBorrower, uint256 borrowUntil) {
        // 检查汽车是否存在
        require(ownerOf(carTokenId) != address(0), "Car does not exist");
        // 获取汽车的信息并返回
        Car storage car = cars[carTokenId];
        return (car.owner, car.borrower, car.borrowUntil);
    }
    ```

- 选择并借用某辆还没有被借用的汽车一定时间：

    为了实现该汽车租赁系统的核心功能，汽车租赁，我们编写了borrowCar函数，先对汽车的当前状态进行判断，对不合理的借用行为进行反馈。若借用请求合理，则使用我们自己发行的代币MTK来支付租金，付款给汽车的所有者并更新汽车的借用者和借用到期时间。

    ```solidity
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
    ```

- （Bonus）使用自己发行的积分（ERC20）完成付费租赁汽车的流程：

    在这一部分我们通过引入ERC20合约，实现了发行自己的代币MTK并且付费租赁汽车的功能模块。

    在ERC20文件中，我们参考了助教的demo，基本沿用了其中的功能和函数，发行MTK代币并设置了空投的功能。

    ```solidity
    contract MyERC20 is ERC20 {
        mapping(address => bool) claimedAirdropPlayerList;

        constructor() ERC20("my_token", "MTK") {

        }

        function airdrop() external {
            require(claimedAirdropPlayerList[msg.sender] == false, "This user has claimed airdrop already");
            _mint(msg.sender, 1000);
            claimedAirdropPlayerList[msg.sender] = true;
        }
    }
    ```

    在付费租赁部分，我们使用calculateRent函数来计算租用一定时间所需要花费的MTK数量。这里我们设置了固定的费用，即每租用一个小时需要花费10个MTK。

    ```solidity
    //计算租金
    function calculateRent(uint256 duration) internal pure returns (uint256) {
        //定义租金逻辑，根据租用的时间来计算租金
        uint256 hourlyRate = 10; //每小时的租金为10个代币
        return hourlyRate * duration;   //duration的单位是小时
    }
    ```

- 给用户分发汽车NFT，用于测试

    为了实现对合约的测试，我们需要给现有的汽车用户发放汽车NFT。

    我们编写了distributeCar()函数，对每个申请车辆分发的用户，我们创建一个NFT并且存入cars中保存，更新记录汽车数目的变量totalCars，同时维护userOwnedCars便于用于查询自己拥有的汽车。

    ```solidity
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
    ```

## 项目运行截图

在`frontend`目录下运行`npm start`，即可打开如下图所示的网页，显示出我们的汽车租赁系统的初始界面。当前状态下没有连接钱包，因此也没有显示用户相关的信息。

<img src="pictures\1.png" width="300">

点击“连接钱包”按钮，会跳出如下图所示的界面，与浏览器的MetaMask进行连接

<img src="pictures\2.png" width="300">

连接成功之后，我们刷新页面，可以看到此时“当前用户”已经变成了连接上的Ganache本地账户，目前这个账户的积分数量为0.

<img src="pictures\3.png" width="300">

点击“领取积分空投”按钮，网页会显示这笔交易，确认之后刷新页面，看到当前用户获得了1000个积分的空投。

<img src="pictures\4.png" width="300">

<img src="pictures\5.png" width="300">

<img src="pictures\6.png" width="300">

点击“领取一辆车”按钮，可以调用合约中的`distributeCar()`函数，给当前用户分发一辆汽车。
<img src="pictures\7.png"  width="300">

<img src="pictures\8.png"  width="300">

这里我们给当前用户分配了两次汽车后，查询当前用户的车辆，得到结果，页面显示用户所有的汽车的ID和对应图片（汽车ID从0开始依次增加，这里在截图之前已经给另一个用户分配了两辆车）
<img src="pictures\9.png"  width="300">

继续测试其他功能，我们点击查询当前可供租用的车辆，得到对应的显示。
<img src="pictures\10.png"  width="300">

测试查询车辆信息功能，输入汽车ID点击查询按钮，得到这辆车的对应信息。
<img src="pictures\11.png"  width="300">

测试借车功能，这里我们切换了账户，用另一个账户来租赁刚刚分配的3号汽车，租借2个小时。页面跳出了对应的transaction提示，我们点击确认之后得到借车成功的反馈信息。

<img src="pictures\12.png"  width="300">

<img src="pictures\13.png"  width="300">

<img src="pictures\14.png"  width="300">

刷新之后我们发现这次借车花费了当前账户20个代币（从990个代币减少到了970个），再次查询可租用的车辆发现已经没有3号汽车了。

<img src="pictures\15.png"  width="300">

<img src="pictures\17.png"  width="300">

查询3号汽车的信息，发现借用人和借用到期时间都已经被更新。

<img src="pictures\16.png"  width="300">

至此，我们测试了本汽车租赁系统的所有功能，可以看见本系统已经实现了所有要求的功能。

## 参考内容

- 课程的参考Demo见：[DEMOs](https://github.com/LBruyne/blockchain-course-demos)。

- ERC-4907 [参考实现](https://eips.ethereum.org/EIPS/eip-4907)
