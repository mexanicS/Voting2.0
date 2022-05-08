// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Voting {
  address public owner;
  address payable winCandidate;
  uint256 constant timeToVote = 3 days;
  uint256 public maxVotes;
  uint256 private comission;

  Votings[] public votings;
  mapping(uint256 => Candidate[]) public candidate;
  mapping(uint256 => mapping(address => Electorate)) public electorates;

  event VotingCreated(uint256 index, uint time);
  event AddCandidate(uint256 index, string name);
  event Voted(uint indexed id, address indexed voter);
  event VotingsFinished(uint256 indexed id,address indexed winCandidate);
  event Withdraw(address indexed account, uint256 amount);

  constructor()  {
    owner = msg.sender;
  }

  modifier requireOwner() {
    require(owner == msg.sender, "No access");
    _;
  }

  enum VotingStatus {
    NOT_ACTIVE,
    ACTIVE,
    COMPLETED
  }

  struct Votings {
    string description;
    uint256 endTimeOfVoting;
    VotingStatus status;
    uint256 totalVotingVotes;
    uint256 totalCandidate;
    uint256 deposit;
  }

  struct Electorate {
    address electorateAddress;
    bool isVoted;
  }

  struct Candidate {
    string name;
    address payable candidateAddress;
    uint256 totalCandidateVotes; 
  }

  function createVoting(string memory _description) external requireOwner returns(uint256) {
    Votings memory newVoting = Votings({
      description: _description,
      endTimeOfVoting: 0,
      status: VotingStatus.NOT_ACTIVE,
      totalVotingVotes: 0,
      totalCandidate: 0,
      deposit: 0
    });

    votings.push(newVoting);

    emit VotingCreated(votings.length -1, block.timestamp);
    return votings.length -1;
  }

  function startVoting(uint256 _votingId)  external requireOwner{
    require(votings[_votingId].status==VotingStatus.NOT_ACTIVE,"Voting is ACTIVE or COMPLETED");
    votings[_votingId].endTimeOfVoting = block.timestamp + timeToVote;
    votings[_votingId].status = VotingStatus.ACTIVE;
  }

  function addCandidate (uint256 _votingId, string calldata _name, address payable _candidateAddress) public {
    require(votings[_votingId].status==VotingStatus.NOT_ACTIVE,"Voting is ACTIVE or COMPLETED");
    for (uint256 i = 0; i < votings[_votingId].totalCandidate; i++) {
      if(_candidateAddress == candidate[_votingId][i].candidateAddress){
        revert("The address already exists");
      }
    }

    Candidate memory newCandidate = Candidate({
      name: _name,
      candidateAddress: _candidateAddress,
      totalCandidateVotes: 0
    });

    candidate[_votingId].push(newCandidate);

    votings[_votingId].totalCandidate++;
    emit AddCandidate(candidate[_votingId].length -1, _name);
  }

  function Vote(uint256 _votingId, uint256 _numberCandidate) payable public {
    require(_votingId <= votings.length, "Voting does not exist");
    require(votings[_votingId].status==VotingStatus.ACTIVE,"Voting is NOT_ACTIVE or COMPLETED");
    require(votings[_votingId].totalCandidate > _numberCandidate, "There is no candidate");
    require(votings[_votingId].endTimeOfVoting >= block.timestamp,"The voting is over");
    require(!electorates[_votingId][msg.sender].isVoted,"Have you already voted");
    require(msg.value >= .01 ether,"Insufficient funds for voting");

    votings[_votingId].totalVotingVotes++;
    votings[_votingId].deposit += msg.value;
    
    electorates[_votingId][msg.sender].electorateAddress = msg.sender;
    electorates[_votingId][msg.sender].isVoted = true;
    
    candidate[_votingId][_numberCandidate].totalCandidateVotes++;

    emit Voted(_votingId, msg.sender);
  }

  function finishVoting(uint256 _votingId) public {
    require(votings[_votingId].endTimeOfVoting <= block.timestamp,"Voting is active");

    for (uint256 i = 0; i <votings[_votingId].totalCandidate; i++) {
      if(candidate[_votingId][i].totalCandidateVotes > maxVotes){
        maxVotes = candidate[_votingId][i].totalCandidateVotes;
        winCandidate = candidate[_votingId][i].candidateAddress;
      }
    }

    comission = votings[_votingId].deposit /10;
    votings[_votingId].deposit -= comission;

    winCandidate.transfer(votings[_votingId].deposit);

    votings[_votingId].deposit = 0;
    votings[_votingId].status = VotingStatus.COMPLETED;
    emit VotingsFinished(_votingId,winCandidate);
  }

  function withdrawComission(uint256 _votingId, address payable _to) public requireOwner {
    require(votings[_votingId].status==VotingStatus.COMPLETED,"Voting is still ACTIVE");
    _to.transfer(comission);
    emit Withdraw(_to, comission);
    comission = 0;
  }

  function infVoting(uint256 _votingId) public view returns (Votings memory _votings) {
    return votings[_votingId];
  }

  function infCandidate (uint256 _votingId, uint256 _numberCandidate) external view returns (Candidate memory _candidates) {
    return candidate[_votingId][_numberCandidate];
  }

  function infElectorate(uint256 _votingsId, address _electorate) external view returns(Electorate memory _electorates) {
    return electorates[_votingsId][_electorate];
  }

  function infTimeLeft (uint256 _votingsId) public view returns(uint256) {
    return votings[_votingsId].endTimeOfVoting - block.timestamp;
    //когда 0 выводить что окончено
  }

  function listCandidate(uint256 _votingsId) external view returns(string[] memory) {
    string[] memory currentArrayCandidate = new string[](votings[_votingsId].totalCandidate);
    for (uint256 i = 0; i < votings[_votingsId].totalCandidate; i++) {
      currentArrayCandidate[i] = candidate[_votingsId][i].name;
    }
    return currentArrayCandidate;
  }
}
