const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners(); 

  console.log("Deploying contracts with the account:", deployer.address); 

  const Voting = await hre.ethers.getContractFactory('Voting');
  const voting = await Voting.deploy(); //deploying the contract

  await voting.deployed(); // waiting for the contract to be deployed

  console.log("Voting deployed to:", voting.address); // Returning the contract address on the rinkeby
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });