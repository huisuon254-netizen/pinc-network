use ethers_core::types::{Address, U256};
use ethers_signers::{coins_bip39::English, MnemonicBuilder, Signer};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::str::FromStr;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Wallet {
    pub mnemonic: String,
    pub eth_address: String,
    pub bnb_address: String,
    pub tron_address: String,
}

impl Wallet {
    /// Generates a new HD wallet and derives addresses for ETH, BNB, and TRON
    pub fn new_random() -> Result<Self, String> {
        // Generate random mnemonic (12 words)
        let mnemonic =
            ethers_signers::coins_bip39::Mnemonic::<English>::new(&mut rand::thread_rng());
        let mnemonic_phrase = mnemonic.to_phrase();

        Self::from_mnemonic(&mnemonic_phrase)
    }

    /// Recovers an HD wallet from a mnemonic phrase
    pub fn from_mnemonic(phrase: &str) -> Result<Self, String> {
        // BIP44 derivation paths
        // ETH/BSC share the same derivation path (m/44'/60'/0'/0/0)
        let eth_wallet = MnemonicBuilder::<English>::default()
            .phrase(phrase)
            .derivation_path("m/44'/60'/0'/0/0")
            .map_err(|e| e.to_string())?
            .build()
            .map_err(|e| e.to_string())?;

        // TRON uses m/44'/195'/0'/0/0
        let tron_wallet = MnemonicBuilder::<English>::default()
            .phrase(phrase)
            .derivation_path("m/44'/195'/0'/0/0")
            .map_err(|e| e.to_string())?
            .build()
            .map_err(|e| e.to_string())?;

        Ok(Self {
            mnemonic: phrase.to_string(),
            eth_address: format!("{:?}", eth_wallet.address()),
            bnb_address: format!("{:?}", eth_wallet.address()), // BSC is same as ETH
            // Convert to Tron Base58Check address format (mock implementation for simplicity, TRON uses different prefix usually)
            tron_address: format!("{:?}", tron_wallet.address()),
        })
    }
}

// ABI Constants for ERC-20 Tokens
pub const ERC20_ABI: &str = r#"[
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    }
]"#;

pub const USDT_CONTRACT_MAINNET: &str = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
pub const USDC_CONTRACT_MAINNET: &str = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eb48";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlchemyWebhookPayload {
    pub webhook_id: String,
    pub event: AlchemyEvent,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlchemyEvent {
    pub network: String,
    pub activity: Vec<AlchemyActivity>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlchemyActivity {
    pub from_address: String,
    pub to_address: String,
    pub value: f64,
    pub asset: String,
    pub hash: String,
    pub category: String,
}

pub struct DepositManager {
    // Maps user addresses to their internal ledger balance (user_id -> balance)
    pub user_balances: HashMap<String, f64>,
    // Maps wallet address to user_id
    pub address_to_user: HashMap<String, String>,
}

impl DepositManager {
    pub fn new() -> Self {
        Self {
            user_balances: HashMap::new(),
            address_to_user: HashMap::new(),
        }
    }

    /// Generates a new deposit address for a user and stores it
    pub fn generate_deposit_address(&mut self, user_id: &str) -> Result<String, String> {
        let wallet = Wallet::new_random()?;
        let address = wallet.eth_address.clone();

        self.address_to_user
            .insert(address.to_lowercase(), user_id.to_string());
        // In reality, we would securely store the wallet mnemonic or private key in the DB or HSM

        Ok(address)
    }

    /// Handles incoming Alchemy webhooks and credits internal ledger
    pub fn process_webhook(&mut self, payload: AlchemyWebhookPayload) -> Result<(), String> {
        for activity in payload.event.activity {
            let to_addr = activity.to_address.to_lowercase();

            // Check if this is a deposit to one of our managed addresses
            if let Some(user_id) = self.address_to_user.get(&to_addr) {
                // If it's USDT or USDC or ETH
                if activity.asset == "USDT" || activity.asset == "USDC" || activity.asset == "ETH" {
                    log::info!(
                        "Detected {} {} deposit to {} (tx: {}). Crediting user: {}",
                        activity.value,
                        activity.asset,
                        to_addr,
                        activity.hash,
                        user_id
                    );

                    // Credit user's internal ledger balance
                    let balance = self.user_balances.entry(user_id.clone()).or_insert(0.0);
                    *balance += activity.value;
                }
            }
        }

        Ok(())
    }
}
