const { assert } = require('chai');
const { ethers } = require('ethers');
const Ballot = artifacts.require('Ballot');

require('chai')
    .use(require('chai-as-promised'))
    .should();

function toBytes32(string){
    return ethers.utils.formatBytes32String(string);
}

contract('Voting', ([chairperson, ...users]) => {

    let ballot;

    before(async () => {
        ballot = await Ballot.new([toBytes32('Cabonara'), toBytes32('Lassagna')]);
        for(const user of users){
            await ballot.giveRightToVote(user, {from: chairperson})
        }
    })

    describe('deployment', async () => {
        it('voting system deployed', async () => {
            let chairPersonAddress = await ballot.chairperson();
            assert(chairPersonAddress, chairperson, "address of chairperson is not match")
        })
    })

    describe('Voting right assign', async () => {

        it('User canont give other right to vote', async () => {
            await ballot.giveRightToVote(users[1], {from: users[0]}).should.be.rejected;
        })

        it('Voters have right to vote', async () => {
            
            let participants = 0;
            for(const user of users){
                const voter = await ballot.voters(user);
                if(voter.weight.toString() === '1'){
                    participants++
                }
            }
            assert.equal(participants, users.length, "The number of vote available is not the same as total account number");
        })

        it('Delegate votes', async () => {
            await ballot.delegate(users[1], {from: users[0]});

            const voter0 = await ballot.voters(users[0]);
            const voter1 = await ballot.voters(users[1]);

            assert.equal(voter0.voted.toString(), 'true', "Voter still have the vote");
            assert.equal(voter1.weight.toString(), '2', "Voter didn't have extra weight");
        })

        it('Voters cannot delegate votes twice', async () => {
            await ballot.delegate(users[1], {from: users[0]}).should.be.rejected;
        })

        it('Delegate to a voter that delegated vote as well', async () => {
            await ballot.delegate(users[3], {from: users[2]})
            await ballot.delegate(users[2], {from: users[1]});

            const voter1 = await ballot.voters(users[1]);
            const voter2 = await ballot.voters(users[2]);
            const voter3 = await ballot.voters(users[3]);

            assert.equal(voter1.voted.toString(), 'true', 'Voter still have the vote');
            assert.equal(voter2.voted.toString(), 'true', 'Voter still have the vote');
            assert.equal(voter3.weight.toString(), '4', "Voter didn't sufficient extra weight");
        })

        it('Voters cannot delegate votes to themselves', async () => {
            await ballot.delegate(users[3], {from: users[3]}).should.be.rejected;
        })



    })

    describe('Vote', async () => {

        it('vote to proposal 0', async () => {
            await ballot.vote(0, {from: users[3]});
            const voter3 = await ballot.voters(users[3]);
            const proposal = await ballot.proposals(0);
            assert.equal(voter3.voted.toString(), 'true', 'Voter not yet voted');
            assert.equal(voter3.vote.toString(), '0', 'Voter vote incorrect proposal');
            assert.equal(proposal.voteCount.toString(), '4', 'Vote Count not match');
        })

        it('vote to proposal 1', async () => {
            await ballot.vote(1, {from: users[4]});
            const voter4 = await ballot.voters(users[4]);
            const proposal = await ballot.proposals(1);
            assert.equal(voter4.voted.toString(), 'true', 'Voter not yet voted');
            assert.equal(voter4.vote.toString(), '1', 'Voter vote incorrect proposal');
            assert.equal(proposal.voteCount.toString(), '1', 'Vote Count not match');
        })

        it('Voters cannot vote twice', async () => {
            await ballot.vote(0, {from: users[3]}).should.be.rejected;
            const proposal = await ballot.proposals(0);
            assert.equal(proposal.voteCount.toString(), '4', 'Vote Count not match');
        })

    })

    describe('Voting Result', async () => {

        it('returns the winner proposal index', async() => {
            let index = await ballot.winningProposal();
            assert.equal(index.toString(), '0', 'The winner is incorrect');
        })

        it('returns the name of the winner', async () => {
            let name = await ballot.winnerName();
            assert.equal(name, toBytes32('Cabonara'), 'The winner name is incorrect');
        })

    })


})