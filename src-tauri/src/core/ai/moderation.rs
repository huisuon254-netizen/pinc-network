use crate::core::ai::types::{ModerationAction, ModerationCategory, ModerationResult};

const SPAM_KEYWORDS: &[&str] = &["free money", "click here", "guaranteed", "100% profit", "winner"];
const FRAUD_KEYWORDS: &[&str] = &["pay upfront", "wire transfer", "gift card", "western union"];

/// Rule-based content moderation (Phase 11 full version uses trained model)
pub fn moderate_content(content_id: &str, content: &str) -> ModerationResult {
    let lower = content.to_lowercase();
    let mut categories = Vec::new();
    let mut confidence = 0.0f64;

    let spam_hits = SPAM_KEYWORDS.iter().filter(|&&kw| lower.contains(kw)).count();
    let fraud_hits = FRAUD_KEYWORDS.iter().filter(|&&kw| lower.contains(kw)).count();

    if spam_hits > 0 {
        categories.push(ModerationCategory::Spam);
        confidence = confidence.max(spam_hits as f64 * 0.3);
    }
    if fraud_hits > 0 {
        categories.push(ModerationCategory::Fraud);
        confidence = confidence.max(fraud_hits as f64 * 0.4);
    }

    // Very short content with only links
    if content.len() < 20 && content.contains("http") {
        categories.push(ModerationCategory::Spam);
        confidence = confidence.max(0.6);
    }

    let flagged = confidence > 0.3;
    let action = if confidence > 0.8 { ModerationAction::Remove }
        else if confidence > 0.5 { ModerationAction::Warn }
        else if flagged { ModerationAction::Warn }
        else { ModerationAction::Allow };

    if categories.is_empty() { categories.push(ModerationCategory::Safe); }

    ModerationResult {
        content_id: content_id.to_string(),
        flagged,
        confidence: confidence.min(1.0),
        categories,
        action,
        reason: if flagged { Some("Rule-based detection".to_string()) } else { None },
    }
}

/// Detect likely fake work submission
pub fn detect_fake_work(description: &str, file_count: usize, time_spent_mins: u64) -> (bool, f64) {
    let mut score = 0.0f64;
    if description.len() < 20 { score += 0.3; }
    if file_count == 0 { score += 0.4; }
    if time_spent_mins < 1 { score += 0.3; }
    let flagged = score > 0.5;
    (flagged, score.min(1.0))
}

/// Detect anomalous relay usage (possible abuse)
pub fn detect_relay_abuse(
    bytes_last_hour: u64,
    avg_hourly_bytes: u64,
    connection_count: u32,
) -> (bool, f64) {
    let ratio = if avg_hourly_bytes == 0 { 10.0 } else { bytes_last_hour as f64 / avg_hourly_bytes as f64 };
    let conn_score = if connection_count > 200 { 0.5 } else { connection_count as f64 / 400.0 };
    let traffic_score = ((ratio - 1.0) / 9.0).clamp(0.0, 1.0);
    let total = (traffic_score * 0.6 + conn_score * 0.4).min(1.0);
    (total > 0.7, total)
}
