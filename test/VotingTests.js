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
    const deposit = 2;

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
        it("createVoting correctly", async function(){ 
            const txCreateVoting = await voting.createVoting("testVoting")
            const cVoting = await voting.votings(0)
      
            expect(cVoting.description).to.eq("testVoting")
      
            const ts =  await getTimeStamp(txCreateVoting.blockNumber)

            let endTimeFactsString = totalTime+ts
            endTimeFactsString = endTimeFactsString.toString()
           
            expect(cVoting.endTimeOfVoting).to.eq(0)
            expect(cVoting.status).to.eq(0)
            expect(cVoting.totalVotingVotes).to.eq(zero)
            expect(cVoting.totalCandidate).to.eq(zero)
            expect(cVoting.deposit).to.eq(zero)

            await expect(txCreateVoting)
                .to.emit(voting, 'VotingCreated')
                .withArgs(0, ts);
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
            
            await expect(voting.startVoting(0))
                .to.be.revertedWith('Voting is ACTIVE or COMPLETED');
        })    
    })

    describe("addCandidate",function(){
        it("addCandidate correctly", async function(){
            await voting.createVoting("testVoting")
            const txAddCandidate = await voting.addCandidate(0,"Mentos Petrovich", acc1.address)

            let cCandidate = await voting.candidate(0,0)
            let cVoting = await voting.votings(0)
            
            expect(cCandidate.name).to.eq("Mentos Petrovich")
            expect(cCandidate.candidateAddress).to.eq(acc1.address)
            expect(cCandidate.totalCandidateVotes).to.eq(zero)

            expect(cVoting.totalCandidate).to.eq(1)

            await expect(txAddCandidate)
                .to.emit(voting, 'AddCandidate')
                .withArgs(0, "Mentos Petrovich");

            await expect(voting.addCandidate(0,"Mentos Petrovich", acc1.address))
                .to.be.revertedWith('The address already exists');
            

            await voting.startVoting(0)

            await expect(voting.addCandidate(0,"Mentos Petrovich", acc1.address))
                .to.be.revertedWith('Voting is ACTIVE or COMPLETED');
        })    
    })
    describe("Vote",function(){
        it("Vote correctly", async function(){
            await voting.createVoting("testVoting")
            await voting.addCandidate(0,"Mentos Petrovich", acc1.address)
            
            /*await expect(voting.Vote(1,0))
                .to.be.revertedWith('Voting does not exist');*/

            await expect(voting.Vote(0,0))
                .to.be.revertedWith('Voting is NOT_ACTIVE or COMPLETED');

            await voting.startVoting(0)
            
            await expect(voting.Vote(0,2))
                .to.be.revertedWith('There is no candidate');
            
            await expect(voting.Vote(0,0))
                .to.be.revertedWith('The voting is over');

            let txVote = await voting.Vote(0,0, {value: ethers.utils.parseEther(deposit.toString())})
            
            await expect(voting.Vote(0,0))
                .to.be.revertedWith('Have you already voted');

            let cElectorate = await voting.electorates(0,owner.address)
            let cCandidate = await voting.candidate(0,0)
            let cVoting = await voting.votings(0)

            expect(cVoting.totalVotingVotes).to.eq(1)
            expect(cVoting.deposit.toString()).to.eq("2000000000000000000")
            expect(cElectorate.electorateAddress).to.eq(owner.address)
            expect(cElectorate.isVoted).to.be.eq(true)
            expect(cCandidate.totalCandidateVotes).to.eq(1)
            await expect(txVote)
                .to.emit(voting, 'Voted')
                .withArgs(0, owner.address);

        })    
    })

    describe("finishVoting",function(){
        it("finishVoting correctly", async function(){
            await voting.createVoting("testVoting")
            await voting.addCandidate(0,"Mentos Petrovich", acc1.address)
            await voting.startVoting(0)
            await voting.Vote(0,0, {value: ethers.utils.parseEther(deposit.toString())})
            
            let cElectorate = await voting.electorates(0,owner.address)
            let cCandidate = await voting.candidate(0,0)
            let cVoting = await voting.votings(0)
            cDeposit = cVoting.deposit - (cVoting.deposit / 10)
            await expect(voting.finishVoting(0))
                .to.be.revertedWith('Voting is active');

            let txFinishVoting = await voting.finishVoting(0)
            
            expect(cVoting.deposit.toString()).to.eq(cDeposit.toString())

            await expect(await voting.finishVoting({to: walletTo.address, value: cDeposit}))
                .to.changeEtherBalances([voting, owner], [cDeposit, cDeposit]);

            /*expect(cElectorate.electorateAddress).to.eq(owner.address)
            expect(cElectorate.isVoted).to.be.eq(true)
            expect(cCandidate.totalCandidateVotes).to.eq(1)*/
            

        })    
    })
})