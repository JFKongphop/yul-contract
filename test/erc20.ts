import { expect } from 'chai';
import { ethers } from 'hardhat';
import { hexlify, keccak256, toUtf8Bytes } from 'ethers';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import bytecode from '../build/ERC20/ERC20.bytecode.json';

describe('YUL', async () => {
  let contractAddress: string;
  let user1: SignerWithAddress; 
  let user2: SignerWithAddress;

  before(async () => {    
    [user1, user2] = await ethers.getSigners();
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

  describe('Mint', async () => {
    it('Should return mint data', async () => {
      const mintValue = ethers.parseEther('0.01');
      await signerCall(user1, 'mint', [], mintValue);

      const price = await providerCall('price', []);
      const expectTotalSupply = Number(mintValue) / Number(price);
      
      const totalSupply = await providerCall('totalSupply', []);

      expect(Number(totalSupply)).equal(expectTotalSupply);

      const transferEvent = keccakEncoder('Transfer(address indexed from, address indexed to, uint256 value)');

      console.log(transferEvent)

      const logs = await ethers.provider.getLogs({
        fromBlock: 0, 
        toBlock: "latest",
        address: contractAddress,
        topics: [transferEvent]
      });

      const {data, topics} = logs[0];
      const [_, fromAddress, toAddress] = topics;

      expect(data).equal(totalSupply);
      expect(fromAddress).equal(zeroPadValue('0x'));
      expect(toAddress).equal(zeroPadValue(user1.address))

    });
  });
});

const signerCall = async (
  user: SignerWithAddress, 
  name: string, 
  params?: any[],
  value?: bigint
): Promise<string> => {
  const data = dataEncoder(name, params);
  try {
    const tx = await user.sendTransaction({
      to: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      data,
      value,
    });
    await tx.wait();

    return 'Success';
  } catch (e: any) {
    return hexDecoder(e.data)
  }
}

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

const keccakEncoder = (name: string): string => {
  return keccak256(toUtf8Bytes(name));
}

const zeroPadValue = (value: string): string => {
  return ethers.zeroPadValue(value, 32);
}