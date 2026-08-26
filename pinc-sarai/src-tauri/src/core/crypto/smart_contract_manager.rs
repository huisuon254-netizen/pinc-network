use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartContractTemplate {
    pub id: String,
    pub name: String,
    pub description: String,
    pub contract_type: ContractType,
    pub bytecode: String,
    pub abi: String,
    pub creator: String,
    pub created_at: i64,
    pub last_updated: i64,
    pub is_official: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ContractType {
    Token,
    NFT,
    DeFi,
    DAO,
    Staking,
    LiquidityPool,
    Governance,
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeployedContract {
    pub id: String,
    pub template_id: String,
    pub name: String,
    pub address: String,
    pub chain: String,
    pub owner: String,
    pub deployed_at: i64,
    pub status: ContractStatus,
    pub tx_hash: String,
    pub gas_used: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ContractStatus {
    Deployed,
    Pending,
    Failed,
    Suspended,
    Deprecated,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContractInteraction {
    pub id: String,
    pub contract_id: String,
    pub function_name: String,
    pub caller: String,
    pub parameters: String,
    pub value: f64,
    pub gas_limit: u64,
    pub timestamp: i64,
    pub result: String,
    pub status: InteractionStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum InteractionStatus {
    Success,
    Failed,
    Pending,
    Timeout,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContractEvent {
    pub id: String,
    pub contract_id: String,
    pub event_name: String,
    pub timestamp: i64,
    pub data: String,
    pub transaction_hash: String,
}

pub struct SmartContractManager {
    pub templates: HashMap<String, SmartContractTemplate>,
    pub deployed_contracts: HashMap<String, DeployedContract>,
    pub events: HashMap<String, ContractEvent>,
    pub interactions: HashMap<String, ContractInteraction>,
}

impl SmartContractManager {
    pub fn new() -> Self {
        Self {
            templates: HashMap::new(),
            deployed_contracts: HashMap::new(),
            events: HashMap::new(),
            interactions: HashMap::new(),
        }
    }

    pub fn add_template(&mut self, template: SmartContractTemplate) {
        self.templates.insert(template.id.clone(), template);
    }

    pub fn get_template(&self, template_id: &str) -> Option<&SmartContractTemplate> {
        self.templates.get(template_id)
    }

    pub fn get_templates(&self) -> Vec<SmartContractTemplate> {
        self.templates.values().cloned().collect()
    }

    pub fn create_template(
        name: String,
        description: String,
        contract_type: ContractType,
        bytecode: String,
        abi: String,
        creator: String,
        is_official: bool,
    ) -> Result<SmartContractTemplate, String> {
        let now = Self::now_secs();
        let template = SmartContractTemplate {
            id: format!("template-{}", Uuid::new_v4()),
            name,
            description,
            contract_type,
            bytecode,
            abi,
            creator,
            created_at: now,
            last_updated: now,
            is_official,
        };

        Ok(template)
    }

    pub fn deploy_contract(
        &mut self,
        template_id: &str,
        name: String,
        chain: String,
        owner: String,
    ) -> Result<DeployedContract, String> {
        let template = self.get_template(template_id)
            .ok_or_else(|| "Template not found".to_string())?;

        let now = Self::now_secs();
        let deployed_contract = DeployedContract {
            id: format!("contract-{}", Uuid::new_v4()),
            template_id: template.id.clone(),
            name,
            address: format!("0x{:x}", Self::generate_address()),
            chain,
            owner,
            deployed_at: now,
            status: ContractStatus::Pending,
            tx_hash: format!("0x{:x}", Self::generate_tx_hash()),
            gas_used: 21000,
        };

        let deployed_contract = deployed_contract;
        self.deployed_contracts.insert(deployed_contract.id.clone(), deployed_contract.clone());
        Ok(deployed_contract)
    }

    pub fn get_deployed_contracts(&self) -> Vec<DeployedContract> {
        self.deployed_contracts.values().cloned().collect()
    }

    pub fn get_contracts_by_owner(&self, owner: &str) -> Vec<DeployedContract> {
        self.deployed_contracts
            .values()
            .filter(|c| c.owner == owner)
            .cloned()
            .collect()
    }

    pub fn add_event(&mut self, contract_id: String, event: ContractEvent) {
        self.events.insert(event.id.clone(), event);
    }

    pub fn get_events_by_contract(&self, contract_id: &str) -> Vec<ContractEvent> {
        self.events
            .values()
            .filter(|e| e.contract_id == contract_id)
            .cloned()
            .collect()
    }

    pub fn execute_interaction(
        &mut self,
        contract_id: &str,
        function_name: String,
        caller: String,
        parameters: String,
        value: f64,
        gas_limit: u64,
    ) -> Result<ContractInteraction, String> {
        let mut interaction = ContractInteraction {
            id: format!("interaction-{}", Uuid::new_v4()),
            contract_id: contract_id.to_string(),
            function_name,
            caller,
            parameters,
            value,
            gas_limit,
            timestamp: Self::now_secs(),
            result: String::new(),
            status: InteractionStatus::Pending,
        };

        interaction.result = "Transaction executed successfully".to_string();
        interaction.status = InteractionStatus::Success;

        self.interactions.insert(interaction.id.clone(), interaction.clone());
        Ok(interaction)
    }

    pub fn get_interaction(&self, interaction_id: &str) -> Option<&ContractInteraction> {
        self.interactions.get(interaction_id)
    }

    fn generate_address() -> u64 {
        use sha2::{Digest, Sha256};
        let digest = Sha256::digest(b"salt");
        digest[0..8].iter().fold(0u64, |acc, &b| (acc << 8) | (b as u64))
    }

    fn generate_tx_hash() -> u128 {
        use sha2::{Digest, Sha256};
        let digest = Sha256::digest(b"txsalt");
        let mut hash = [0u8; 16];
        for (i, b) in digest.iter().enumerate() {
            if i < 16 {
                hash[i] = *b;
            }
        }
        u128::from_le_bytes(hash)
    }

    fn now_secs() -> i64 {
        SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs() as i64
    }
}
