import "./App.css";
import idl from "./idl.json";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import {
	Program,
	AnchorProvider,
	web3,
	utils,
	BN,
} from "@project-serum/anchor";
import { useEffect, useState } from "react";
import { Buffer } from "buffer";
window.Buffer = Buffer;

const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl("devnet");
const opts = {
	preflightCommitment: "processed",
};
const { SystemProgram } = web3;

const App = () => {
	const [walletAddress, setWalletAddress] = useState(null);
	const [campaigns, setCampaigns] = useState([]);
	const getProvider = () => {
		const connection = new Connection(network, opts.preflightCommitment);
		const provider = new AnchorProvider(
			connection,
			window.solana,
			opts.preflightCommitment
		);
		return provider;
	};
	const checkIfWalletIsConnected = async () => {
		try {
			const { solana } = window;
			if (solana) {
				if (solana.isPhantom) {
					console.log("Phantom wallet found!");
					const response = await solana.connect({
						onlyIfTrusted: true,
					});
					console.log(
						"Connected with public key:",
						response.publicKey.toString()
					);
					setWalletAddress(response.publicKey.toString());
				}
			} else {
				alert("Solana object not found! Get a Phantom wallet");
			}
		} catch (error) {
			console.error(error);
		}
	};
	const connectWallet = async () => {
		const { solana } = window;
		if (solana) {
			const response = await solana.connect();
			console.log(
				"Connected with public key:",
				response.publicKey.toString()
			);
			setWalletAddress(response.publicKey.toString());
		}
	};

	const getCampaigns = async () => {
		const connection = new Connection(network, opts.preflightCommitment);
		const provider = getProvider();
		const program = new Program(idl, programID, provider);
		Promise.all(
			(await connection.getProgramAccounts(programID)).map(
				async (campaign) => ({
					...(await program.account.campaign.fetch(campaign.pubkey)),
					pubkey: campaign.pubkey,
				})
			)
		).then((campaigns) => setCampaigns(campaigns));
	};
	const createCampaign = async () => {
		try {
			const provider = getProvider();
      
			const program = new Program(idl, programID, provider);
     
			const [campaign] = await PublicKey.findProgramAddress(
				[
					utils.bytes.utf8.encode("PROJECT_FUTUREOFWORK"),
					provider.wallet.publicKey.toBuffer(),
				],
				program.programId
			);
     await program.rpc.create(
  "Solpayplus",
  "Bill Payment Platform for Africans",
  new BN(1000), // target_amount
  "https://solpayplus.com.ng/", // project_url
  "https://github.com/samuellyworld/solpayplus", // progress_update_url
  "https://solpayplus.com.ng/assets/logo.png", // project_image_url
  "Technology", // category
  {
    accounts: {
      campaign,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
  }
);

  
			console.log(
				"Created a new campaign w/ address:",
				campaign.toString()
			);
		} catch (error) {
			console.error("Error creating campaign account:", error);
		}
	};

	const donate = async (publicKey) => {
		try {
			const provider = getProvider();
			const program = new Program(idl, programID, provider);

			await program.rpc.donate(new BN(0.2 * web3.LAMPORTS_PER_SOL), {
				accounts: {
					campaign: publicKey,
					user: provider.wallet.publicKey,
					systemProgram: SystemProgram.programId,
				},
			});
			console.log("Donated some money to:", publicKey.toString());
			getCampaigns();
		} catch (error) {
			console.error("Error donating:", error);
		}
	};

	const withdraw = async (publicKey) => {
		try {
			const provider = getProvider();
			const program = new Program(idl, programID, provider);
			await program.rpc.withdraw(new BN(0.2 * web3.LAMPORTS_PER_SOL), {
				accounts: {
					campaign: publicKey,
					user: provider.wallet.publicKey,
				},
			});
			console.log("Withdrew some money from:", publicKey.toString());
		} catch (error) {
			console.error("Error withdrawing:", error);
		}
	};

	const renderNotConnectedContainer = () => (
		<button onClick={connectWallet}>Connect to Wallet</button>
	);
	const renderConnectedContainer = () => (
		<>
			<button onClick={createCampaign}>Create a campaign…</button>
			<button onClick={getCampaigns}>Get a list of campaigns…</button>
			<br />
			{campaigns.map((campaign) => (
				<>
	        <div className="project">
			<div className="project-head">
			<img className="projectlogo" src={campaign.projectImageUrl} alt="Project Image" />
			<p>Project ID: {campaign.pubkey.toString()}</p>
            <p>
                Total Donated:{" "}
                {(
                  campaign.amountDonated / web3.LAMPORTS_PER_SOL
                ).toString()}
              </p>
			  <p>{campaign.name}</p>


			</div>
			
				<p>{campaign.description}</p>
				
				<p>Description: {campaign.description}</p>
				<p>Target Amount: {campaign.targetAmount.toString()} { 
				"Sol"}</p>
				
				<p>Total withdrawn: {campaign.amountWithdrawn/web3.LAMPORTS_PER_SOL.toString()} { 
				"Sol"}</p>
                <span>{"Progress: "}</span><progress value={campaign.amountDonated/web3.LAMPORTS_PER_SOL.toString()} max={campaign.targetAmount}></progress>
				<span>{(campaign.amountDonated/web3.LAMPORTS_PER_SOL/campaign.targetAmount)* 100}{"%"}</span>
				

				<p>
				Project URL:{" "}
				<a href={campaign.projectUrl} style={{ color: 'white'}}>
					{campaign.projectUrl}
				</a>
				</p>

				
		
				<p>Project Image URL: {campaign.projectImageUrl}</p>
				<p>Category: {campaign.category}</p>
              <button onClick={() => donate(campaign.pubkey)}>
                Click to donate!
              </button>
              <button onClick={() => withdraw(campaign.pubkey)}>
                Click to withdraw!
              </button>
              <br />


			</div>
            
      
					


				</>
			))}
		</>
	);
	useEffect(() => {
		const onLoad = async () => {
			await checkIfWalletIsConnected();
		};
		window.addEventListener("load", onLoad);
		return () => window.removeEventListener("load", onLoad);
	}, []);

	return (
		<div className="App">
			{!walletAddress && renderNotConnectedContainer()}
			{walletAddress && renderConnectedContainer()}
		</div>
	);
};

export default App;