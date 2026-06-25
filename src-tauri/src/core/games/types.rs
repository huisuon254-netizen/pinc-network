use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SessionState {
    Waiting,
    Playing,
    Finished,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameSession {
    pub id: String,
    pub game_id: String,
    pub host_id: String,
    pub players: Vec<String>,
    pub max_players: u32,
    pub state: SessionState,
    pub scores: HashMap<String, u64>,
    pub wager_id: Option<String>,
    pub created_at: i64,
    pub started_at: Option<i64>,
    pub ended_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameSessionSummary {
    pub id: String,
    pub game_id: String,
    pub host_id: String,
    pub player_count: u32,
    pub max_players: u32,
    pub state: SessionState,
    pub created_at: i64,
}

impl GameSession {
    pub fn new(game_id: String, host_id: String, max_players: u32) -> Self {
        let now = now_secs();
        let mut players = Vec::new();
        players.push(host_id.clone());
        GameSession {
            id: format!("gs-{}", uuid::Uuid::new_v4()),
            game_id,
            host_id,
            players,
            max_players: max_players.max(2),
            state: SessionState::Waiting,
            scores: HashMap::new(),
            wager_id: None,
            created_at: now,
            started_at: None,
            ended_at: None,
        }
    }

    pub fn is_full(&self) -> bool {
        self.players.len() >= self.max_players as usize
    }

    pub fn summary(&self) -> GameSessionSummary {
        GameSessionSummary {
            id: self.id.clone(),
            game_id: self.game_id.clone(),
            host_id: self.host_id.clone(),
            player_count: self.players.len() as u32,
            max_players: self.max_players,
            state: self.state.clone(),
            created_at: self.created_at,
        }
    }
}

pub fn now_secs() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}
