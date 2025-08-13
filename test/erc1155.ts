import { split32Bytes } from './utils/splitData';
import { expect, use } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import bytecode from '../build/ERC1155/ERC1155.bytecode.json';
import { dataEncoder, hexEncoder, keccakEncoder, zeroPadBytes, zeroPadValue } from './utils/encode';
import { getLogs, providerCall, signerCall } from './utils/call';
import { singleByteArrayDecode, hexDecoder, doubleByteArrayDecode } from './utils/decode';
import { ZeroAddress } from 'ethers';

const callBalanceBatch = async (addresses: unknown[], ids: number[]) => await providerCall(
  'balanceOfBatch',
  [
    addresses,
    ids
  ]
);

describe('ERC1155', async () => {
  let contractAddress: string;
  let user1: SignerWithAddress; 
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let user4: SignerWithAddress;
  let user5: SignerWithAddress;
  const ids = [1, 2, 3];
  const values = [7, 5, 9];

  const TransferSingle = '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62';
  const TransferBatch = '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb';
  const ApprovalForAll = '0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31';



  before(async () => {    
    [user1, user2, user3, user4, user5] = await ethers.getSigners();
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
    it('Should revert ZERO_ADDRESS', async () => {
      const error = await signerCall(user1, 'mint', [ZeroAddress, 1, 1]);

      expect(error).equal(zeroPadBytes(hexEncoder('ZERO_ADDRESS')));
    });

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
    const addresses = [user1.address, user2.address, user3.address];
    const ids = [1, 2, 3];

    it('Should revert LENGTH_MISMATCH', async () => {
      const sliceIds = ids.slice(1);
      
      const error = await signerCall(user1, 'balanceOfBatch', [
        addresses,
        sliceIds.slice(1)
      ]);

      expect(error).equal(zeroPadBytes(hexEncoder('LENGTH_MISMATCH')));
    });

    it('should return balanceOfBatch from user 1-3', async () => {
      const result = await providerCall('balanceOfBatch', [
        addresses, 
        ids
      ]);

      const arrayElements = singleByteArrayDecode(result);

      expect(arrayElements).deep.equal(values)
    });
  });

  describe('BatchMint', async () => {
    const ids = [4, 5];
    const values = [1, 2];

    it('Should revert ZERO_ADDRESS', async () => {
      const error = await signerCall(user1, 'batchMint', [
        ZeroAddress,
        ids,
        values
      ]);

      expect(error).equal(zeroPadBytes(hexEncoder('ZERO_ADDRESS')));
    });

    it('Should revert LENGTH_MISMATCH', async () => {
      const sliceIds = ids.slice(1);
      
      const error = await signerCall(user1, 'batchMint', [
        user1.address,
        sliceIds,
        values
      ]);

      expect(error).equal(zeroPadBytes(hexEncoder('LENGTH_MISMATCH')));
    });

    it('Should return batchMint from user 1', async () => {
      await signerCall(user1, 'batchMint', [
        user1.address,
        ids,
        values,
      ]);
      
      const result = await providerCall('balanceOfBatch', [
        [user1.address, user1.address],
        ids
      ]);

      const arrayElements = singleByteArrayDecode(result);
      
      const logs = await getLogs(TransferBatch);
      const { data } = logs[0];
      const [idsFromLog, valueFromlog] = doubleByteArrayDecode(data);
      
      expect(arrayElements).deep.equal(values);
      expect(idsFromLog).deep.equal(ids);
      expect(valueFromlog).deep.equal(values);
    });
  });

  describe('IsApprovedForAll', async () => {
    it('Should return setApprovalForAll in log', async () => {
      await signerCall(user1, 'setApprovalForAll', [user1.address, true]);

      const logs = await getLogs(ApprovalForAll);

      const { data, topics } = logs[0];
      const [_, from, operator] = topics;

      expect(Boolean(data)).true;
      expect(from).equal(zeroPadValue(user1.address));
      expect(operator).equal(zeroPadValue(user1.address))
    });

    it('Should return isApprovedForAll is true', async () => {
      const result = await providerCall('isApprovedForAll', [user1.address, user1.address]);
      
      expect(Boolean(result)).true;
    });
  });

  describe('SafeTranferFrom', async () => {
    const id = 1;
    const value = 5;
    
    it('Should revert from and caller mismtach NOT_APPROVE', async () => {
      const error = await signerCall(
        user1, 
        'safeTransferFrom', 
        [user2.address, user4.address, id, value]
      );

      expect(error).equal(zeroPadBytes(hexEncoder('NOT_APPROVE')));
    });

    it('Should revert zero address', async () => {
      const error = await signerCall(
        user1, 
        'safeTransferFrom', 
        [user1.address, ethers.ZeroAddress, id, value]
      );

      expect(error).equal(zeroPadBytes(hexEncoder('ZERO_ADDRESS')));
    });

    it('Should return safeTransferFrom', async () => {
      const user1BalanceBeforeTransfer = await providerCall('balanceOf', [user1.address, id]);
      const user4BalanceBeforeTransfer = await providerCall('balanceOf', [user4.address, id]);

      await signerCall(user1, 'safeTransferFrom', [user1.address, user4.address, id, value]);

      const user1BalanceAfterTransfer = await providerCall('balanceOf', [user1.address, id]);
      const user4BalanceAfterTransfer = await providerCall('balanceOf', [user4.address, id]);

      const logs = await getLogs(TransferSingle);
      const { data, topics } = logs[3];
      const [idData, valueData] = split32Bytes(data);
      const [,, from, to] = topics;

      const sumBalanceBeforeTransfer = Number(user1BalanceBeforeTransfer) + Number(user4BalanceBeforeTransfer);
      const sumBalanceAfterTransfer = Number(user1BalanceAfterTransfer) + Number(user4BalanceAfterTransfer);

      expect(sumBalanceBeforeTransfer).equal(sumBalanceAfterTransfer);
      expect(Number(user4BalanceAfterTransfer)).equal(value);
      expect(Number(idData)).equal(id);
      expect(Number(valueData)).equal(value);
      expect(from).equal(zeroPadValue(user1.address));
      expect(to).equal(zeroPadValue(user4.address));
    });
  });

  describe('SafeBatchTransferFrom', async () => {
    const ids = [1, 4, 5];
    const values = [1, 1, 1];

    it('Should revert from and caller mismtach NOT_APPROVE', async () => {
      const error = await signerCall(user1, 'safeBatchTransferFrom', [
        user2.address,
        user5.address,
        ids,
        values
      ]);

      expect(error).equal(zeroPadBytes(hexEncoder('NOT_APPROVE')));
    });

    it('Should revert ZERO_ADDRESS', async () => {
      const error = await signerCall(user1, 'safeBatchTransferFrom', [
        user1.address,
        ZeroAddress,
        ids,
        values
      ]);

      expect(error).equal(zeroPadBytes(hexEncoder('ZERO_ADDRESS')));
    });

    it('Should revert LENGTH_MISMATCH', async () => {
      const sliceIds = ids.slice(1);
      
      const error = await signerCall(user1, 'safeBatchTransferFrom', [
        user1.address,
        user5.address,
        sliceIds,
        values
      ]);

      expect(error).equal(zeroPadBytes(hexEncoder('LENGTH_MISMATCH')));
    });
    
    it('Should return safe batch transfer from', async () => {
      const user1Addresses = Array.from({ length: 3 }).fill(user1.address);
      const user5Addresses = Array.from({ length: 3 }).fill(user5.address);

      const user1BalancesBeforeTransfer = await callBalanceBatch(user1Addresses, ids);
      const balanceUser1BeforeElemets = singleByteArrayDecode(user1BalancesBeforeTransfer);

      await signerCall(user1, 'safeBatchTransferFrom', [
        user1.address,
        user5.address,
        ids,
        values
      ]);

      const user1BalancesAfterTransfer = await callBalanceBatch(user1Addresses, ids);
      const user5BalancesAfterTransfer = await callBalanceBatch(user5Addresses, ids);

      const balanceUser1AfterElemets = singleByteArrayDecode(user1BalancesAfterTransfer);
      const balanceUser5AfterElemets = singleByteArrayDecode(user5BalancesAfterTransfer);

      const expectedUser1BalancesAfterTransfer = balanceUser1BeforeElemets.map(
        (value, index) => value - values[index]
      );

      expect(balanceUser1AfterElemets).deep.equal(expectedUser1BalancesAfterTransfer);
      expect(balanceUser5AfterElemets).deep.equal(values);      
      
      const logs = await getLogs(TransferBatch);
      const { data } = logs[1];
      const [idsFromLog, valueFromlog] = doubleByteArrayDecode(data);

      expect(idsFromLog).deep.equal(ids);
      expect(valueFromlog).deep.equal(values);
    });
  });

  describe('Burn', async () => {
    const id = 1;
    const value = 1;

    it('Should revert ZERO_ADDRESS', async () => {
      const error = await signerCall(user1, 'burn', [ZeroAddress, id, value]);

      expect(error).equal(zeroPadBytes(hexEncoder('ZERO_ADDRESS')));
    });

    it('Should return burn from user1', async () => {
      await signerCall(user1, 'burn', [user1.address, id, value]);
      
      const user1BalanceOfId1 = await providerCall('balanceOf', [user1.address, id]);

      const logs = await getLogs(TransferSingle);
      const { data, topics } = logs[4];
      const [,owner, from,] = topics;

      const [idData, valueData] = split32Bytes(data);

      expect(Number(idData)).equal(id);
      expect(Number(valueData)).equal(value);
      expect(owner).equal(from);
      expect(Number(user1BalanceOfId1)).equal(0);      
    });
  });

  describe('BatchBurn', async () => {
    const ids = [1, 4, 5];
    const values = [1, 1, 1];

    it('Should revert ZERO_ADDRESS', async () => {
      const error = await signerCall(user5, 'batchBurn', [ZeroAddress, ids, values]);

      expect(error).equal(zeroPadBytes(hexEncoder('ZERO_ADDRESS')));
    });

    it('Should revert LENGTH_MISMATCH', async () => {
      const sliceIds = ids.slice(1);
      
      const error = await signerCall(user5, 'batchBurn', [
        user5.address,
        sliceIds,
        values
      ]);

      expect(error).equal(zeroPadBytes(hexEncoder('LENGTH_MISMATCH')));
    });

    it('Should return batchBurn by user 5', async () => {
      const user5Addresses = Array.from({ length: 3 }).fill(user5.address);

      const user5BalancesBeforeTransfer = await callBalanceBatch(user5Addresses, ids);
      const balanceUser5BeforeElemets = singleByteArrayDecode(user5BalancesBeforeTransfer);

      await signerCall(user5, 'batchBurn', [
        user5.address,
        ids,
        values
      ]);

      const user5BalancesAfterTransfer = await callBalanceBatch(user5Addresses, ids);
      const balanceUser5AfterElemets = singleByteArrayDecode(user5BalancesAfterTransfer);

      const expectedUser5BalancesAfterTransfer = balanceUser5BeforeElemets.map(
        (value, index) => value - values[index]
      );

      const logs = await getLogs(TransferBatch);
      const { data } = logs[2];
      const [idsFromLog, valueFromlog] = doubleByteArrayDecode(data);

      expect(idsFromLog).deep.equal(ids);
      expect(valueFromlog).deep.equal(values);
      expect(balanceUser5AfterElemets).deep.equal(expectedUser5BalancesAfterTransfer);
    });
  });
});