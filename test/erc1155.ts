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
      const users = [user1, user2, user3];
      const ids = [1, 2, 3];
      const values = [7, 5, 9];

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

  describe('CheckArray', async () => {
    it('Check array number', async () => {
      const iface = new ethers.Interface([`function balanceOfBatch(address[], uint256[])`]);
      const data = iface.encodeFunctionData(
        'balanceOfBatch', 
        [
          [user1.address, user2.address, user3.address], 
          [1, 2, 3]
        ]
      );

      // console.log([user1.address, user2.address, user3.address])
      
      // await user1.sendTransaction({
      //   to: contractAddress,
      //   data
      // });

      // const logs = await getLogs('0x42484c4800ad9c5b0bcd5188937750874af815464f5bd016d70fc16700b53310');
      // const a = logs[0].data
      // console.log(split32Bytes(a))
      
      const result = await ethers.provider.call({
        to: contractAddress,
        data
      });
      console.log(split32Bytes(result).map((x) => Number(x)))

    });
  });
});