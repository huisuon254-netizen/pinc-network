use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TreificStatus {
    pub communities_active: u64,
    pub total_members: u64,
    pub messages_per_minute: u64,
    pub voice_active: u64,
    pub video_active: u64,
    pub file_transfers_active: u64,
    pub total_data_gb: f64,
    pub active_chats: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommunityInfo {
    pub id: String,
    pub name: String,
    pub members: u64,
    pub activity: String,
    pub community_type: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TreificTrafficStats {
    pub messages_per_minute: u64,
    pub voice_active: u64,
    pub video_active: u64,
    pub file_transfers_active: u64,
    pub total_data_gb: f64,
    pub active_chats: u64,
}
