const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with:", deployer.address);

  const Voting = await ethers.getContractFactory("VotingContract");
  const contract = await Voting.deploy();

  await contract.deployed();
  console.log("VotingContract deployed to:", contract.address);

  const artifact = {
    address: contract.address,
    abi: (await artifacts.readArtifact("VotingContract")).abi,
  };

  fs.writeFileSync(
    path.join(__dirname, "../shared/contract-info.json"),
    JSON.stringify(artifact, null, 2)
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
