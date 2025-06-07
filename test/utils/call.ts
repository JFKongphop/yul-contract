import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { dataEncoder } from "./encode";
import { hexDecoder } from "./decode";

export const signerCall = async (
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

export const providerCall = async (name: string, params?: any[]): Promise<string> => {
  const data = dataEncoder(name, params);
  return await ethers.provider.call({
    to: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    data,
  });
}