use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;
use crate::core::wager::{
    errors::WagerError,
    types::{Wager, WagerOutcome, WagerStatus, PLATFORM_FEE_PCT, MIN_REFEREES},
};

pub fn create_wager(
    challenger_id: &str, opponent_id: &str,
    amount: f64, game_type: &str, description: &str,
    expires_in_secs: Option<i64>,
) -> Result<Wager, WagerError> {
    if challenger_id == opponent_id { return Err(WagerError::SelfWager); }
    if amount <= 0.0 { return Err(WagerError::InsufficientBalance { need: 0.01, have: amount }); }
    let now = now_secs();
    Ok(Wager {
        id: Uuid::new_v4().to_string(),
        challenger_id: challenger_id.to_string(),
        opponent_id: opponent_id.to_string(),
        amount, currency: "PINC".to_string(),
        game_type: game_type.to_string(),
        description: description.to_string(),
        status: WagerStatus::Pending,
        outcome: None, winner_id: None,
        referee_ids: Vec::new(),
        created_at: now,
        accepted_at: None,
        expires_at: expires_in_secs.map(|s| now + s),
        evidence_hashes: Vec::new(),
        platform_fee_pct: PLATFORM_FEE_PCT,
    })
}

pub fn accept_wager(wager: &mut Wager) -> Result<(), WagerError> {
    if wager.status != WagerStatus::Pending { return Err(WagerError::AlreadyAccepted); }
    if is_expired(wager) { return Err(WagerError::Expired); }
    if wager.referee_ids.len() < MIN_REFEREES {
        return Err(WagerError::InsufficientReferees { need: MIN_REFEREES, have: wager.referee_ids.len() });
    }
    wager.status = WagerStatus::Accepted;
    wager.accepted_at = Some(now_secs());
    Ok(())
}

pub fn finalize_wager(wager: &mut Wager, outcome: WagerOutcome) -> Result<f64, WagerError> {
    if wager.status != WagerStatus::InProgress && wager.status != WagerStatus::PendingVerification {
        return Err(WagerError::NotFound(wager.id.clone()));
    }
    let platform_fee = wager.amount * 2.0 * wager.platform_fee_pct;
    let winner_payout = (wager.amount * 2.0) - platform_fee;
    wager.outcome = Some(outcome.clone());
    wager.winner_id = match &outcome {
        WagerOutcome::ChallengerWins => Some(wager.challenger_id.clone()),
        WagerOutcome::OpponentWins   => Some(wager.opponent_id.clone()),
        WagerOutcome::Draw           => None,
        WagerOutcome::Cancelled      => None,
    };
    wager.status = WagerStatus::Completed;
    Ok(winner_payout)
}

pub fn is_expired(wager: &Wager) -> bool {
    if let Some(exp) = wager.expires_at { return now_secs() > exp; }
    false
}

pub fn add_referee(wager: &mut Wager, referee_id: &str) -> Result<(), WagerError> {
    if wager.referee_ids.contains(&referee_id.to_string()) {
        return Err(WagerError::AlreadyRegistered);
    }
    wager.referee_ids.push(referee_id.to_string());
    Ok(())
}

fn now_secs() -> i64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs() as i64
}
