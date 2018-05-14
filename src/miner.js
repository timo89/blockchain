const SHA256 = require("crypto-js/sha256");
var request = require('sync-request');

const args = process.argv;

let address = args[2];
let nonceStart = args[3];


function startMining() {
    let res = request('GET', 'http://localhost:9000/getUnminedBlock');
    let blockInfo = JSON.parse(res.getBody());

    console.log("received new block");
    console.log("difficulty " + blockInfo.difficulty);

    let block = mine(blockInfo);
    res = request('GET', 'http://localhost:9000/addMinedBlock?nonce=' + block.nonce + '&miningRewardAddress=' + address);
    let addResult = JSON.parse(res.getBody());
    if (addResult.length === 0) {
        console.log("block was not accepted");
    } else {
        console.log("block was accepted");
    }

    console.log("");
}


function isBlockMined(block, difficulty) {
    return block.hash !== null && block.hash.substring(0, difficulty) === Array(difficulty + 1).join("0");
}

function calculateHash(block) {
    return SHA256(block.previousHash + JSON.stringify(block.transactions) + block.nonce).toString();
}

function mine(blockInfo) {
    let block = blockInfo.block;
    block.nonce = nonceStart;
    while (!isBlockMined(block, blockInfo.difficulty)) {
        block.nonce++;
        block.hash = calculateHash(block);
    }
    
    console.log("Block mined! Nonce="+block.nonce);

    return block;
}

while (true) {
    startMining();
}
