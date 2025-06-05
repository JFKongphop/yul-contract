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
});

const providerCall = async (name: string, params?: any[]): Promise<string> => {
  const data = dataEncoder(name, params);
  return await ethers.provider.call({
    to: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    data,
  });
}

const dataEncoder = (name: string, params?: any[]): string => {
  const iface = new ethers.Interface([`function ${name}()`]);
  return iface.encodeFunctionData(name, params);
}

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