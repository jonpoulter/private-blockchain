/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

const level = require('level');

/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');


/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block{
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
  constructor(dbLocation){
    this.db = level(dbLocation);
    this.getBlockHeight()
      .then(height => {
        console.log(`height of chain is ${height}`);
        if (height === 0) {
          console.log('new blockchain.  Adding genesis block.');
          this.addBlock(new Block("First block in the chain - Genesis block"));
        }
      })
      .catch(err => console.log(`Unable to retrieve block height ${err}`));
  }


  // Add new block
  async addBlock(newBlock) {
        console.log('addBlock');
        // UTC timestamp
        newBlock.time = new Date().getTime().toString().slice(0,-3);
        newBlock.height = await this.getBlockHeight();
        if (newBlock.height > 0) {
          console.log('Getting previous block hash');
          const block = await this.getBlock(newBlock.height-1);
          console.log(`Last block hash = ${JSON.parse(block).hash}`);
          newBlock.previousBlockHash = JSON.parse(block).hash;
        }
        // Block hash with SHA256 using newBlock and converting to a string
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
        this.addLevelDBData(newBlock.height, JSON.stringify(newBlock).toString());
        console.log(`Added block to chain with details ${JSON.stringify(newBlock).toString()}`);  
  }

  // Get Promise containing block height.
  getBlockHeight(){
      console.log('getBlockHeight()');
      let height = 0;
      return new Promise((resolve, reject) => {
                  this.db.createReadStream()
                  .on('data', () => {/*console.log(`ondata: existing height is ${height}`);*/ height = height+1;})
                  .on('error', err => reject(err))
                  .on('close', () => {/*console.log(`onclose: final height is ${height}`);*/ resolve(height);})
      });
    }

    // Get Promise containing Block
    getBlock(blockHeight){
      console.log(`getBlock(${blockHeight})`);
      // return object as a single string
      return new Promise((resolve, reject) => {
        this.getLevelDBData(blockHeight)
            .then(block => resolve(block))
            .catch(err => reject(err));
      });
    }

   //Get All Blocks
   async getBlocks() {
      console.log('getBlocks()');
      const blockPromises = [];
      const height = await this.getBlockHeight();
      for (let i=0; i<height; i++) {
        const block = await this.getBlock(i);
        blockPromises.push(block);
      }
      return Promise.all(blockPromises);
   }

    // Add data to levelDB with key/value pair
    addLevelDBData(key,value) {
      console.log('addLevelDBData()');
      this.db.put(key, value)
      .then(() => console.log(`Block ${key} persisted`))
      .catch(rejected => console.log(`Block ${key} submission failed with error ${rejected}`));
    }

    // Get Promise from levelDB with key
    getLevelDBData(key){
      console.log('getLevelDBData()');
      return new Promise((resolve, reject) => {
        this.db.get(key, function(err, value) {
          if (err) return console.log('Not found!', err);
          console.log('Value = ' + value);
          resolve(value);
        })
      })
    }

    // async/await validate block
    async validateBlock(blockHeight) {
      console.log(`validateBlock(${blockHeight})`);
      let block = await this.getBlock(blockHeight);
      return this.validate(JSON.parse(block), blockHeight);
    }

    //validate JSON block object.
    validate(block, blockHeight) {
      //get block hash
      let blockHash = block.hash;
      // remove block hash to test block integrity
      block.hash = '';
      // generate block hash
      let validBlockHash = SHA256(JSON.stringify(block)).toString();
      // Compare
      if (blockHash===validBlockHash) {
        console.log(`Block #${blockHeight} valid`);
        return true;
      } else {
        console.log(`Block #${blockHeight} invalid hash:${blockHash}<>${validBlockHash}`);
        return false;
      }
    }

    async validateChain() {
        let errorLog = [];
        const blocks = await this.getBlocks();
        let previousBlockHash = null;
        let i = 0
        for (let block of blocks) {
          block = JSON.parse(block);
          //validate block
          if (this.validate(block, i++) === false) {
            console.log('block invalid - adding to error log');
            errorLog.push(block);
          }
          if (previousBlockHash) {
            if (block.previousBlockHash !== previousBlockHash) {
              console.log(`block hashes invalid - adding to error log ${previousBlockHash}:${block.previousBlockHash}`);
              errorLog.push(JSON.stringify(block).toString());
            }
          }
          previousBlockHash = block.hash; 
        }

        if (errorLog.length>0) {
          console.log('Block errors = ' + errorLog.length);
          console.log('Blocks: '+errorLog);
        } else {
          console.log('No errors detected');
        }
    }
}

/* ===== Testing ==============================================================|
|  - Self-invoking function to add blocks to chain                             |
|  - Learn more:                                                               |
|   https://scottiestech.info/2014/07/01/javascript-fun-looping-with-a-delay/  |
|                                                                              |
|  * 10000 Milliseconds loop = 36,000 blocks per hour                            |
|     (13.89 hours for 500,000 blocks)                                         |
|    Bitcoin blockchain adds 8640 blocks per day                               |
|     ( new block every 10 minutes )                                           |
|  ===========================================================================*/

const blockchain = new Blockchain('./testchaindata');

(function theLoop(i) {
  setTimeout(function() {
    let blockTest = new Block(`Test Block - ${i+1}`);
    blockchain.addBlock(blockTest)
    i++;
    if (i < 10) theLoop(i);
  }, 1000)
})(0);


