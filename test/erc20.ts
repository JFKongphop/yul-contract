import { expect, use } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import bytecode from '../build/ERC20/ERC20.bytecode.json';
import { hexEncoder, keccakEncoder, zeroPadValue } from './utils/encode';
import { getLogs, providerCall, signerCall } from './utils/call';

describe('YUL', async () => {
  let contractAddress: string;
  let user1: SignerWithAddress; 
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  const transferEvent = keccakEncoder('Transfer(address indexed from, address indexed to, uint256 value)');
  const approveEvent = keccakEncoder('Approval(address indexed owner, address indexed spender, uint256 value)');
  const invalidBalance = zeroPadValue(hexEncoder('Invalid Balance'));

  before(async () => {    
    [user1, user2, user3] = await ethers.getSigners();
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
      const totalSupply = await providerCall('totalSupply', []);
      const expectMintAmount = Number(mintValue) / Number(price);
      

      const logs = await getLogs(transferEvent);
      const {data, topics} = logs[0];
      const [_, fromAddress, toAddress] = topics;

      const contractBalance = await ethers.provider.getBalance(contractAddress);
      const balanceOf = await providerCall('balanceOf', [user1.address]);

      expect(data).equal(totalSupply);
      expect(fromAddress).equal(zeroPadValue('0x'));
      expect(toAddress).equal(zeroPadValue(user1.address));
      expect(Number(totalSupply)).equal(expectMintAmount);
      expect(contractBalance).equal(mintValue);
      expect(Number(balanceOf)).equal(expectMintAmount);
    });

    it('Should return mint data from user2', async () => {
      const mintValue = ethers.parseEther('0.1');
      await signerCall(user2, 'mint', [], mintValue);

      const price = await providerCall('price', []);
      const totalSupply = await providerCall('totalSupply', []);
      
      const contractBalance = await ethers.provider.getBalance(contractAddress);
      const balanceOfUser1 = await providerCall('balanceOf', [user1.address]);
      const balanceOfUser2 = await providerCall('balanceOf', [user2.address]);
      const totalBalanceOf = Number(balanceOfUser1) + Number(balanceOfUser2);
      
      const expectContractBalance = Number(price) * totalBalanceOf;
      const expectMintAmount = Number(mintValue) / Number(price);
      
      const logs = await getLogs(transferEvent);
      
      const {data, topics} = logs[1];
      const [_, fromAddress, toAddress] = topics;

      expect(Number(data)).equal(expectMintAmount);
      expect(fromAddress).equal(zeroPadValue('0x'));
      expect(toAddress).equal(zeroPadValue(user2.address));
      expect(Number(totalSupply)).equal(totalBalanceOf);
      expect(Number(contractBalance)).equal(expectContractBalance);
    });
  });

  describe('Transfer', async () => {
    it('Should revert transfer invalid balance', async () => {
      const balanceOf = Number(await providerCall('balanceOf', [user1.address]));
      const transferAmount = balanceOf + 1;
      const error = await signerCall(user1, 'transfer', [user3.address, transferAmount]);

      expect(error).equal(invalidBalance);
    });

    it('Should return transfer from user 1 to user 3', async () => {
      const balanceOfUser1BeforeTransfer = Number(await providerCall('balanceOf', [user1.address]));
      const transferAmount = balanceOfUser1BeforeTransfer * 0.2;

      await signerCall(user1, 'transfer', [user3.address, transferAmount]);
   
      const balanceOfAfterTransfer = Number(await providerCall('balanceOf', [user1.address]));
      const balanceOfUser3Transfer = Number(await providerCall('balanceOf', [user3.address]));
      const expectedUser1BalanceOfAfterTransfer = balanceOfUser1BeforeTransfer - transferAmount;
      
      const logs = await getLogs(transferEvent);
      const {data, topics} = logs[2];
      const [_, fromAddress, toAddress] = topics;
      
      expect(balanceOfAfterTransfer).equal(expectedUser1BalanceOfAfterTransfer);
      expect(balanceOfUser3Transfer).equal(transferAmount);
      expect(Number(data)).equal(transferAmount);
      expect(fromAddress).equal(zeroPadValue(user1.address));
      expect(toAddress).equal(zeroPadValue(user3.address));
    });
  });

  describe('Approve', async () => {
    it('Should return approve from user1 to user 3', async () => {
      const approveAmount = 3000000000;
      await signerCall(user1, 'approve', [user3.address, approveAmount]);

      const allowanceAmount = await providerCall('allowance', [user1.address, user3.address]);

      const logs = await getLogs(approveEvent);

      const {data, topics} = logs[0];
      const [_, fromAddress, spenderAddress] = topics;

      expect(Number(allowanceAmount)).equal(approveAmount);
      expect(data).equal(allowanceAmount);
      expect(fromAddress).equal(zeroPadValue(user1.address));
      expect(spenderAddress).equal(zeroPadValue(user3.address));
    });
  });

  describe('TransferForm', async () => {
    it('Should revert transferForm invalid balance', async () => {
      const approveAmount = 8000000001;
      const error = await signerCall(user3, 'transferFrom', [user1.address, user2.address, approveAmount]);

      expect(error).equal(invalidBalance);
    });

    it('Should return transferForm user1 spended by user3 to user2', async () => {
      const approveSpendAmount = 500000000;

      const allowanceBeforeTransferForm = await providerCall('allowance', [user1.address, user3.address]);
      const balanceOfUser1BeforeTransferForm = await providerCall('balanceOf', [user1.address]);
      const balanceOfUser2BeforeTransferForm = await providerCall('balanceOf', [user2.address]);

      await signerCall(user3, 'transferFrom', [user1.address, user2.address, approveSpendAmount]);

      const allowanceAfterTransferFrom = await providerCall('allowance', [user1.address, user3.address]);
      const balanceOfUser1AfterTransferFrom = await providerCall('balanceOf', [user1.address]);
      const balanceOfUser2AfterTransferFrom = await providerCall('balanceOf', [user2.address]);

      const expectedAllowanceAfterTransferFrom = Number(allowanceBeforeTransferForm) - approveSpendAmount;
      const expectedUser1BalanceOfAfterTransferFrom = Number(balanceOfUser1BeforeTransferForm) - approveSpendAmount;
      const expectedUser2BalanceOfAfterTransferFrom = Number(balanceOfUser2BeforeTransferForm) + approveSpendAmount;

      const logs = await getLogs(transferEvent);
      const {data, topics} = logs[3];
      const [_, fromAddress, toAddress] = topics;

      expect(Number(allowanceAfterTransferFrom)).equal(expectedAllowanceAfterTransferFrom);
      expect(Number(balanceOfUser1AfterTransferFrom)).equal(expectedUser1BalanceOfAfterTransferFrom);
      expect(Number(balanceOfUser2AfterTransferFrom)).equal(expectedUser2BalanceOfAfterTransferFrom);
      expect(Number(data)).equal(approveSpendAmount);
      expect(fromAddress).equal(zeroPadValue(user1.address));
      expect(toAddress).equal(zeroPadValue(user2.address))
    });
  });

  describe('Burn', async () => {
    it('Should return burn token from user 1', async () => {
      const contractBalanceBeforeBurn = await ethers.provider.getBalance(contractAddress);    
      const balanceOfUser1EthBeforeBurn = await ethers.provider.getBalance(user1.address);
      const balanceOfUser1BeforeBurn = await providerCall('balanceOf', [user1.address]);
      const totalSupplyBeforeBurn = await providerCall('totalSupply', []);
      const price = await providerCall('price', []);

      const burnAmount = Number(balanceOfUser1BeforeBurn)
      await signerCall(user1, 'burn', [burnAmount]);

      const contractBalanceAfterBurn = await ethers.provider.getBalance(contractAddress);
      const balanceOfUser1EthAfterBurn = await ethers.provider.getBalance(user1.address);
      const balanceOfUser1AfterBurn = await providerCall('balanceOf', [user1.address]);
      const totalSupplyAfterBurn = await providerCall('totalSupply', []);


      const differentUser1EthBalance = Number(balanceOfUser1EthAfterBurn) - Number(balanceOfUser1EthBeforeBurn);
      const expectedContractBalanceAfterBurn = Number(totalSupplyAfterBurn) * Number(price);
      const expectedContractBalanceBeforeBurn = Number(totalSupplyBeforeBurn) * Number(price);
      const expectedTotalSupplyAfterBurn = Number(totalSupplyBeforeBurn) - burnAmount; 

      expect(Number(contractBalanceBeforeBurn)).equal(expectedContractBalanceBeforeBurn);
      expect(Number(contractBalanceAfterBurn)).equal(expectedContractBalanceAfterBurn);
      expect(Number(totalSupplyAfterBurn)).equal(expectedTotalSupplyAfterBurn);
      expect(Number(balanceOfUser1AfterBurn)).equal(0);
    });
  });
});