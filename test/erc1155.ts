import { split32Bytes } from './utils/splitData';
import { expect, use } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import bytecode from '../build/ERC1155/ERC1155.bytecode.json';
import { hexEncoder, keccakEncoder, zeroPadValue } from './utils/encode';
import { getLogs, providerCall, signerCall } from './utils/call';

describe('ERC1155', async () => {
  let contractAddress: string;
  let user1: SignerWithAddress; 
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

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
    it('Should return mint from user1', async () => {
      const id = 1;
      const value = 2;
      await signerCall(user1, 'mint', [user1.address, id, value]);

      const result = await providerCall('balanceOf', [user1.address, id]);

      const logs = await getLogs(TransferSingle);
      const { data, topics } = logs[0];

      const [nftId, nftValue] = split32Bytes(data);
      const [_, to, from, __] = topics; 

      expect(Number(nftId)).equal(id);
      expect(Number(nftValue)).equal(value);
      expect(Number(result)).equal(value);
      expect(to).equal(zeroPadValue(user1.address));
      expect(from).equal(zeroPadValue(contractAddress));
    });
  });
});


0xc0