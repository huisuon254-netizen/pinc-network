use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum WagerStatus { Pending, Accepted, InProgress, PendingVerification, Completed, Disputed, Cancelled, Expired }

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum WagerOutcome { ChallengerWins, OpponentWins, Draw, Cancelled }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Wager {
    pub id: String,
    pub challenger_id: String,
    pub opponent_id: String,
    pub amount: f64,
    pub currency: String,
    pub game_type: String,
    pub description: String,
    pub status: WagerStatus,
    pub outcome: Option<WagerOutcome>,
    pub winner_id: Option<String>,
    pub referee_ids: Vec<String>,
    pub created_at: i64,
    pub accepted_at: Option<i64>,
    pub expires_at: Option<i64>,
    pub evidence_hashes: Vec<String>,
    pub platform_fee_pct: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tournament {
    pub id: String,
    pub host_id: String,
    pub name: String,
    pub game_type: String,
    pub entry_fee: f64,
    pub prize_pool: f64,
    pub max_participants: u32,
    pub participants: Vec<String>,
    pub bracket: Vec<TournamentMatch>,
    pub status: TournamentStatus,
    pub created_at: i64,
    pub starts_at: i64,
    pub referee_ids: Vec<String>,
    pub host_fee_pct: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TournamentStatus { Registration, InProgress, Completed, Cancelled }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TournamentMatch {
    pub id: String,
    pub tournament_id: String,
    pub round: u32,
    pub player1_id: Option<String>,
    pub player2_id: Option<String>,
    pub winner_id: Option<String>,
    pub completed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefereeVote {
    pub wager_id: String,
    pub referee_id: String,
    pub outcome: WagerOutcome,
    pub evidence_reviewed: Vec<String>,
    pub notes: Option<String>,
    pub voted_at: i64,
}

pub const PLATFORM_FEE_PCT: f64 = 0.025; // 2.5%
pub const MIN_REFEREES: usize = 3;
pub const REFEREE_FEE_PCT: f64 = 0.01;   // 1% split among referees
