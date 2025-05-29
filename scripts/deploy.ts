import { ethers } from 'hardhat';
import bytecode from '../build/Pure/Pure.bytecode.json';

const deploy = async () => {
  const Contract = await ethers.getContractFactory([], bytecode);
  const contract = await Contract.deploy();
  const contractAddress = await contract.getAddress();

  console.log('ADDRESS:', contractAddress);
}

deploy().catch((err) => {
  console.log(err);
  process.exitCode = 1;
})