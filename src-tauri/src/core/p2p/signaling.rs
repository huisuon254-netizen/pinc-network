use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CallState {
    Idle,
    Ringing,
    Connected,
    Ended,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CallType {
    Voice,
    Video,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignalingMessage {
    pub id: String,
    pub from: String,
    pub to: String,
    pub signal_type: SignalType,
    pub payload: String,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SignalType {
    Offer,
    Answer,
    IceCandidate,
    HangUp,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActiveCall {
    pub call_id: String,
    pub peer_id: String,
    pub call_type: CallType,
    pub state: CallState,
    pub started_at: Option<i64>,
    pub local_offer: Option<String>,
    pub remote_answer: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CallHistoryEntry {
    pub id: String,
    pub peer_id: String,
    pub call_type: String,
    pub started_at: Option<i64>,
    pub ended_at: Option<i64>,
    pub duration_secs: i64,
    pub status: String,
}

pub struct CallManager {
    pub active_call: Arc<RwLock<Option<ActiveCall>>>,
    pub pending_signals: Arc<RwLock<Vec<SignalingMessage>>>,
}

impl CallManager {
    pub fn new() -> Self {
        Self {
            active_call: Arc::new(RwLock::new(None)),
            pending_signals: Arc::new(RwLock::new(Vec::new())),
        }
    }

    pub async fn initiate_call(
        &self,
        peer_id: &str,
        call_type: CallType,
        local_offer: &str,
    ) -> Result<ActiveCall, String> {
        let current = self.active_call.read().await;
        if let Some(ref call) = *current {
            if call.state != CallState::Ended {
                return Err(format!("Already in a call with {}", call.peer_id));
            }
        }
        drop(current);

        let call_id = format!("call-{}", uuid::Uuid::new_v4());
        let now = chrono::Utc::now().timestamp();

        let active_call = ActiveCall {
            call_id: call_id.clone(),
            peer_id: peer_id.to_string(),
            call_type: call_type.clone(),
            state: CallState::Ringing,
            started_at: Some(now),
            local_offer: Some(local_offer.to_string()),
            remote_answer: None,
        };

        let signaling_msg = SignalingMessage {
            id: format!("sig-{}", uuid::Uuid::new_v4()),
            from: "local".to_string(),
            to: peer_id.to_string(),
            signal_type: SignalType::Offer,
            payload: local_offer.to_string(),
            timestamp: now,
        };

        {
            let mut pending = self.pending_signals.write().await;
            pending.push(signaling_msg);
        }

        {
            let mut call = self.active_call.write().await;
            *call = Some(active_call.clone());
        }

        log::info!(
            "Initiated {} call to {} (id={})",
            format!("{:?}", call_type).to_lowercase(),
            peer_id,
            call_id
        );
        Ok(active_call)
    }

    pub async fn answer_call(
        &self,
        peer_id: &str,
        remote_answer: &str,
    ) -> Result<ActiveCall, String> {
        let mut call_guard = self.active_call.write().await;

        let call = call_guard
            .as_mut()
            .ok_or_else(|| "No active call to answer".to_string())?;

        if call.peer_id != peer_id {
            return Err(format!(
                "Active call is with {}, not {}",
                call.peer_id, peer_id
            ));
        }

        if call.state != CallState::Ringing && call.state != CallState::Idle {
            return Err(format!("Call is in state {:?}, cannot answer", call.state));
        }

        let now = chrono::Utc::now().timestamp();

        let signaling_msg = SignalingMessage {
            id: format!("sig-{}", uuid::Uuid::new_v4()),
            from: "local".to_string(),
            to: peer_id.to_string(),
            signal_type: SignalType::Answer,
            payload: remote_answer.to_string(),
            timestamp: now,
        };

        {
            let mut pending = self.pending_signals.write().await;
            pending.push(signaling_msg);
        }

        call.state = CallState::Connected;
        call.remote_answer = Some(remote_answer.to_string());

        log::info!("Answered call from {}", peer_id);
        Ok(call.clone())
    }

    pub async fn accept_incoming_offer(
        &self,
        peer_id: &str,
        call_type: CallType,
        _offer: &str,
    ) -> Result<ActiveCall, String> {
        let current = self.active_call.read().await;
        if let Some(ref call) = *current {
            if call.state != CallState::Ended {
                return Err(format!("Already in a call with {}", call.peer_id));
            }
        }
        drop(current);

        let call_id = format!("call-{}", uuid::Uuid::new_v4());
        let now = chrono::Utc::now().timestamp();

        let active_call = ActiveCall {
            call_id: call_id.clone(),
            peer_id: peer_id.to_string(),
            call_type,
            state: CallState::Ringing,
            started_at: Some(now),
            local_offer: None,
            remote_answer: None,
        };

        {
            let mut call = self.active_call.write().await;
            *call = Some(active_call.clone());
        }

        log::info!("Received incoming call from {} (id={})", peer_id, call_id);
        Ok(active_call)
    }

    pub async fn receive_remote_answer(
        &self,
        peer_id: &str,
        answer: &str,
    ) -> Result<ActiveCall, String> {
        let mut call_guard = self.active_call.write().await;
        let call = call_guard
            .as_mut()
            .ok_or_else(|| "No active call".to_string())?;

        if call.peer_id != peer_id {
            return Err(format!("No call with peer {}", peer_id));
        }

        call.state = CallState::Connected;
        call.remote_answer = Some(answer.to_string());

        log::info!("Call connected with {}", peer_id);
        Ok(call.clone())
    }

    pub async fn hang_up(&self) -> Result<CallHistoryEntry, String> {
        let mut call_guard = self.active_call.write().await;
        let call = call_guard
            .as_mut()
            .ok_or_else(|| "No active call to hang up".to_string())?;

        let now = chrono::Utc::now().timestamp();
        let peer_id = call.peer_id.clone();
        let call_type = format!("{:?}", call.call_type);
        let call_id = call.call_id.clone();
        let started_at = call.started_at.unwrap_or(now);
        let duration = (now - started_at).max(0);

        let signaling_msg = SignalingMessage {
            id: format!("sig-{}", uuid::Uuid::new_v4()),
            from: "local".to_string(),
            to: peer_id.clone(),
            signal_type: SignalType::HangUp,
            payload: String::new(),
            timestamp: now,
        };

        {
            let mut pending = self.pending_signals.write().await;
            pending.push(signaling_msg);
        }

        let history_entry = CallHistoryEntry {
            id: call_id,
            peer_id,
            call_type,
            started_at: Some(started_at),
            ended_at: Some(now),
            duration_secs: duration,
            status: "ended".to_string(),
        };

        call.state = CallState::Ended;
        call_guard.take();

        log::info!("Call hung up, duration={}s", duration);
        Ok(history_entry)
    }

    pub async fn get_call_status(&self) -> Option<ActiveCall> {
        let call = self.active_call.read().await;
        call.clone()
    }

    pub async fn drain_pending_signals(&self) -> Vec<SignalingMessage> {
        let mut pending = self.pending_signals.write().await;
        std::mem::take(&mut *pending)
    }

    pub async fn receive_signal(&self, signal: SignalingMessage) -> Result<(), String> {
        match signal.signal_type {
            SignalType::Offer => {
                self.accept_incoming_offer(&signal.from, CallType::Voice, &signal.payload)
                    .await?;
            }
            SignalType::Answer => {
                self.receive_remote_answer(&signal.from, &signal.payload)
                    .await?;
            }
            SignalType::HangUp => {
                let mut call_guard = self.active_call.write().await;
                if let Some(ref call) = *call_guard {
                    if call.peer_id == signal.from {
                        call_guard.take();
                        log::info!("Remote peer {} ended call", signal.from);
                    }
                }
            }
            SignalType::IceCandidate => {
                log::info!("Received ICE candidate from {}", signal.from);
            }
        }
        Ok(())
    }
}

impl Default for CallManager {
    fn default() -> Self {
        Self::new()
    }
}
