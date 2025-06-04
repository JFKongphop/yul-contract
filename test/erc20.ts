import { expect } from 'chai';
import { ethers } from 'hardhat';
import { hexlify, toUtf8Bytes } from 'ethers';
import bytecode from '../build/ERC20/ERC20.bytecode.json';

describe('YUL', async () => {
  let contractAddress: string;

  before(async () => {    
    const Contract = await ethers.getContractFactory([], bytecode);
    const contract = await Contract.deploy();
    contractAddress = await contract.getAddress();
  });

  describe('Initial Value', async () => {
    it('Should return total supply', async () => {
      const iface = new ethers.Interface(["function totalSupply()"]);
      const data = iface.encodeFunctionData('totalSupply', []);

      const result = await ethers.provider.call({
        to: contractAddress,
        data,
      });

      expect(Number(result)).equal(0);
    });

    it('Should return name', async () => {
      const iface = new ethers.Interface(["function name()"]);
      const data = iface.encodeFunctionData('name', []);

      const result = await ethers.provider.call({
        to: contractAddress,
        data,
      });


      expect(result).equal(ethers.zeroPadValue(hexEncoder('ETOKEN'), 32));
    });

    it('Should return symbol', async () => {
      const iface = new ethers.Interface(["function symbol()"]);
      const data = iface.encodeFunctionData('symbol', []);

      const result = await ethers.provider.call({
        to: contractAddress,
        data,
      });


      expect(result).equal(ethers.zeroPadValue(hexEncoder('ET'), 32));
      console.log(hexEncoder('Invalid values'))
    });
  });
});

const hexEncoder = (string: string) => {
  return hexlify(toUtf8Bytes(string));
}

const hexDecoder = (hex: string) => {
  const biCharArrays = hex.match(/.{1,2}/g)!;
  const zeroCleaner = biCharArrays.filter((byte) => byte != '00');
  const base16Arrays = zeroCleaner.map((byte) => parseInt(byte, 16));

  const bytes = new Uint8Array(base16Arrays);
  return (new TextDecoder("utf-8").decode(bytes)).replace(/\n/g, '');
};