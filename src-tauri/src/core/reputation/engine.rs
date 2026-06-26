use crate::core::reputation::errors::RepuationError;
use crate::core::reputation::types::{BurnRecord, ReputationScore, Review, ReviewCategory};
use std::time::{SystemTime, UNIX_EPOCH};

// Weights for composite score
const W_RELAY: f64 = 0.20;
const W_JOB: f64 = 0.30;
const W_PAYMENT: f64 = 0.25;
const W_DISPUTE: f64 = 0.15;
const W_UPTIME: f64 = 0.10;

pub fn recalculate_total(rep: &mut ReputationScore) {
    rep.total_score = rep.relay_score * W_RELAY
        + rep.job_score * W_JOB
        + rep.payment_score * W_PAYMENT
        + rep.dispute_score * W_DISPUTE
        + rep.uptime_score * W_UPTIME;
    rep.updated_at = now_secs();
}

pub fn apply_review(rep: &mut ReputationScore, review: &Review) {
    let normalized = (review.rating - 1.0) / 4.0; // 1-5 → 0-1
    let weight = 1.0 / (rep.total_reviews as f64 + 1.0);
    match review.category {
        ReviewCategory::Job => rep.job_score = lerp(rep.job_score, normalized, weight),
        ReviewCategory::Relay => rep.relay_score = lerp(rep.relay_score, normalized, weight),
        ReviewCategory::Payment => rep.payment_score = lerp(rep.payment_score, normalized, weight),
        ReviewCategory::General => {
            rep.job_score = lerp(rep.job_score, normalized, weight * 0.5);
            rep.relay_score = lerp(rep.relay_score, normalized, weight * 0.5);
        }
    }
    rep.total_reviews += 1;
    recalculate_total(rep);
}

pub fn apply_uptime(rep: &mut ReputationScore, uptime_pct: f64) {
    rep.uptime_score = (uptime_pct / 100.0).clamp(0.0, 1.0);
    recalculate_total(rep);
}

pub fn record_dispute_result(rep: &mut ReputationScore, won: bool) {
    rep.total_disputes += 1;
    if won {
        rep.disputes_won += 1;
    }
    let win_rate = rep.disputes_won as f64 / rep.total_disputes as f64;
    rep.dispute_score = win_rate;
    recalculate_total(rep);
}

pub fn burn_account(rep: &mut ReputationScore, reason: &str, permanent: bool) -> BurnRecord {
    rep.burned = true;
    rep.burn_reason = Some(reason.to_string());
    rep.total_score = 0.0;
    BurnRecord {
        node_id: rep.node_id.clone(),
        reason: reason.to_string(),
        evidence_hashes: Vec::new(),
        burned_at: now_secs(),
        permanent,
        appeal_allowed: !permanent,
    }
}

fn lerp(current: f64, target: f64, weight: f64) -> f64 {
    (current * (1.0 - weight) + target * weight).clamp(0.0, 1.0)
}

fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}
