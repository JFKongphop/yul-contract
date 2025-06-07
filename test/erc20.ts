import { expect } from 'chai';
import { ethers } from 'hardhat';
import { hexlify, keccak256, toUtf8Bytes } from 'ethers';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import bytecode from '../build/ERC20/ERC20.bytecode.json';
import { hexEncoder, keccakEncoder, zeroPadValue } from './utils/encode';
import { providerCall, signerCall } from './utils/call';

describe('YUL', async () => {
  let contractAddress: string;
  let user1: SignerWithAddress; 
  let user2: SignerWithAddress;

  before(async () => {    
    [user1, user2] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory([], bytecode);
    const contract = await Contract.deploy();
    contractAddress = await contract.getAddress();
  });

  describe('Initial Value', async () => {
    it('Should return total supply', async () => {
      const result = await providerCall('totalSupply', []);

      expect(Number(result)).equal(0);
    });

    it('Should return name', async () => {
      const result = await providerCall('name', []);

      expect(result).equal(ethers.zeroPadValue(hexEncoder('ETOKEN'), 32));
    });

    it('Should return symbol', async () => {
      const result = await providerCall('symbol', []);

      expect(result).equal(ethers.zeroPadValue(hexEncoder('ET'), 32));
    });

    it('Should return price', async () => {
      const result = await providerCall('price', []);

      expect(Number(result)).equal(10e5);
    });
  });

  describe('Mint', async () => {
    it('Should return mint data from user1', async () => {
      const mintValue = ethers.parseEther('0.01');
      await signerCall(user1, 'mint', [], mintValue);

      const price = await providerCall('price', []);
      const expectTotalSupply = Number(mintValue) / Number(price);
      
      const totalSupply = await providerCall('totalSupply', []);

      const transferEvent = keccakEncoder('Transfer(address indexed from, address indexed to, uint256 value)');
      const logs = await ethers.provider.getLogs({
        fromBlock: 0, 
        toBlock: "latest",
        address: contractAddress,
        topics: [transferEvent]
      });

      const {data, topics} = logs[0];
      const [_, fromAddress, toAddress] = topics;

      const contractBalance = await ethers.provider.getBalance(contractAddress);
      const balanceOf = await providerCall('balanceOf', [user1.address]);

      expect(data).equal(totalSupply);
      expect(fromAddress).equal(zeroPadValue('0x'));
      expect(toAddress).equal(zeroPadValue(user1.address));
      expect(Number(totalSupply)).equal(expectTotalSupply);
      expect(contractBalance).equal(mintValue);
      expect(Number(balanceOf)).equal(expectTotalSupply);
    });
  });
});