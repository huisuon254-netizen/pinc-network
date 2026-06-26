use crate::core::marketplace::{
    errors::MarketplaceError,
    types::{Bid, BidStatus, Job, JobStatus, Milestone, ProofOfWork, WorkerProfile},
};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

pub fn create_job(
    owner_id: &str,
    title: &str,
    description: &str,
    budget: f64,
    skills: Vec<String>,
    milestones: Vec<Milestone>,
) -> Result<Job, MarketplaceError> {
    if budget <= 0.0 {
        return Err(MarketplaceError::InsufficientBudget {
            need: 0.01,
            have: budget,
        });
    }
    let milestone_total: f64 = milestones.iter().map(|m| m.amount).sum();
    if milestones.len() > 0 && (milestone_total - budget).abs() > 0.01 {
        return Err(MarketplaceError::InvalidMilestoneAmount);
    }
    let now = now_secs();
    Ok(Job {
        id: Uuid::new_v4().to_string(),
        owner_id: owner_id.to_string(),
        title: title.to_string(),
        description: description.to_string(),
        skills_required: skills,
        budget,
        currency: "PINC".to_string(),
        milestones,
        status: JobStatus::Open,
        deadline: None,
        created_at: now,
        updated_at: now,
        applicant_count: 0,
        selected_worker: None,
    })
}

pub fn submit_bid(
    job: &Job,
    bidder_id: &str,
    amount: f64,
    proposal: &str,
    days: u32,
) -> Result<Bid, MarketplaceError> {
    if job.status != JobStatus::Open {
        return Err(MarketplaceError::JobNotOpen(job.status.clone()));
    }
    if amount > job.budget * 2.0 {
        return Err(MarketplaceError::InsufficientBudget {
            need: amount,
            have: job.budget,
        });
    }
    Ok(Bid {
        id: Uuid::new_v4().to_string(),
        job_id: job.id.clone(),
        bidder_id: bidder_id.to_string(),
        amount,
        proposal: proposal.to_string(),
        delivery_days: days,
        status: BidStatus::Pending,
        submitted_at: now_secs(),
    })
}

pub fn accept_bid(job: &mut Job, bid: &mut Bid) -> Result<(), MarketplaceError> {
    if job.status != JobStatus::Open {
        return Err(MarketplaceError::JobNotOpen(job.status.clone()));
    }
    bid.status = BidStatus::Accepted;
    job.status = JobStatus::InProgress;
    job.selected_worker = Some(bid.bidder_id.clone());
    Ok(())
}

pub fn submit_proof(
    milestone_id: &str,
    worker_id: &str,
    description: &str,
    file_hashes: Vec<String>,
) -> ProofOfWork {
    ProofOfWork {
        milestone_id: milestone_id.to_string(),
        worker_id: worker_id.to_string(),
        description: description.to_string(),
        file_hashes,
        submitted_at: now_secs(),
        verified: false,
    }
}

pub fn approve_milestone(
    milestone: &mut Milestone,
    proof: &ProofOfWork,
) -> Result<(), MarketplaceError> {
    milestone.completed = true;
    milestone.approved = true;
    milestone.proof_hash = proof.file_hashes.first().cloned();
    Ok(())
}

fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}
