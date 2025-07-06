import { 
  ethers, 
  hexlify, 
  keccak256, 
  toUtf8Bytes 
} from "ethers";

export const dataEncoder = (name: string, args?: any[]): string => {
  let params: string[] = [];
  if (args?.length) {
    for (const arg of args) {
      if (ethers.isAddress(arg)) params.push('address');
      else if (arg === true || arg === false) params.push('bool');
      else params.push('uint');
    }
  }
  const joinParams = params.join(',');
  const iface = new ethers.Interface([`function ${name}(${joinParams})`]);
  return iface.encodeFunctionData(name, args);
}

export const hexEncoder = (string: string) => {
  return hexlify(toUtf8Bytes(string));
}

export const keccakEncoder = (name: string): string => {
  return keccak256(toUtf8Bytes(name));
}

export const zeroPadValue = (value: string): string => {
  return ethers.zeroPadValue(value, 32);
}