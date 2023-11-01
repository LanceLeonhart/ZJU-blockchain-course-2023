import { Button, Image } from 'antd';
import { Header } from "../../asset";
import { useEffect, useState } from 'react';
import { bycContract, myERC20Contract, web3 } from "../../utils/contracts";
import './index.css';
import React from 'react';

const GanacheTestChainId = '0x539'; // Ganache默认的ChainId = 0x539 = Hex(1337)
const GanacheTestChainName = 'Ganache Test Chain';
const GanacheTestChainRpcUrl = 'http://127.0.0.1:8545';

const BycPage = () => {
  const [account, setAccount] = useState('');
  const [accountBalance, setAccountBalance] = useState(0);
  const [queriedOwnedCars, setQueriedOwnedCars] = useState([]);
  const [queriedAvailableCars, setQueriedAvailableCars] = useState([]);
  const [carOwner, setCarOwner] = useState('');
  const [currentBorrower, setCurrentBorrower] = useState('');
  const [borrowUntil, setBorrowUntil] = useState(0);
  const [carTokenIdInput, setCarTokenIdInput] = useState('');
  const [carTokenId2, setCarTokenId2] = useState('');
  const [duration, setDuration] = useState('');

  useEffect(() => {
    // 初始化检查用户是否已经连接钱包
    // 查看window对象里是否存在ethereum（metamask安装后注入的）对象
    const initCheckAccounts = async () => {
      // @ts-ignore
      const { ethereum } = window;
      if (Boolean(ethereum && ethereum.isMetaMask)) {
        // 尝试获取连接的用户账户
        const accounts = await web3.eth.getAccounts();
        if (accounts && accounts.length) {
          setAccount(accounts[0]);
        }
      }
    };

    initCheckAccounts();
  }, []);

  useEffect(() => {
    const getAccountInfo = async () => {
      if (myERC20Contract) {
        const ab = await myERC20Contract.methods.balanceOf(account).call();
        setAccountBalance(ab);
      } else {
        alert('Contract not exists.');
      }
    }

    if (account !== '') {
      getAccountInfo();
    }
  }, [account]);

  const queryOwnedCars = async () => {
    if (account === '') {
      alert('You have not connected wallet yet.');
      return;
    }

    if (!bycContract) {
      alert('Contract does not exist.');
      return;
    }

    try {
      const ownedCars = await bycContract.methods.getOwnedCars().call({ from: account });
      setQueriedOwnedCars(ownedCars);
    } catch (error) {
      alert('查询拥有的车辆失败：' );
    }
  };

  const queryAvailableCars = async () => {
    if (account === '') {
      alert('You have not connected wallet yet.');
      return;
    }

    if (!bycContract) {
      alert('Contract not exists.');
      return;
    }

    try {
      const availableCars = await bycContract.methods.getAvailableCars().call({ from: account });
      setQueriedAvailableCars(availableCars);
    } catch (error) {
      alert('查询可租用的车辆失败：' );
    }
  };

  const onClaimTokenAirdrop = async () => {
    if (account === '') {
      alert('You have not connected wallet yet.');
      return;
    }

    if (myERC20Contract) {
      try {
        await myERC20Contract.methods.airdrop().send({
          from: account
        });
        alert('You have claimed Token Airdrop.');
      } catch (error: any) {
        alert(error.message);
      }
    } else {
      alert('Contract not exists.');
    }
  };

  const onClaimDistributeCar = async () => {
    if (account === '') {
      alert('You have not connected wallet yet.');
      return;
    }

    if (bycContract) {
      try {
        await bycContract.methods.distributeCar().send({
          from: account
        });
        alert('You have got a car.');
      } catch (error: any) {
        alert(error.message);
      }
    } else {
      alert('Contract not exists.');
    }
  }

  // 处理用户输入的 carTokenId
  const handleCarTokenIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCarTokenIdInput(event.target.value);
  }

  const handleCarTokenId2Change = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCarTokenId2(event.target.value);
  }

  const handleDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDuration(event.target.value);
  }

  const queryCarInfo = async () => {
    const carTokenId = carTokenIdInput.trim(); // 去除输入的空格
    if (!bycContract || !carTokenId) {
      alert('请输入有效的carTokenId并确保合约存在');
      return;
    }  
    try {
      const result = await bycContract.methods.getCarInfo(carTokenId).call();
      const owner = result[0];
      const borrower = result[1];
      const borrowUntil = result[2];

      setCarOwner(owner);
      setCurrentBorrower(borrower);
      setBorrowUntil(borrowUntil);
    } catch (error) {
      alert('查询汽车信息失败');
    }
  }

  const borrowCar = async () => {
    if (!carTokenId2 || !duration) {
      alert('请提供借车信息');
      return;
    }

    try {
      // 将字符串转换为数字
      const carId = parseInt(carTokenId2);
      const hours = parseInt(duration);
      
      await myERC20Contract.methods.approve(bycContract.options.address, 10 * hours).send({ from: account });
      await bycContract.methods.borrowCar(carId, hours).send({ from: account });
      alert('借车成功！');
    } catch (error) {
      alert('借车失败');
    }
  }

  const onClickConnectWallet = async () => {
    // 查看window对象里是否存在ethereum（metamask安装后注入的）对象
    // @ts-ignore
    const { ethereum } = window;
    if (!Boolean(ethereum && ethereum.isMetaMask)) {
      alert('MetaMask is not installed!');
      return;
    }

    try {
      // 如果当前小狐狸不在本地链上，切换Metamask到本地测试链
      if (ethereum.chainId !== GanacheTestChainId) {
        const chain = {
          chainId: GanacheTestChainId,
          chainName: GanacheTestChainName,
          rpcUrls: [GanacheTestChainRpcUrl]
        };

        try {
          await ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chain.chainId }] });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await ethereum.request({ method: 'wallet_addEthereumChain', params: [chain] });
          }
        }
      }

      await ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      setAccount(accounts[0] || 'Not able to get accounts');
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className='container'>
      <Image
        width='600px'
        height='300px'
        preview={false}
        src={Header}
      />
      <div className='main'>
        <h1>汽车租赁系统</h1>
        <Button onClick={onClaimTokenAirdrop}>领取积分空投</Button>
        <Button onClick={onClaimDistributeCar}>领取一辆汽车</Button>
        <div className='account'>
          {account === '' && <Button onClick={onClickConnectWallet}>连接钱包</Button>}
          <div>当前用户：{account === '' ? '无用户连接' : account}</div>
          <div>当前用户拥有积分数量：{account === '' ? 0 : accountBalance}</div>
        </div>
        <div>
          <Button onClick={queryOwnedCars}>查询当前用户的车辆</Button>
          <Button onClick={queryAvailableCars}>查询可租用的车辆</Button>
        </div>
        
        <div className='result-container'>
            <div className='result'>
                <h2>我的车辆</h2>
                <ul>
                    {queriedOwnedCars.map((car, index) => (
                        <li key={index}>
                        <Image
                            width={200} // 设置图片宽度
                            src={`/CarPictures/${car}.jpg`} // 使用构建好的图片URL
                            alt={`Car ${car}`} // 图片的描述文本
                        />
                        <p>车辆ID：{car}</p>
                    </li>
                    ))}
                </ul>
            </div>
            <div className='result'>
                <h2>可租用的车辆</h2>
                <ul>
                    {queriedAvailableCars.map((car, index) => (
                        <li key={index}>
                        <Image
                            width={200} // 设置图片宽度
                            src={`/CarPictures/${car}.jpg`} // 使用构建好的图片URL
                            alt={`Car ${car}`} // 图片的描述文本
                        />
                        <p>车辆ID：{car}</p>
                    </li>
                    ))}
                </ul>
            </div>
        </div>
        
        <div>
            <label>Car Token ID：</label>
            <input
                type="text"
                placeholder="输入 carTokenId"
                value={carTokenIdInput}
                onChange={handleCarTokenIdChange}
            />
            <Button onClick={queryCarInfo}>查询汽车信息</Button>
            <div>
                <h2>汽车信息</h2>
                {carOwner ? (
                <div>
                    <Image
                    width={200} // 设置图片宽度
                    src={`/CarPictures/${carTokenIdInput}.jpg`} // 使用构建好的图片URL
                    alt={`Car ${carTokenIdInput}`} // 图片的描述文本
                    />
                    <p>车辆主人：{carOwner}</p>
                    <p>当前借用者：{currentBorrower}</p>
                    <p>借用截止时间：{borrowUntil}</p>
                </div>
                ) : (
                <p>暂无</p>
                )}
            </div>
        </div>
        
        <div>
            <h2>借车</h2>
            <div>
                <label>Car Token ID：</label>
                <input type="number" value={carTokenId2} onChange={handleCarTokenId2Change} />
            </div>
            <div>
                <label>借用小时数：</label>
                <input type="number" value={duration} onChange={handleDurationChange} />
            </div>
            <Button type="primary" onClick={borrowCar}>借用汽车</Button>
        </div>

      </div>
    </div>
  );
}

export default BycPage;