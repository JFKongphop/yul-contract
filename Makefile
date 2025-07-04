call:
	node shortcuts/call.js

t:
	make com && npx hardhat test test/test.ts 

deploy:
	npx hardhat run --network ${chain} scripts/deploy.ts

ce2:
	node compiler/solc.js ERC20

ce7:
	node compiler/solc.js ERC721

cpsd:
	node compiler/solc.js Poseidon

te2:
	make ce2 && npx hardhat test test/erc20.ts

te7:
	make ce7 && npx hardhat test test/erc721.ts