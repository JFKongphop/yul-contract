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

  before(async () => {    
    [user1, user2, user3] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory([], bytecode);
    const contract = await Contract.deploy();
    contractAddress = await contract.getAddress();
  });

  describe('Initial Value', async () => {
    it('Should return total supply', async () => {
      // const result = await providerCall('test', [1, user1.address]);

      // console.log(result)
      // // expect(Number(result)).equal(0);
    });
  });
});


0xc0