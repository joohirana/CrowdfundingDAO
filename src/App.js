import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getContract } from "./contract";

function App() {
  const [account, setAccount] = useState(null);
  const [campaigns, setCampaigns] = useState([]);

  // Connect MetaMask Wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("Connection failed", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  // Fetch all campaigns from the smart contract
  const fetchCampaigns = async () => {
    try {
      const contract = await getContract();
      const count = await contract.campaignCount();
      let fetchedCampaigns = [];

      for (let i = 0; i < count; i++) {
        const campaign = await contract.campaigns(i);
        fetchedCampaigns.push({
          id: i,
          title: campaign.title,
          goal: ethers.utils.formatEther(campaign.goal),
          raised: ethers.utils.formatEther(campaign.fundsRaised),
          creator: campaign.creator,
        });
      }
      setCampaigns(fetchedCampaigns);
    } catch (error) {
      console.error("Failed to fetch campaigns", error);
    }
  };

  useEffect(() => {
    if (account) fetchCampaigns();
  }, [account]);

  // Function to contribute to a campaign
  const contribute = async (campaignId, amount) => {
    try {
      const contract = await getContract();
      const tx = await contract.contribute(campaignId, {
        value: ethers.utils.parseEther(amount),
      });
      await tx.wait();
      alert("Contribution successful!");
      fetchCampaigns(); // Refresh campaign data
    } catch (error) {
      console.error("Contribution failed", error);
    }
  };

  // Function to vote for withdrawal
  const voteWithdrawal = async (campaignId, support) => {
    try {
      const contract = await getContract();
      const tx = await contract.voteForWithdrawal(campaignId, support);
      await tx.wait();
      alert("Vote submitted successfully!");
    } catch (error) {
      console.error("Voting failed", error);
    }
  };

  // Function to withdraw funds (only creator)
  const withdrawFunds = async (campaignId) => {
    try {
      const contract = await getContract();
      const tx = await contract.withdrawFunds(campaignId);
      await tx.wait();
      alert("Funds withdrawn successfully!");
      fetchCampaigns();
    } catch (error) {
      console.error("Withdrawal failed", error);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>DAO-Managed Crowdfunding</h1>

      {/* Connect Wallet */}
      {!account ? (
        <button onClick={connectWallet} style={{ padding: "10px", fontSize: "16px" }}>
          Connect MetaMask
        </button>
      ) : (
        <p>Connected as: {account}</p>
      )}

      {/* Campaign List */}
      {account && (
        <div>
          <h2>Campaigns</h2>
          {campaigns.length === 0 ? (
            <p>No campaigns found.</p>
          ) : (
            campaigns.map((c) => (
              <div
                key={c.id}
                style={{
                  border: "1px solid #ccc",
                  padding: "15px",
                  margin: "15px 0",
                  borderRadius: "10px",
                }}
              >
                <h3>{c.title}</h3>
                <p><strong>Goal:</strong> {c.goal} ETH</p>
                <p><strong>Raised:</strong> {c.raised} ETH</p>
                <p><strong>Creator:</strong> {c.creator}</p>

                {/* Contribution Section */}
                <input type="text" placeholder="Amount in ETH" id={`amount-${c.id}`} />
                <button onClick={() => contribute(c.id, document.getElementById(`amount-${c.id}`).value)}>
                  Contribute
                </button>

                {/* DAO Voting Section */}
                <h4>Vote for Withdrawal</h4>
                <button onClick={() => voteWithdrawal(c.id, true)}>Vote YES</button>
                <button onClick={() => voteWithdrawal(c.id, false)}>Vote NO</button>

                {/* Withdraw Funds (Only for Creator) */}
                {c.creator.toLowerCase() === account.toLowerCase() && (
                  <>
                    <h4>Withdraw Funds</h4>
                    <button onClick={() => withdrawFunds(c.id)}>Withdraw Funds</button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default App;
