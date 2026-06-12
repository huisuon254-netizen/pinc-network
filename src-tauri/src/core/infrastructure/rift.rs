use serde::{Deserialize, Serialize};
use uuid::Uuid;
use std::time::{SystemTime, UNIX_EPOCH};
use chrono;
use serde_json;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerListing {
    pub id: String,
    pub owner_id: String,
    pub tier: String, // T1, T2, T3
    pub price_per_hour: f64,
    pub hardware_specs: HardwareSpecs,
    pub status: ServerStatus,
    pub created_at: i64,
    pub rental_start: Option<i64>,
    pub rental_duration_hours: Option<u32>,
    pub renter_id: Option<String>,
    pub reputation_score: Option<f64>,
    pub total_earnings: f64,
    pub metrics: ServerMetrics,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareSpecs {
    pub cpu_cores: u32,
    pub ram_gb: u32,
    pub storage_gb: u32,
    pub network_speed_mbps: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ServerStatus { Available, Rented, Maintenance, Offline, Reserved }

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ServerMetrics {
    pub uptime_percentage: f64,
    pub cpu_usage: f64,
    pub ram_usage: f64,
    pub disk_usage: f64,
    pub network_in_mbps: f64,
    pub network_out_mbps: f64,
    pub total_rentals: u32,
    pub total_earnings: f64,
    pub average_rating: f64,
    pub last_updated: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum HardwareValidationError {
    CpuTooLow,
    MemoryTooLow,
    StorageTooLow,
    NetworkTooLow,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum RentalPeriod {
    Hourly,
    Daily,
    Weekly,
    Monthly,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RentalAgreement {
    pub server_id: String,
    pub renter_id: String,
    pub owner_id: String,
    pub period: RentalPeriod,
    pub start_time: i64,
    pub end_time: i64,
    pub total_cost: f64,
    pub status: RentalStatus,
    pub payment_transaction_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum RentalStatus { Active, Completed, Cancelled, Disputes }

pub struct RiftEngine {
    pub listings: Vec<ServerListing>,
    pub active_rentals: Vec<RentalAgreement>,
    pub payment_pending: Vec<RentalAgreement>,
}

impl RiftEngine {
    pub fn new() -> Self {
        RiftEngine {
            listings: Vec::new(),
            active_rentals: Vec::new(),
            payment_pending: Vec::new(),
        }
    }

    pub fn create_listing(&mut self, owner_id: &str, tier: &str, price: f64, specs: HardwareSpecs) -> Result<ServerListing, HardwareValidationError> {
        validate_hardware_specs(&specs)?;
        let price_per_hour = determine_price(tier, &specs);
        let listing = ServerListing {
            id: Uuid::new_v4().to_string(),
            owner_id: owner_id.to_string(),
            tier: tier.to_string(),
            price_per_hour,
            hardware_specs: specs,
            status: ServerStatus::Available,
            created_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs() as i64,
            rental_start: None,
            rental_duration_hours: None,
            renter_id: None,
            reputation_score: None,
            total_earnings: 0.0,
            metrics: ServerMetrics::default(),
        };
        self.listings.push(listing.clone());
        Ok(listing)
    }

    pub fn get_listings(&self) -> Vec<ServerListing> {
        self.listings.clone()
    }

    pub fn rent_server(&mut self, listing_id: &str, renter_id: &str, period: RentalPeriod, duration_hours: u32) -> Result<RentalAgreement, String> {
        let listing = self.listings.iter_mut().find(|l| l.id == listing_id);
        if let Some(listing) = listing {
            if listing.status != ServerStatus::Available {
                return Err("Server not available for rent".to_string());
            }
            let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs() as i64;
            let end_time = now + (duration_hours as i64 * 3600);
            let total_cost = calculate_rental_cost(listing.price_per_hour, duration_hours, &period);
            let rental = RentalAgreement {
                server_id: listing_id.to_string(),
                renter_id: renter_id.to_string(),
                owner_id: listing.owner_id.clone(),
                period,
                start_time: now,
                end_time,
                total_cost,
                status: RentalStatus::Active,
                payment_transaction_id: None,
            };
            listing.status = ServerStatus::Rented;
            listing.rental_start = Some(now);
            listing.rental_duration_hours = Some(duration_hours);
            listing.renter_id = Some(renter_id.to_string());
            self.active_rentals.push(rental.clone());
            Ok(rental)
        } else {
            Err("Server listing not found".to_string())
        }
    }

    pub fn return_server(&mut self, rental_id: &str) -> Result<(), String> {
        let rental = self.active_rentals.iter_mut().find(|r| r.id == rental_id);
        if let Some(rental) = rental {
            if rental.status != RentalStatus::Active {
                return Err("Rental not active".to_string());
            }
            rental.status = RentalStatus::Completed;
            let listing = self.listings.iter_mut().find(|l| l.id == rental.server_id);
            if let Some(listing) = listing {
                listing.status = ServerStatus::Available;
                listing.rental_start = None;
                listing.rental_duration_hours = None;
                listing.renter_id = None;
                listing.total_earnings += rental.total_cost;
                listing.metrics.total_rentals += 1;
                listing.metrics.total_earnings += rental.total_cost;
            }
            Ok(())
        } else {
            Err("Rental agreement not found".to_string())
        }
    }

    pub fn update_metrics(&mut self, listing_id: &str, metrics: ServerMetrics) -> Result<(), String> {
        let listing = self.listings.iter_mut().find(|l| l.id == listing_id);
        if let Some(listing) = listing {
            listing.metrics = metrics;
            Ok(())
        } else {
            Err("Server listing not found".to_string())
        }
    }

    pub fn get_listing(&self, listing_id: &str) -> Option<ServerListing> {
        self.listings.iter().find(|l| l.id == listing_id).cloned()
    }

    pub fn get_active_rentals(&self) -> Vec<RentalAgreement> {
        self.active_rentals.clone()
    }
}

fn validate_hardware_specs(specs: &HardwareSpecs) -> Result<(), HardwareValidationError> {
    if specs.cpu_cores < 2 { return Err(HardwareValidationError::CpuTooLow); }
    if specs.ram_gb < 4 { return Err(HardwareValidationError::MemoryTooLow); }
    if specs.storage_gb < 20 { return Err(HardwareValidationError::StorageTooLow); }
    if specs.network_speed_mbps < 100 { return Err(HardwareValidationError::NetworkTooLow); }
    Ok(())
}

fn determine_price(tier: &str, specs: &HardwareSpecs) -> f64 {
    let base_price = match tier {
        "T1" => 5.0,
        "T2" => 10.0,
        "T3" => 20.0,
        _ => 5.0,
    };
    let cpu_factor = specs.cpu_cores as f64 / 2.0;
    let ram_factor = specs.ram_gb as f64 / 4.0;
    let storage_factor = specs.storage_gb as f64 / 20.0;
    let network_factor = specs.network_speed_mbps as f64 / 100.0;
    base_price * (cpu_factor * 0.3 + ram_factor * 0.3 + storage_factor * 0.2 + network_factor * 0.2)
}

fn calculate_rental_cost(base_price: f64, duration_hours: u32, period: &RentalPeriod) -> f64 {
    let hourly_rate = base_price;
    let discount_factor = match period {
        RentalPeriod::Hourly => 1.0,
        RentalPeriod::Daily => 0.9,
        RentalPeriod::Weekly => 0.8,
        RentalPeriod::Monthly => 0.75,
    };
    let base_cost = hourly_rate * duration_hours as f64 * discount_factor;
    let tax_rate = 0.08;
    base_cost * (1.0 + tax_rate)
}
