/**
 *Submitted for verification at Etherscan.io on 2025-03-13
*/

/**
 *Submitted for verification at Etherscan.io on 2025-03-07
*/

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DAOManagedCrowdfunding {
    struct Campaign {
        address payable creator;
        string title;
        string description;
        uint256 goal;
        uint256 deadline;
        uint256 fundsRaised;
        bool withdrawn;
    }

    struct Vote {
        address voter;
        bool support;
    }

    address public daoAdmin;
    mapping(address => bool) public daoMembers;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => Vote[]) public votes;
    uint256 public campaignCount;

    event CampaignCreated(uint256 campaignId, string title, uint256 goal, uint256 deadline);
    event ContributionReceived(uint256 campaignId, address contributor, uint256 amount);
    event WithdrawalApproved(uint256 campaignId);
    event FundsWithdrawn(uint256 campaignId, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == daoAdmin, "Only admin can perform this action");
        _;
    }

    modifier onlyDAOMember() {
        require(daoMembers[msg.sender], "Only DAO members can vote");
        _;
    }

    constructor() {
        daoAdmin = msg.sender;
        daoMembers[msg.sender] = true; // The deployer is the first DAO member
    }

    function addDAOMember(address member) external onlyAdmin {
        daoMembers[member] = true;
    }

    function createCampaign(string memory _title, string memory _description, uint256 _goal, uint256 _duration) external {
        require(_goal > 0, "Goal must be greater than zero");
        uint256 _deadline = block.timestamp + _duration;

        campaigns[campaignCount] = Campaign(payable(msg.sender), _title, _description, _goal, _deadline, 0, false);
        emit CampaignCreated(campaignCount, _title, _goal, _deadline);
        campaignCount++;
    }

    function contribute(uint256 _campaignId) external payable {
        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp < campaign.deadline, "Campaign has ended");
        require(msg.value > 0, "Contribution must be greater than zero");

        campaign.fundsRaised += msg.value;
        emit ContributionReceived(_campaignId, msg.sender, msg.value);
    }

    function voteForWithdrawal(uint256 _campaignId, bool _support) external onlyDAOMember {
        require(block.timestamp > campaigns[_campaignId].deadline, "Voting starts after campaign ends");
        votes[_campaignId].push(Vote(msg.sender, _support));

        if (countVotes(_campaignId) > getDAOMemberCount() / 2) {
            emit WithdrawalApproved(_campaignId);
        }
    }

    function withdrawFunds(uint256 _campaignId) external {
        Campaign storage campaign = campaigns[_campaignId];
        require(msg.sender == campaign.creator, "Only the campaign creator can withdraw");
        require(block.timestamp > campaign.deadline, "Campaign still running");
        require(!campaign.withdrawn, "Funds already withdrawn");
        require(countVotes(_campaignId) > getDAOMemberCount() / 2, "Not enough DAO votes");

        uint256 amount = campaign.fundsRaised;
        campaign.withdrawn = true;
        campaign.fundsRaised = 0;
        campaign.creator.transfer(amount);

        emit FundsWithdrawn(_campaignId, amount);
    }

    function countVotes(uint256 _campaignId) private view returns (uint256) {
        uint256 yesVotes = 0;
        for (uint256 i = 0; i < votes[_campaignId].length; i++) {
            if (votes[_campaignId][i].support) {
                yesVotes++;
            }
        }
        return yesVotes;
    }

    function getYesVotes(uint256 _campaignId) external view returns (uint256) {
    uint256 yesVotes = 0;
    for (uint256 i = 0; i < votes[_campaignId].length; i++) {
        if (votes[_campaignId][i].support) {
            yesVotes++;
        }
    }
    return yesVotes;
}


    function getDAOMemberCount() private view returns (uint256 count) {
        for (uint256 i = 0; i < campaignCount; i++) {
            if (daoMembers[campaigns[i].creator]) {
                count++;
            }
        }
    }

    receive() external payable {} // Allows receiving ETH
}