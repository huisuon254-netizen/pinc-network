use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum JobStatus {
    Open,
    InProgress,
    PendingReview,
    Completed,
    Disputed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum BidStatus {
    Pending,
    Accepted,
    Rejected,
    Withdrawn,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Job {
    pub id: String,
    pub owner_id: String,
    pub title: String,
    pub description: String,
    pub skills_required: Vec<String>,
    pub budget: f64,
    pub currency: String,
    pub milestones: Vec<Milestone>,
    pub status: JobStatus,
    pub deadline: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
    pub applicant_count: u32,
    pub selected_worker: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Milestone {
    pub id: String,
    pub job_id: String,
    pub title: String,
    pub description: String,
    pub amount: f64,
    pub due_date: Option<i64>,
    pub completed: bool,
    pub proof_hash: Option<String>,
    pub approved: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bid {
    pub id: String,
    pub job_id: String,
    pub bidder_id: String,
    pub amount: f64,
    pub proposal: String,
    pub delivery_days: u32,
    pub status: BidStatus,
    pub submitted_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkerProfile {
    pub node_id: String,
    pub display_name: String,
    pub skills: Vec<String>,
    pub completed_jobs: u32,
    pub reputation_score: f64,
    pub hourly_rate: Option<f64>,
    pub available: bool,
    pub bio: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Dispute {
    pub id: String,
    pub job_id: String,
    pub raised_by: String,
    pub reason: String,
    pub evidence_hashes: Vec<String>,
    pub status: DisputeStatus,
    pub arbitrator_id: Option<String>,
    pub resolution: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DisputeStatus {
    Open,
    UnderReview,
    Resolved,
    Escalated,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProofOfWork {
    pub milestone_id: String,
    pub worker_id: String,
    pub description: String,
    pub file_hashes: Vec<String>,
    pub submitted_at: i64,
    pub verified: bool,
}
