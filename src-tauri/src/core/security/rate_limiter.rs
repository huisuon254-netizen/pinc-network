use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

const MAX_LOGIN_ATTEMPTS: u32 = 5;
const LOCKOUT_DURATION_SECS: i64 = 900; // 15 minutes
const API_RATE_LIMIT: u64 = 100; // per minute

#[derive(Clone, Debug)]
struct LoginAttemptEntry {
    count: u32,
    first_attempt_at: i64,
    locked_until: Option<i64>,
}

pub struct LoginRateLimiter {
    attempts: HashMap<String, LoginAttemptEntry>,
}

impl LoginRateLimiter {
    pub fn new() -> Self {
        LoginRateLimiter {
            attempts: HashMap::new(),
        }
    }

    fn now_secs() -> i64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64
    }

    pub fn record_failed_attempt(&mut self, username: &str) {
        let now = Self::now_secs();
        let entry = self.attempts.entry(username.to_string()).or_insert_with(|| {
            LoginAttemptEntry {
                count: 0,
                first_attempt_at: now,
                locked_until: None,
            }
        });

        // If currently locked and lockout expired, reset
        if let Some(locked_until) = entry.locked_until {
            if now >= locked_until {
                entry.count = 0;
                entry.first_attempt_at = now;
                entry.locked_until = None;
            }
        }

        entry.count += 1;

        if entry.count >= MAX_LOGIN_ATTEMPTS {
            entry.locked_until = Some(now + LOCKOUT_DURATION_SECS);
        }
    }

    pub fn record_success(&mut self, username: &str) {
        self.attempts.remove(username);
    }

    pub fn is_locked(&mut self, username: &str) -> bool {
        let now = Self::now_secs();
        if let Some(entry) = self.attempts.get_mut(username) {
            if let Some(locked_until) = entry.locked_until {
                if now >= locked_until {
                    entry.count = 0;
                    entry.locked_until = None;
                    return false;
                }
                return true;
            }
        }
        false
    }

    pub fn remaining_attempts(&self, username: &str) -> u32 {
        if let Some(entry) = self.attempts.get(username) {
            let remaining = MAX_LOGIN_ATTEMPTS.saturating_sub(entry.count);
            remaining
        } else {
            MAX_LOGIN_ATTEMPTS
        }
    }

    pub fn lockout_remaining_secs(&self, username: &str) -> i64 {
        let now = Self::now_secs();
        if let Some(entry) = self.attempts.get(username) {
            if let Some(locked_until) = entry.locked_until {
                return (locked_until - now).max(0);
            }
        }
        0
    }
}

pub struct ApiRateLimiter {
    counts: HashMap<String, (u64, i64)>,
    limit_per_minute: u64,
}

impl ApiRateLimiter {
    pub fn new() -> Self {
        ApiRateLimiter {
            counts: HashMap::new(),
            limit_per_minute: API_RATE_LIMIT,
        }
    }

    fn now_secs() -> i64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64
    }

    pub fn check(&mut self, node_id: &str) -> bool {
        let now = Self::now_secs();
        let entry = self.counts.entry(node_id.to_string()).or_insert((0, now));

        // Reset if more than 60 seconds have passed
        if now - entry.1 >= 60 {
            *entry = (0, now);
        }

        entry.0 += 1;
        entry.0 <= self.limit_per_minute
    }

    pub fn reset(&mut self, node_id: &str) {
        self.counts.remove(node_id);
    }
}
