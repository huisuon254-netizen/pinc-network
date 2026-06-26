use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use crate::core::database::connection::Database;
use crate::core::database::queries;
use crate::core::games::types::{now_secs, GameSession, GameSessionSummary, SessionState};

pub struct SessionManager {
    sessions: HashMap<String, GameSession>,
}

impl SessionManager {
    pub fn new() -> Self {
        SessionManager {
            sessions: HashMap::new(),
        }
    }

    pub fn load_from_db(&mut self, db: &Database) {
        if let Ok(db_sessions) = queries::list_game_sessions(db) {
            for ds in db_sessions {
                let players: Vec<String> = serde_json::from_str(&ds.player_ids).unwrap_or_default();
                let scores: HashMap<String, u64> =
                    serde_json::from_str(&ds.scores).unwrap_or_default();
                let state = match ds.status.as_str() {
                    "playing" => SessionState::Playing,
                    "finished" => SessionState::Finished,
                    "cancelled" => SessionState::Cancelled,
                    _ => SessionState::Waiting,
                };
                let session = GameSession {
                    id: ds.id,
                    game_id: ds.game_id,
                    host_id: players.first().cloned().unwrap_or_default(),
                    players,
                    max_players: 8,
                    state,
                    scores,
                    wager_id: None,
                    created_at: ds.created_at,
                    started_at: None,
                    ended_at: None,
                };
                self.sessions.insert(session.id.clone(), session);
            }
        }
    }

    pub fn create_session(
        &mut self,
        game_id: &str,
        host_id: &str,
        max_players: u32,
        db: &Database,
    ) -> Result<GameSession, String> {
        let session = GameSession::new(game_id.to_string(), host_id.to_string(), max_players);

        let db_session = queries::GameSession {
            id: session.id.clone(),
            game_id: session.game_id.clone(),
            player_ids: serde_json::to_string(&session.players).map_err(|e| e.to_string())?,
            wager_amount: 0.0,
            start_time: session.created_at,
            end_time: None,
            scores: serde_json::to_string(&session.scores).map_err(|e| e.to_string())?,
            status: "waiting".to_string(),
            created_at: session.created_at,
        };
        queries::insert_game_session(db, &db_session).map_err(|e| e.to_string())?;

        let s = session.clone();
        self.sessions.insert(session.id.clone(), s);
        Ok(session)
    }

    pub fn join_session(
        &mut self,
        session_id: &str,
        player_id: &str,
        db: &Database,
    ) -> Result<GameSession, String> {
        let session = self
            .sessions
            .get_mut(session_id)
            .ok_or_else(|| format!("Session '{}' not found", session_id))?;

        if session.state != SessionState::Waiting {
            return Err("Session is not accepting players".to_string());
        }
        if session.is_full() {
            return Err("Session is full".to_string());
        }
        if session.players.contains(&player_id.to_string()) {
            return Err("Already in session".to_string());
        }

        session.players.push(player_id.to_string());

        let result = session.clone();
        drop(session);
        self.persist_session(&result, db)?;
        Ok(result)
    }

    pub fn leave_session(
        &mut self,
        session_id: &str,
        player_id: &str,
        db: &Database,
    ) -> Result<GameSession, String> {
        let session = self
            .sessions
            .get_mut(session_id)
            .ok_or_else(|| format!("Session '{}' not found", session_id))?;

        if !session.players.contains(&player_id.to_string()) {
            return Err("Player not in session".to_string());
        }

        session.players.retain(|p| p != player_id);

        if session.players.is_empty() {
            session.state = SessionState::Cancelled;
        } else if session.host_id == player_id {
            session.host_id = session.players[0].clone();
        }

        let result = session.clone();
        drop(session);
        self.persist_session(&result, db)?;
        Ok(result)
    }

    pub fn start_session(
        &mut self,
        session_id: &str,
        host_id: &str,
        db: &Database,
    ) -> Result<GameSession, String> {
        let session = self
            .sessions
            .get_mut(session_id)
            .ok_or_else(|| format!("Session '{}' not found", session_id))?;

        if session.host_id != host_id {
            return Err("Only the host can start the session".to_string());
        }
        if session.state != SessionState::Waiting {
            return Err("Session already started".to_string());
        }
        if session.players.len() < 2 {
            return Err("Need at least 2 players to start".to_string());
        }

        session.state = SessionState::Playing;
        session.started_at = Some(now_secs());

        let result = session.clone();
        drop(session);
        self.persist_session(&result, db)?;
        Ok(result)
    }

    pub fn update_score(
        &mut self,
        session_id: &str,
        player_id: &str,
        score: u64,
        db: &Database,
    ) -> Result<GameSession, String> {
        let session = self
            .sessions
            .get_mut(session_id)
            .ok_or_else(|| format!("Session '{}' not found", session_id))?;

        if session.state != SessionState::Playing {
            return Err("Session is not in progress".to_string());
        }
        if !session.players.contains(&player_id.to_string()) {
            return Err("Player not in session".to_string());
        }

        session.scores.insert(player_id.to_string(), score);

        let result = session.clone();
        drop(session);
        self.persist_session(&result, db)?;
        Ok(result)
    }

    pub fn end_session(&mut self, session_id: &str, db: &Database) -> Result<GameSession, String> {
        let session = self
            .sessions
            .get_mut(session_id)
            .ok_or_else(|| format!("Session '{}' not found", session_id))?;

        if session.state != SessionState::Playing {
            return Err("Session is not in progress".to_string());
        }

        session.state = SessionState::Finished;
        session.ended_at = Some(now_secs());

        let result = session.clone();
        drop(session);
        self.persist_session(&result, db)?;
        Ok(result)
    }

    pub fn get_session(&self, session_id: &str) -> Option<GameSession> {
        self.sessions.get(session_id).cloned()
    }

    pub fn list_active_sessions(&self) -> Vec<GameSessionSummary> {
        self.sessions
            .values()
            .filter(|s| s.state == SessionState::Waiting || s.state == SessionState::Playing)
            .map(|s| s.summary())
            .collect()
    }

    pub fn get_winner(&self, session_id: &str) -> Option<String> {
        let session = self.sessions.get(session_id)?;
        if session.state != SessionState::Finished {
            return None;
        }
        session
            .scores
            .iter()
            .max_by_key(|(_, score)| *score)
            .map(|(player, _)| player.clone())
    }

    fn persist_session(&self, session: &GameSession, db: &Database) -> Result<(), String> {
        let status = match session.state {
            SessionState::Waiting => "waiting",
            SessionState::Playing => "playing",
            SessionState::Finished => "finished",
            SessionState::Cancelled => "cancelled",
        };

        let player_ids = serde_json::to_string(&session.players).map_err(|e| e.to_string())?;
        let scores = serde_json::to_string(&session.scores).map_err(|e| e.to_string())?;

        let conn = db.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO game_sessions (id, game_id, player_ids, wager_amount, start_time, end_time, scores, status, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
             ON CONFLICT(id) DO UPDATE SET
             player_ids = ?2, end_time = ?6, scores = ?7, status = ?8",
            rusqlite::params![
                session.id,
                session.game_id,
                player_ids,
                0.0f64,
                session.created_at,
                session.ended_at,
                scores,
                status,
                session.created_at,
            ],
        ).map_err(|e| e.to_string())?;
        Ok(())
    }
}
