import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { dataEncoder } from "./encode";
import { hexDecoder } from "./decode";
import { Log } from "ethers";

const address = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

export const signerCall = async (
  user: SignerWithAddress, 
  name: string, 
  params?: any[],
  value?: bigint
): Promise<string> => {
  const data = dataEncoder(name, params);
  try {
    const tx = await user.sendTransaction({
      to: address,
      data,
      value,
    });
    await tx.wait();

    return 'Success';
  } catch (e: any) {
    return hexDecoder(e.data)
  }
}

export const providerCall = async (name: string, params?: any[]): Promise<string> => {
  const data = dataEncoder(name, params);
  return await ethers.provider.call({
    to: address,
    data,
  });
}

export const getLogs = async (topics: string): Promise<Log[]> => {
  const logs = await ethers.provider.getLogs({
    fromBlock: 0, 
    toBlock: "latest",
    address: address,
    topics: [topics]
  });

  return logs;
}