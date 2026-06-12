#[cfg(test)]
mod tests {
    use crate::core::social::types::{Badge, BadgeRarity, Post, PostType, Profile, Visibility};

    fn mock_profile(id: &str) -> Profile {
        Profile { node_id: id.to_string(), display_name: "Test".to_string(), bio: None,
            avatar_hash: None, skills: vec![], badges: vec![], follower_count: 0,
            following_count: 0, post_count: 0, joined_at: 1700000000, verified: false }
    }

    #[test]
    fn test_profile_creation() {
        let p = mock_profile("node-1");
        assert_eq!(p.node_id, "node-1");
        assert!(!p.verified);
        assert_eq!(p.follower_count, 0);
    }

    #[test]
    fn test_post_visibility_public() {
        let post = Post { id: "p1".to_string(), author_id: "a".to_string(),
            content: "hello PINC".to_string(), media_hashes: vec![],
            post_type: PostType::Text, visibility: Visibility::Public,
            like_count: 0, reply_count: 0, reply_to: None, tags: vec![],
            created_at: 1700000000, edited_at: None, encrypted: false };
        assert_eq!(post.visibility, Visibility::Public);
    }

    #[test]
    fn test_badge_rarity() {
        let badge = Badge { id: "b1".to_string(), name: "Pioneer".to_string(),
            description: "Early adopter".to_string(), icon: "🔥".to_string(),
            awarded_at: 1700000000, rarity: BadgeRarity::Legendary };
        assert_eq!(badge.rarity, BadgeRarity::Legendary);
    }
}
