call:
	node shortcuts/call.js

t:
	make com && npx hardhat test test/test.ts 

deploy:
	npx hardhat run --network ${chain} scripts/deploy.ts

ce2:
	node compiler/solc.js ERC20

te2:
	make ce2 && npx hardhat test test/erc20.ts
