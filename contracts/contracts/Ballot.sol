// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

contract Ballot {

    struct Voter {
        address delegate;
        uint256 weight;
        bool voted;
        uint vote;
    }

    struct Proposal {
        bytes32 name;
        uint voteCount;
    }

    address public chairperson;

    mapping(address => Voter) public voters;

    Proposal[] public proposals;

    constructor(bytes32[] memory _name){
        chairperson = msg.sender;
        voters[chairperson].weight = 1;

        for(uint i; i < _name.length; i++){
            proposals.push(Proposal({
                name: _name[i],
                voteCount: 0
            }));
        }
    }

    function giveRightToVote(address _to) external {

        require(msg.sender == chairperson, "Only Chairperson of the proposal can give voting right");
        require(!voters[_to].voted, "The voter voted");
        require(voters[_to].weight == 0);

        voters[_to].weight = 1;

    }

    function delegate(address _to) external {

        Voter storage sender = voters[msg.sender];

        require(sender.weight > 0, "Voter have no vote");
        require(!sender.voted, "Voter already voted");
        require(_to != msg.sender, "self-delgate is not allowed");

        while(voters[_to].delegate != address(0)){
            _to = voters[_to].delegate;
            require( _to != msg.sender, "self-delgate is not allowed");
        }

        sender.delegate = _to;
        sender.voted = true;

        Voter storage delegated = voters[_to];
        if(delegated.voted){
            proposals[delegated.vote].voteCount = sender.weight;
        }else{
            delegated.weight += sender.weight;
        }
    }

    function vote(uint proposal) external {
        Voter storage sender = voters[msg.sender];
        require(!sender.voted, "Voter already voted");
        require(sender.weight > 0, "Voter have no vote");

        sender.vote = proposal;
        sender.voted = true;

        proposals[proposal].voteCount += sender.weight;
    }

    function winningProposal() public view returns (uint _winningProposal){
        uint highestVote = 0;

        for(uint i; i < proposals.length; i++){
            if(proposals[i].voteCount > highestVote){
                highestVote = proposals[i].voteCount;
                _winningProposal = i;
            }
        }
    }

    function winnerName() public view returns (bytes32 _name){
        _name = proposals[winningProposal()].name;
    }


}