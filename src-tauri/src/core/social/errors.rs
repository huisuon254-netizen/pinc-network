use thiserror::Error;
#[derive(Debug, Error)]
pub enum SocialError {
    #[error("Profile not found: {0}")] ProfileNotFound(String),
    #[error("Post not found: {0}")] PostNotFound(String),
    #[error("Group not found: {0}")] GroupNotFound(String),
    #[error("Not a member of group: {0}")] NotMember(String),
    #[error("Content too long: {len} chars (max {max})")] ContentTooLong { len: usize, max: usize },
    #[error("Content flagged: {0}")] ContentFlagged(String),
    #[error("Already following")] AlreadyFollowing,
    #[error("Not following")] NotFollowing,
}
