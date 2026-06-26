use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Profile {
    pub node_id: String,
    pub display_name: String,
    pub bio: Option<String>,
    pub avatar_hash: Option<String>,
    pub skills: Vec<String>,
    pub badges: Vec<Badge>,
    pub follower_count: u64,
    pub following_count: u64,
    pub post_count: u64,
    pub joined_at: i64,
    pub verified: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Post {
    pub id: String,
    pub author_id: String,
    pub content: String,
    pub media_hashes: Vec<String>,
    pub post_type: PostType,
    pub visibility: Visibility,
    pub like_count: u64,
    pub reply_count: u64,
    pub reply_to: Option<String>,
    pub tags: Vec<String>,
    pub created_at: i64,
    pub edited_at: Option<i64>,
    pub encrypted: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PostType {
    Text,
    Image,
    Video,
    Challenge,
    Announcement,
    JobPost,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Visibility {
    Public,
    Followers,
    Private,
    Group(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Group {
    pub id: String,
    pub name: String,
    pub description: String,
    pub owner_id: String,
    pub member_count: u64,
    pub encrypted: bool,
    pub invite_only: bool,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Badge {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub awarded_at: i64,
    pub rarity: BadgeRarity,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum BadgeRarity {
    Common,
    Rare,
    Epic,
    Legendary,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Feed {
    pub posts: Vec<Post>,
    pub has_more: bool,
    pub cursor: Option<String>,
}
