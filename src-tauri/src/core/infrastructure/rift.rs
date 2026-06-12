use serde::{Deserialize, Serialize};
use uuid::Uuid;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerListing {
    pub id: String,
    pub owner_id: String,
    pub tier: String, // T1, T2, T3
    pub price_per_hour: f64,
    pub hardware_specs: HardwareSpecs,
    pub status: ServerStatus,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareSpecs {
    pub cpu_cores: u32,
    pub ram_gb: u32,
    pub storage_gb: u32,
    pub network_speed_mbps: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ServerStatus { Available, Rented, Maintenance, Offline }

pub struct RiftEngine {
    pub listings: Vec<ServerListing>,
}

impl RiftEngine {
    pub fn new() -> Self {
        RiftEngine { listings: Vec::new() }
    }

    pub fn create_listing(&mut self, owner_id: &str, tier: &str, price: f64, specs: HardwareSpecs) -> ServerListing {
        let listing = ServerListing {
            id: Uuid::new_v4().to_string(),
            owner_id: owner_id.to_string(),
            tier: tier.to_string(),
            price_per_hour: price,
            hardware_specs: specs,
            status: ServerStatus::Available,
            created_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs() as i64,
        };
        self.listings.push(listing.clone());
        listing
    }

    pub fn get_listings(&self) -> Vec<ServerListing> {
        self.listings.clone()
    }
}
