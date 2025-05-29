import { expect } from 'chai';
import { ethers } from 'hardhat';
import bytecode from '../build/ERC20/ERC20.bytecode.json';

describe('YUL', async () => {
  let contractAddress: string;

  before(async () => {    
    const Contract = await ethers.getContractFactory([], bytecode);
    const contract = await Contract.deploy();
    contractAddress = await contract.getAddress();
  });

  describe('Add', async () => {
    it('Should return add result', async () => {
      const hexA = '0xe';
      const hexB = '0x02';
      const hexC = '0x07';
      const iface = new ethers.Interface(["function add(uint256,uint256,uint256)"]);
      const calldata = iface.encodeFunctionData("add", [hexA, hexB, hexC]);

      const result = await ethers.provider.call({
        to: contractAddress,
        data: calldata
      });

      const intA = parseInt(hexA, 16);
      const intB = parseInt(hexB, 16);
      const intC = parseInt(hexC, 16);
      const expectResult = intA + intB + intC;

      expect(Number(result)).equal(expectResult);
    });
  })
})
