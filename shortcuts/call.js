const { ethers } = require("ethers");
const dotenv = require('dotenv');
dotenv.config();

const rpcUrl = process.env.SEPOLIA;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const contractAddress = '0x8a8BB6857A3aB49ca00DE43BBC3de1Fc8D37faD4';
const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const ABI = ["function add(uint,uint,uint)"];
const iface = new ethers.Interface(ABI);
const arguments = ['0xe', '0x02', '0x07'];
const data = iface.encodeFunctionData(
  "add", 
  arguments,
);

(async () => {
  try {
    const result = await provider.call({
      to: contractAddress,
      data,
    });

    console.log("Decoded uint256:", ethers.toBigInt(result));
  } catch (error) {
    console.error("Error:", error.message);
  }
})();

// const selector = "0x505fb46c";
// const a = ethers.toBigInt(14);
// const b = ethers.toBigInt(2);
// const c = ethers.toBigInt(7);

// // Encode calldata manually
// const calldata = selector +
//   ethers.zeroPadValue(ethers.toBeHex(a), 32).substring(2) +
//   ethers.zeroPadValue(ethers.toBeHex(b), 32).substring(2) +
//   ethers.zeroPadValue(ethers.toBeHex(c), 32).substring(2);