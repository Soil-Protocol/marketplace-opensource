# Knowhere Marketplace

Knowhere Marketplace open-source Terra-based NFT marketplace platform. 
ready to be deploy on any Cosmos-based chain with minimum setup effort.
.
Structure
- Contract (Cosmwasm Smart Contract Repository)
- Interface (React Frontend)


### How to Deploy (Mac OS)

- Go into contract folder
- Run ```cargo build``` to compile the smart contract code.
- Run ```./build_release.sh ``` (Docker need to be install first).
- Run script in ```scripts/deploy_auction_testnet.ts ``` or ```scripts/deploy_auction_mainnet.ts ``` to deploy the smart contract.
- Go into interface folder.
- Run yarn to install necessary depedencies.
- Go into address.ts file to fill in marketplace address and nft address to point the correct smart contract into the interface.
- Now the frontend is ready to be deployed.







