const path = require('path');
const fs = require('fs');
const solc = require('solc');

const contract = process.argv[2];

console.log(contract);

if (!contract) {
  console.log('Invalid contract');
  process.exit(1);
}

const buildDir = path.resolve(__dirname, '..', 'build', contract);

if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

const outputBytecodePath = path.join(buildDir, `${contract}.bytecode.json`);
const outputOpcodesPath = path.join(buildDir, `${contract}.opcode.txt`);

const inputPath = path.resolve(__dirname, '..', 'contracts', `${contract}.yul`);
const source = fs.readFileSync(inputPath, 'utf-8');

const input = {
  language: 'Yul',
  sources: {
    key: {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['evm.bytecode'],
      },
    },
  },
};

const compiledContract = solc.compile(JSON.stringify(input));
const parsed = JSON.parse(compiledContract);

if (JSON.parse(compiledContract).errors.length) throw new Error("Invalid compile contract");


const { object: bytecode, opcodes } = parsed.contracts.key[contract].evm.bytecode;

const lines = opcodes.trim().split(/\s+/);
const output = lines.join('\n');

fs.writeFileSync(outputBytecodePath, JSON.stringify(bytecode));
fs.writeFileSync(outputOpcodesPath, output);

console.log('Compiled and saved to:', buildDir);
