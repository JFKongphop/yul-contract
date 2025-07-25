import { split32Bytes } from './utils/splitData';
import { expect, use } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import bytecode from '../build/ERC1155/ERC1155.bytecode.json';
import { dataEncoder, hexEncoder, keccakEncoder, zeroPadValue } from './utils/encode';
import { getLogs, providerCall, signerCall } from './utils/call';
import { BytesLike } from 'ethers';

describe('ERC1155', async () => {
  let contractAddress: string;
  let user1: SignerWithAddress; 
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  const ids = [1, 2, 3];
  const values = [7, 5, 9];

  const TransferSingle = '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62';
  const TransferBatch = '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb';
  const ApprovalForAll = '0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31';

  before(async () => {    
    [user1, user2, user3] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory([], bytecode);
    const contract = await Contract.deploy();
    contractAddress = await contract.getAddress();
  });

  describe('Initial Value', async () => {
    it('Should return balanceOf user1', async () => {
      const result = await providerCall('balanceOf', [user1.address, 1]);

      expect(Number(result)).equal(0);
    });
  });

  describe('Mint', async () => {
    it('Should return mint from users', async () => {
      const users = [user1, user2, user3];

      for (let i = 0; i < 3; i++) {
        const user = users[i];
        const id = ids[i];
        const value = values[i];
        await signerCall(user, 'mint', [user.address, id, value]);
  
        const result = await providerCall('balanceOf', [user.address, id]);
  
        const logs = await getLogs(TransferSingle);
        const { data, topics } = logs[i];
  
        const [nftId, nftValue] = split32Bytes(data);
        const [_, to, from, __] = topics; 
  
        expect(Number(nftId)).equal(id);
        expect(Number(nftValue)).equal(value);
        expect(Number(result)).equal(value);
        expect(to).equal(zeroPadValue(user.address));
        expect(from).equal(zeroPadValue(contractAddress));
      }
    });
  });

  describe('BalanceOfBatch', async () => {
    it('should return balanceOfBatch from user 1-3', async () => {
      const result = await providerCall('balanceOfBatch', [
        [user1.address, user2.address, user3.address], 
        [1, 2, 3]
      ]);

      const arrayElements = new ethers.AbiCoder().decode(
        ['uint[]'],
        result
      )[0].map((x: BigInt) => Number(x));

      expect(arrayElements).deep.equal(values)
    });
  });

  describe('BatchMint', async () => {
    it('Should return batchMint from log', async () => {
      const ids = [4, 5];
      const values = [1, 2];
      
      await signerCall(user1, 'batchMint', [
        user1.address,
        ids,
        values,
      ]);
      
      const result = await providerCall('balanceOfBatch', [
        [user1.address, user1.address],
        ids
      ]);

      const arrayElements = new ethers.AbiCoder().decode(
        ['uint[]'],
        result
      )[0].map((x: BigInt) => Number(x));
      
      const logs = await getLogs(TransferBatch);
      const { data } = logs[0];
      const [idsFromLog, valueFromlog] = new ethers.AbiCoder().decode(
        ['uint[]', 'uint[]'], 
        data
      );
      
      expect(arrayElements).deep.equal(values);
      expect(idsFromLog).deep.equal(ids);
      expect(valueFromlog).deep.equal(values);
    });
  });
});