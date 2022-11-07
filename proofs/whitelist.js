const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

// Whitelisted addresses
const whitelisted = [
  "0xC230f8DfC99761991098127471eAcae677A57111",
	"0xad9C24b21D945F89022e8F44E621a1622dcfBcaa"
  ];

const leafNodes = whitelisted.map((addr) => keccak256(addr));
const merkleTree = new MerkleTree(leafNodes, keccak256, { sort: true });
// console.log(leafNodes);
// console.log(merkleTree);
const merkleRoot = merkleTree.getRoot();
const merkleRoot2 = merkleTree.getHexRoot();
console.log('whitelist merkle tree boi\n', merkleTree.toString());
console.log('root hash: ', merkleRoot)
console.log('root hash hex: ', merkleRoot2)


const claimingAddress = keccak256("0x5B38Da6a701c568545dCfcB03FcB875f56beddC4");
console.log(claimingAddress)
// CLIENT SIDE 
// beware of addresses or their hashes not matching due to case sensitivity
// 'getHexProof' returns the neighbor leaf and all parent nodes' hashes that will be required to derive the merkle tree's root hash
// The computation for hexProof has to be outsourced to the dapp or done manually by the minter bc it's expensive to do it on-chain
const hexProof = merkleTree.getHexProof(claimingAddress);
console.log(hexProof); // if hexProof length>0, then address is valid. This array shows path of all sister and parent nodes for a leaf to reach the root
console.log(merkleTree.verify(hexProof, claimingAddress, merkleRoot));
