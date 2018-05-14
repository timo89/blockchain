const SHA256 = require("crypto-js/sha256");

class Transaction{
    constructor(fromAddress, toAddress, amount){
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.timestamp = new Date();
    }
}

class Block {
    constructor(transactions, previousHash = '') {
        this.previousHash = previousHash;
        this.transactions = transactions;
        this.hash = '';
        this.nonce = 0;
    }
}

 //to be used only for the initial seed. mining should be done by the clients
class Miner {
    constructor(blockchain) {
        this.blockchain = blockchain;
    }

    minePendingTransactions(miningRewardAddress) {
        let unminedBlock = this.blockchain.getUnminedBlock();
        this.mineBlock(this.blockchain, unminedBlock, this.blockchain.difficulty);
        this.blockchain.addMinedBlock(unminedBlock.nonce);
    }

    mineBlock(blockchain, block) {
        while (!blockchain.isBlockMined(block)) {
            block.nonce++;
            block.hash = blockchain.calculateHash(block);
        }
    }
}

class Blockchain {
    constructor() {
        this.difficulty = 2;
        this.chain = [];
        this.pendingTransactions = [];
        this.miningReward = 100;
    }


    isBlockMined(block) {
        return block.hash !== '' && block.hash.substring(0, this.difficulty) === Array(this.difficulty + 1).join("0");
    }

    calculateHash(block) {
        return SHA256(block.previousHash + JSON.stringify(block.transactions) + block.nonce).toString();
    }

    createGenesisBlock() {
        let block = new Block([new Transaction('', "Satoshi", 10000)], "0");
        let miner = new Miner(this);
        miner.mineBlock(this, block);
        this.chain = [block];
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addMinedBlock(nonce, miningRewardAddress) {
        let unminedBlock = this.getUnminedBlock();
        unminedBlock.nonce = nonce;
        unminedBlock.hash = this.calculateHash(unminedBlock);

        if (this.isBlockMined(unminedBlock)) {
            this.chain.push(unminedBlock);
            this.difficulty = 1 + Math.round(this.chain.length / 10);
            let reward = this.miningReward * this.pendingTransactions.length;
            this.pendingTransactions = [new Transaction('', miningRewardAddress, reward)];
            return unminedBlock;
        }
        else {
            return [];
        }
    }

    getUnminedBlock() {
        return new Block(this.pendingTransactions, this.getLatestBlock().hash);
    }

    createTransaction(transaction){
        this.pendingTransactions.push(transaction);
    }

    getBalance(address){
        let balance = 0;
        
        for (const block of this.chain) {
            for(const transaction of block.transactions){
                if(transaction.fromAddress === address){
                    balance -= transaction.amount;
                }

                if(transaction.toAddress === address){
                    balance += transaction.amount;
                }
            }
        }

        return balance;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++){
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }

        return true;
    }
}

function seed(myBlockChain) {

    let miner = new Miner(myBlockChain);

    myBlockChain.createTransaction(new Transaction('Colby', 'Amiee', 58));
    myBlockChain.createTransaction(new Transaction('Edris', 'Yadira', 88));
    myBlockChain.createTransaction(new Transaction('Neida', 'Janella', 44));
    myBlockChain.createTransaction(new Transaction('Jose', 'Lecia', 41));
    miner.minePendingTransactions('Jose');
    myBlockChain.createTransaction(new Transaction('Nana', 'Agripina', 26));
    myBlockChain.createTransaction(new Transaction('Reva', 'Akilah', 42));
    myBlockChain.createTransaction(new Transaction('Janella', 'Valentin', 67));
    myBlockChain.createTransaction(new Transaction('Lecia', 'Shavonne', 27));
    myBlockChain.createTransaction(new Transaction('Agripina', 'Torie', 54));
    myBlockChain.createTransaction(new Transaction('Linwood', 'Nana', 28));
    miner.minePendingTransactions('Shavonne');
    myBlockChain.createTransaction(new Transaction('Valentin', 'Magen', 11));
    myBlockChain.createTransaction(new Transaction('Harriette', 'Reva', 77));
    myBlockChain.createTransaction(new Transaction('Jarvis', 'Louisa', 62));
    myBlockChain.createTransaction(new Transaction('Torie', 'Neida', 56));
    miner.minePendingTransactions('Torie');
    myBlockChain.createTransaction(new Transaction('Magen', 'Jarvis', 19));
    myBlockChain.createTransaction(new Transaction('Louisa', 'Linwood', 87));
    myBlockChain.createTransaction(new Transaction('Shavonne', 'Colby', 84));
    miner.minePendingTransactions('Amiee');
    myBlockChain.createTransaction(new Transaction('Yadira', 'Edris', 92));
    myBlockChain.createTransaction(new Transaction('Akilah', 'Jose', 93));
    myBlockChain.createTransaction(new Transaction('Amiee', 'Harriette', 44));
}

function setupRoutes(myBlockChain) {
    var express = require('express');
    var app = express();

    app.get('/getBalanceOfAddress/:address', function (req, res) {
        let balance = myBlockChain.getBalance(req.params.address);
        console.log(req.params.address);
        console.log(balance);
        res.send(JSON.stringify({ amount: balance }));
    });

    app.get('/send', function (req, res) {
        let transaction = new Transaction(req.query.fromAddress, req.query.toAddress, req.query.amount);
        myBlockChain.createTransaction(transaction);
        res.send(JSON.stringify(transaction));
    });

    app.get('/blockchain', function (req, res) {
        res.send(JSON.stringify(myBlockChain.chain));
    });

    app.get('/getDifficulty', function (req, res) {
        res.send(JSON.stringify({ difficulty: myBlockChain.difficulty }));
    });

    app.get('/blockchain/:hash', function (req, res) {
        let transaction = myBlockChain.chain.find(function (e) {
            return e.hash === req.params.hash
        })

        res.send(JSON.stringify(transaction));
    });

    app.get('/getUnminedBlock', function (req, res) {
        res.send(JSON.stringify({ block: myBlockChain.getUnminedBlock(), difficulty: myBlockChain.difficulty }));
    });

    app.get('/addMinedBlock', function (req, res) {
        let response = myBlockChain.addMinedBlock(req.query.nonce, req.query.miningRewardAddress);
        res.send(JSON.stringify(response));
    });

    app.get(["/", "/info"], function (req, res) {

        let routes = []
        app._router.stack.forEach(function (middleware) {
            if (middleware.route) {
                routes.push(Object.keys(middleware.route.methods) + " -> " + middleware.route.path);
            }
        });

        res.send(JSON.stringify(routes, null, 4));
    });

    app.listen(9000);
}


function init() {

    let myBlockChain = new Blockchain();
    myBlockChain.createGenesisBlock();
    seed(myBlockChain);
    setupRoutes(myBlockChain);
}

init();