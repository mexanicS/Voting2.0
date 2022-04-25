// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Voting {
  address public owner;
  uint constant timeToVote = 3 days;
  Votings[] public votings;
  mapping(uint256 => mapping(uint256 => Candidate)) public candidate;

  event VotingCreated(uint256 index);
  event AddCandidate(uint256 index);

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
    //uint256 comission;
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

    emit VotingCreated(votings.length -1);
    return votings.length -1;
  }

  function startVoting(uint256 _votingId)  external requireOwner{
    require(votings[_votingId].status==VotingStatus.NOT_ACTIVE,"Voting is not ACTIVE");
    votings[_votingId].endTimeOfVoting = block.timestamp + timeToVote;
    votings[_votingId].status = VotingStatus.ACTIVE;
  }

  function addCandidate (uint256 _votingId, string calldata _name, address payable _candidateAddress) public {
    require(votings[_votingId].status==VotingStatus.NOT_ACTIVE,"Voting is not ACTIVE");
    //require(votings[_votingId].endTimeOfVoting >= block.timestamp,"Start voting first.");
    for (uint256 i = 0; i < votings[_votingId].totalCandidate; i++) {
      if(_candidateAddress == candidate[_votingId][i].candidateAddress){
        revert("The address already exists");
      }
    }
    candidate[_votingId][votings[_votingId].totalCandidate].name = _name;
    candidate[_votingId][votings[_votingId].totalCandidate].candidateAddress = _candidateAddress;


    votings[_votingId].totalCandidate++;
    //emit AddCandidate(candidate[_votingId].length);
  }

  function infVoting(uint256 _votingId) public view returns (Votings memory _votings) {
    return votings[_votingId];
  }

  function infCandidate (uint256 _votingId, uint256 _numberCandidate) external view returns (Candidate memory _candidate){
    return candidate[_votingId][_numberCandidate];
  }
}
