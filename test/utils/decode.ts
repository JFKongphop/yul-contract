import { ethers } from 'ethers';

export const hexDecoder = (hex: string) => {
  const biCharArrays = hex.match(/.{1,2}/g)!;
  const zeroCleaner = biCharArrays.filter((byte) => byte != '00');
  const base16Arrays = zeroCleaner.map((byte) => parseInt(byte, 16));

  const bytes = new Uint8Array(base16Arrays);
  return (new TextDecoder("utf-8").decode(bytes)).replace(/\n/g, '');
};

export const singleByteArrayDecode = (bytes: string): number[] => {
  return new ethers.AbiCoder().decode(
    ['uint[]'],
    bytes
  )[0].map((x: BigInt) => Number(x));
};

export const doubleByteArrayDecode = (bytes: string): number[][] => {
  return new ethers.AbiCoder().decode(
    ['uint[]', 'uint[]'],
    bytes
  ).map((x) => x.map((y: BigInt) => Number(y)));;
};