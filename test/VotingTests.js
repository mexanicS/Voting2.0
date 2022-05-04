const { expect  } = require("chai");
const { ethers } = require("hardhat");
const {solidity} = require("ethereum-waffle");

describe("Voting", function () {
    let voting
    let acc1
    let acc2
    let owner
    let cComission
    let cDeposit
    let Voting
    const totalTime = 259200;
    const zero = 0;

    beforeEach(async function() {
        [owner, acc1, acc2] = await ethers.getSigners() //от какого имени 
    
        const Voting = await ethers.getContractFactory("Voting", owner)
        voting  = await Voting.deploy()
        await voting.deployed()
    })
        
        //Owner равна адресу подписавшего контракт
    it("Sets owner", async function () {
        expect(await voting.owner()).to.equal(owner.address);
    });
    
    async function getTimeStamp(bn) {
        return(
        await ethers.provider.getBlock(bn)
        ).timestamp
    }
    function delay(ms){
        return new Promise(resolve => setTimeout(resolve,ms))
    }
    describe("createVoting",function(){
        it("createElection correctly", async function(){ 
            const tx = await voting.createVoting("testVoting")
            const cVoting = await voting.votings(0)
      
            expect(cVoting.description).to.eq("testVoting")
      
            const ts =  await getTimeStamp(tx.blockNumber)

            let endTimeFactsString = totalTime+ts
            endTimeFactsString = endTimeFactsString.toString()
           
            expect(cVoting.endTimeOfVoting).to.eq(0)
            expect(cVoting.status).to.eq(0)
            expect(cVoting.totalVotingVotes.toString()).to.eq(zero.toString())
            expect(cVoting.totalCandidate.toString()).to.eq(zero.toString())
            expect(cVoting.deposit.toString()).to.eq(zero.toString())
            //array test
            //emit test
        })
    })

    describe("startVoting",function(){
        it("startVoting correctly", async function(){
            const txCreateVoting = await voting.createVoting("testVoting")
            await voting.startVoting(0)
            let cVoting = await voting.votings(0)

            const endTimeString = await cVoting.endTimeOfVoting
            const ts =  await getTimeStamp(txCreateVoting.blockNumber)
            
            let endTimeFactsString = totalTime+ts
            
            endTimeFactsString = endTimeFactsString.toString()
             expect((endTimeString-1).toString()).to.eq(endTimeFactsString)
            expect(cVoting.status).to.eq(1)
        })    
    })
})