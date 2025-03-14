import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { parseEther, formatEther } from "ethers";
import { BrowserRouter as Router, useNavigate } from "react-router-dom";

const contractAddress = "0x13B020CEf419C48DdF7f6ed26Fe8E431DbE89715";

//0xF09e280767c768Fb361C3F5075142d02645e2972
const contractABI = [
    "function createCampaign(string memory _title, string memory _description, uint256 _goal, uint256 _duration) external",
    "function contribute(uint256 _campaignId) external payable",
    "function voteForWithdrawal(uint256 _campaignId, bool _support) external",
    "function withdrawFunds(uint256 _campaignId) external",
    "function campaigns(uint256) view returns (address, string memory, string memory, uint256, uint256, uint256, bool)",
    "function votes(uint256) view returns (uint256)",
    "function campaignCount() view returns (uint256)",
    "function daoMembers(address) view returns (bool)",
    "event CampaignCreated(uint256 campaignId, string title, uint256 goal, uint256 deadline)",
    "function getYesVotes(uint256 _campaignId) view returns (uint256)",
];

function App() {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [contract, setContract] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const navigate = useNavigate();

    const connectWallet = async () => {
        if (window.ethereum) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const account = await signer.getAddress();
            setAccount(account);
            setProvider(provider);
            setContract(new ethers.Contract(contractAddress, contractABI, signer));
        } else {
            alert("Please install MetaMask!");
        }
    };

    const createCampaign = async (title, description, goal, duration) => {
        try {
            const tx = await contract.createCampaign(title, description, parseEther(goal), duration);
            await tx.wait();
            alert("Campaign created successfully!");
            document.getElementById("title").value = "";
            document.getElementById("description").value = "";
            document.getElementById("goal").value = "";
            document.getElementById("duration").value = "";
            fetchCampaigns();
        } catch (error) {
            console.error("Error creating campaign:", error);
        }
    };

    const contribute = async (campaignId, amount) => {
        try {
            const tx = await contract.contribute(campaignId, { value: parseEther(amount) });
            await tx.wait();
            alert("Contribution successful!");
            fetchCampaigns();
        } catch (error) {
            console.error("Contribution failed", error);
        }
    };

    const voteWithdrawal = async (campaignId, support) => {
        try {
            const tx = await contract.voteForWithdrawal(campaignId, support);
            await tx.wait();
            alert("Vote submitted successfully!");
            // Fetch updated campaigns to update UI
            fetchCampaigns();
        } catch (error) {
            console.error("Voting failed", error);
        }
    };

    const withdrawFunds = async (campaignId) => {
        try {
            const tx = await contract.withdrawFunds(campaignId);
            await tx.wait();
            alert("Funds withdrawn successfully!");
            fetchCampaigns();
        } catch (error) {
            console.error("Withdrawal failed", error);
        }
    };

    const fetchCampaigns = async () => {
      try {
          const count = await contract.campaignCount();
          let fetchedCampaigns = [];
  
          for (let i = 0; i < count; i++) {
              const campaign = await contract.campaigns(i);
              const yesVotes  = await contract.getYesVotes(i);  // Total number of votes (YES + NO)

              
                // Convert the deadline from Unix timestamp to a human-readable date
              const duration = parseInt(campaign[4].toString());
              const endDate = new Date(duration * 1000).toLocaleString(); // Convert from Unix timestamp to Date

              fetchedCampaigns.push({
                  id: i,
                  title: campaign[1],
                  goal: formatEther(campaign[3]),
                  raised: formatEther(campaign[5]),
                  creator: campaign[0],
                  duration: duration,
                  endDate: endDate,  // Add the converted end date
                  yesVotes: yesVotes.toString(),  // Store yes votes
              });
          }
          setCampaigns(fetchedCampaigns);
      } catch (error) {
          console.error("Failed to fetch campaigns", error);
      }
  };
  

    useEffect(() => {
        if (contract) fetchCampaigns();
    }, [contract]);

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h1>DAO-Managed Crowdfunding</h1>

            {!account ? (
                <button onClick={connectWallet} style={{ padding: "10px", fontSize: "16px" }}>Connect MetaMask</button>
            ) : (
                <p>Connected as: {account}</p>
                
            )}

            <div className="mt-4">
                <h2 className="text-xl font-bold">Create Campaign</h2>
                <input placeholder="Title" id="title" className="border p-2 m-2" />
                <input placeholder="Description" id="description" className="border p-2 m-2" />
                <input placeholder="Goal (ETH)" id="goal" className="border p-2 m-2" />
                <input placeholder="Duration (seconds)" id="duration" className="border p-2 m-2" />
                <button
                    onClick={() =>
                        createCampaign(
                            document.getElementById("title").value,
                            document.getElementById("description").value,
                            document.getElementById("goal").value,
                            document.getElementById("duration").value
                        )
                    }
                    className="bg-green-500 text-white px-4 py-2 rounded">
                    Create Campaign
                </button>
            </div>

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
                <p>
                  <strong>Goal:</strong> {c.goal} ETH
                </p>
                <p>
                  <strong>Raised:</strong> {c.raised} ETH
                </p>
                <p><strong>End Date:</strong> {c.endDate}  {/* Show the human-readable end date */}
                </p>
                <p><strong>Yes Votes:</strong> {c.yesVotes}</p>
                <p>
                  <strong>Creator:</strong> {c.creator}
                </p>

                {/* Contribution Section */}
                <input
                  type="text"
                  placeholder="Amount in ETH"
                  id={`amount-${c.id}`}
                />
                <button
                  onClick={() =>
                    contribute(
                      c.id,
                      document.getElementById(`amount-${c.id}`).value
                    )
                  }
                >
                  Contribute
                </button>

                {/* DAO Voting Section */}
                <h4>Vote for Withdrawal</h4>
                <button onClick={() => voteWithdrawal(c.id, true)}>
                  Vote YES
                </button>
                <button onClick={() => voteWithdrawal(c.id, false)}>
                  Vote NO
                </button>

                {/* Withdraw Funds (Only for Creator) */}
                {c.creator.toLowerCase() === account.toLowerCase() && (
                  <>
                    <h4>Withdraw Funds</h4>
                    <button onClick={() => withdrawFunds(c.id)}>
                      Withdraw Funds
                    </button>
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

export default function AppWithRouter() {
    return (
        <Router>
            <App />
        </Router>
    );
}
