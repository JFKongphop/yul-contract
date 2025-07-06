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

  const TRANSFER_EVENT = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
  const APPROVAL_EVENT = '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925';
  const APPROVAL_FOR_ALL_EVENT = '0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31';

  before(async () => {    
    [user1, user2, user3] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory([], bytecode);
    const contract = await Contract.deploy();
    contractAddress = await contract.getAddress();
  });

  describe('Initial Value', async () => {
    it('Should return curent toke id', async () => {
      const result = await providerCall('currentTokenId', []);

      expect(Number(result)).equal(0);
    });
  });

  describe('Mint', async () => {
    it('Should return balance and owner of token', async () => {
      const tokenId = await providerCall('currentTokenId', []);
      
      await signerCall(user1, 'mint', []);

      const balanceOf = await providerCall('balanceOf', [user1.address]);
      const ownerOfTokenId = await providerCall('ownerOf', [0]);

      const logs = await getLogs(TRANSFER_EVENT);
      const { topics } = logs[0];
      const [_, fromAddress, toAddress, tokenIdOwner] = topics;

      expect(Number(tokenId)).equal(Number(tokenIdOwner));
      expect(fromAddress).equal(zeroPadValue(contractAddress));
      expect(toAddress).equal(zeroPadValue(user1.address));
      expect(Number(balanceOf)).equal(1);
      expect(ownerOfTokenId).equal(zeroPadValue(user1.address));
    });
  });

  describe('SetApprovalForAll and IsApprovedForAll', async () => {
    it('Should return is approve for all', async () => {
      await signerCall(user1, 'setApprovalForAll', [user2.address, true]);

      const approved = await providerCall('isApprovedForAll', [user1.address, user2.address]);
      const logs = await getLogs(APPROVAL_FOR_ALL_EVENT);
      const { data, topics } = logs[0];
      const [_, owner, operator] = topics;

      expect(data).equal(approved);
      expect(owner).equal(zeroPadValue(user1.address));
      expect(operator).equal(zeroPadValue(user2.address));
      expect(Number(approved)).equal(Number(true));
    });
  });
});