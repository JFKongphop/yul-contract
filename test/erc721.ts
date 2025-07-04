import { expect, use } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import bytecode from '../build/ERC721/ERC721.bytecode.json';
import { hexEncoder, keccakEncoder, zeroPadValue } from './utils/encode';
import { getLogs, providerCall, signerCall } from './utils/call';

describe('ERC721', async () => {
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
      const result = await providerCall('currentTokenId', []);

      expect(Number(result)).equal(0);
    });
  });

  describe('Mint', async () => {
    it('Should return balance and owner of token', async () => {
      await signerCall(user1, 'mint', []);

      const balanceOf = await providerCall('balanceOf', [user1.address]);
      const ownerOfTokenId = await providerCall('ownerOf', [0]);

      expect(Number(balanceOf)).equal(1);
      expect(ownerOfTokenId).equal(zeroPadValue(user1.address));
    });
  });
});