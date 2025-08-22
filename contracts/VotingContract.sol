// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VotingContract {
    struct Candidate {
        uint256 id;
        string name;
        string description;
        uint256 voteCount;
        bool exists;
    }
    
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 votedFor;
    }
    
    address public admin;
    string public electionName;
    bool public votingActive;
    uint256 public totalVotes;
    uint256 private candidateCounter;
    
    mapping(uint256 => Candidate) public candidates;
    mapping(address => Voter) public voters;
    uint256[] public candidateIds;
    address[] public voterList; // <-- Déclaration ajoutée
    
    // Events
    event CandidateAdded(uint256 indexed candidateId, string name);
    event VoterRegistered(address indexed voter);
    event VoteCast(address indexed voter, uint256 indexed candidateId);
    event VotingStarted();
    event VotingStopped();
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier onlyRegisteredVoter() {
        require(voters[msg.sender].isRegistered, "Voter not registered");
        _;
    }
    
    modifier votingIsActive() {
        require(votingActive, "Voting is not active");
        _;
    }
    
    constructor() {
        admin = msg.sender;
        electionName = "Default Election";
        votingActive = false;
        totalVotes = 0;
        candidateCounter = 0;
    }
    
    function owner() external view returns (address) {
        return admin;
    }
    
    function setElectionName(string memory _name) external onlyAdmin {
        electionName = _name;
    }
    
    function addCandidate(string memory _name, string memory _description) external onlyAdmin {
        require(!votingActive, "Cannot add candidates during active voting");
        require(bytes(_name).length > 0, "Candidate name cannot be empty");
        
        candidateCounter++;
        candidates[candidateCounter] = Candidate({
            id: candidateCounter,
            name: _name,
            description: _description,
            voteCount: 0,
            exists: true
        });
        
        candidateIds.push(candidateCounter);
        emit CandidateAdded(candidateCounter, _name);
    }
    
    function registerVoter(address _voter) external onlyAdmin {
        require(!voters[_voter].isRegistered, "Voter already registered");
        
        voters[_voter] = Voter({
            isRegistered: true,
            hasVoted: false,
            votedFor: 0
        });
        
        voterList.push(_voter);
        emit VoterRegistered(_voter);
    }
    
    function registerMultipleVoters(address[] memory _voters) external onlyAdmin {
        for (uint256 i = 0; i < _voters.length; i++) {
            if (!voters[_voters[i]].isRegistered) {
                voters[_voters[i]] = Voter({
                    isRegistered: true,
                    hasVoted: false,
                    votedFor: 0
                });
                voterList.push(_voters[i]);
                emit VoterRegistered(_voters[i]);
            }
        }
    }
    
    function startVoting() external onlyAdmin {
        require(!votingActive, "Voting is already active");
        require(candidateIds.length > 0, "No candidates registered");
        
        votingActive = true;
        emit VotingStarted();
    }
    
    function stopVoting() external onlyAdmin {
        require(votingActive, "Voting is not active");
        
        votingActive = false;
        emit VotingStopped();
    }
    
    function vote(uint256 _candidateId) external onlyRegisteredVoter votingIsActive {
        require(!voters[msg.sender].hasVoted, "Voter has already voted");
        require(candidates[_candidateId].exists, "Candidate does not exist");
        
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].votedFor = _candidateId;
        
        candidates[_candidateId].voteCount++;
        totalVotes++;
        
        emit VoteCast(msg.sender, _candidateId);
    }
    
    function getCandidate(uint256 _candidateId) external view returns (
        uint256 id,
        string memory name,
        string memory description,
        uint256 voteCount
    ) {
        require(candidates[_candidateId].exists, "Candidate does not exist");
        Candidate memory candidate = candidates[_candidateId];
        return (candidate.id, candidate.name, candidate.description, candidate.voteCount);
    }
    
    function getAllCandidates() external view returns (uint256[] memory) {
        return candidateIds;
    }
    
    function getAllCandidatesDetails() external view returns (
        uint256[] memory ids,
        string[] memory names,
        string[] memory descriptions,
        uint256[] memory voteCounts
    ) {
        uint256 length = candidateIds.length;
        ids = new uint256[](length);
        names = new string[](length);
        descriptions = new string[](length);
        voteCounts = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            uint256 candidateId = candidateIds[i];
            ids[i] = candidates[candidateId].id;
            names[i] = candidates[candidateId].name;
            descriptions[i] = candidates[candidateId].description;
            voteCounts[i] = candidates[candidateId].voteCount;
        }
        
        return (ids, names, descriptions, voteCounts);
    }
    
    function getResults() external view returns (
        uint256[] memory ids,
        string[] memory names,
        uint256[] memory voteCounts
    ) {
        require(!votingActive || msg.sender == admin, "Voting is still active");
        
        uint256 length = candidateIds.length;
        ids = new uint256[](length);
        names = new string[](length);
        voteCounts = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            uint256 candidateId = candidateIds[i];
            ids[i] = candidates[candidateId].id;
            names[i] = candidates[candidateId].name;
            voteCounts[i] = candidates[candidateId].voteCount;
        }
        
        return (ids, names, voteCounts);
    }
    
    function getWinner() external view returns (uint256 winnerId, string memory winnerName, uint256 winnerVotes) {
        require(!votingActive, "Voting is still active");
        require(candidateIds.length > 0, "No candidates");
        
        uint256 maxVotes = 0;
        uint256 winner = 0;
        
        for (uint256 i = 0; i < candidateIds.length; i++) {
            uint256 candidateId = candidateIds[i];
            if (candidates[candidateId].voteCount > maxVotes) {
                maxVotes = candidates[candidateId].voteCount;
                winner = candidateId;
            }
        }
        
        return (winner, candidates[winner].name, candidates[winner].voteCount);
    }
    
    function getVoterInfo(address _voter) external view returns (
        bool isRegistered,
        bool hasVoted,
        uint256 votedFor
    ) {
        Voter memory voter = voters[_voter];
        return (voter.isRegistered, voter.hasVoted, voter.votedFor);
    }
    
    function getCandidateCount() external view returns (uint256) {
        return candidateIds.length;
    }
    
    function workflowStatus() external view returns (uint256) {
        if (!votingActive && candidateIds.length == 0) {
            return 0; // Registration phase
        } else if (votingActive) {
            return 1; // Voting phase
        } else {
            return 2; // Ended phase
        }
    }
    
    function getAllVoters() external view returns (address[] memory) {
        return voterList;
    }
    
    function getVoterCount() external view returns (uint256) {
        return voterList.length;
    }
    
    function resetContract() external onlyAdmin {
        // Supprimer tous les candidats
        for (uint256 i = 0; i < candidateIds.length; i++) {
            delete candidates[candidateIds[i]];
        }
        delete candidateIds;
        
        // Supprimer tous les votants (seulement possible pour les nouveaux déploiements)
        // Note: Les mappings ne peuvent pas être supprimés, mais on peut réinitialiser la liste
        for (uint256 i = 0; i < voterList.length; i++) {
            delete voters[voterList[i]];
        }
        delete voterList;
        
        // Réinitialiser les variables
        votingActive = false;
        totalVotes = 0;
        candidateCounter = 0;
        electionName = "Default Election";
    }
}