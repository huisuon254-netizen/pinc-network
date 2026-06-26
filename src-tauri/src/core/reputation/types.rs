use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReputationScore {
    pub node_id: String,
    pub relay_score: f64,   // 0.0 - 1.0 bandwidth quality
    pub job_score: f64,     // 0.0 - 1.0 job completion quality
    pub payment_score: f64, // 0.0 - 1.0 payment reliability
    pub dispute_score: f64, // 0.0 - 1.0 dispute record
    pub uptime_score: f64,  // 0.0 - 1.0 node availability
    pub total_score: f64,   // weighted composite
    pub total_reviews: u64,
    pub total_disputes: u64,
    pub disputes_won: u64,
    pub account_age_days: u64,
    pub burned: bool,
    pub burn_reason: Option<String>,
    pub updated_at: i64,
}

impl ReputationScore {
    pub fn new(node_id: &str) -> Self {
        ReputationScore {
            node_id: node_id.to_string(),
            relay_score: 0.5,
            job_score: 0.5,
            payment_score: 0.5,
            dispute_score: 1.0,
            uptime_score: 0.5,
            total_score: 0.5,
            total_reviews: 0,
            total_disputes: 0,
            disputes_won: 0,
            account_age_days: 0,
            burned: false,
            burn_reason: None,
            updated_at: 0,
        }
    }

    pub fn is_trusted(&self, min_score: f64) -> bool {
        !self.burned && self.total_score >= min_score
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Review {
    pub id: String,
    pub reviewer_id: String,
    pub subject_id: String,
    pub rating: f64, // 1.0 - 5.0
    pub category: ReviewCategory,
    pub comment: Option<String>,
    pub reference_id: Option<String>,
    pub created_at: i64,
    pub verified: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ReviewCategory {
    Job,
    Relay,
    Payment,
    General,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BurnRecord {
    pub node_id: String,
    pub reason: String,
    pub evidence_hashes: Vec<String>,
    pub burned_at: i64,
    pub permanent: bool,
    pub appeal_allowed: bool,
}
