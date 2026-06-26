pub fn require_non_empty(value: &str, field: &str) -> Result<(), String> {
    if value.trim().is_empty() {
        Err(format!("{} must not be empty", field))
    } else {
        Ok(())
    }
}

pub fn require_positive_timestamp(ts: i64, field: &str) -> Result<(), String> {
    if ts <= 0 {
        Err(format!("{} must be a positive timestamp", field))
    } else {
        Ok(())
    }
}

pub fn require_len_32(data: &[u8], field: &str) -> Result<(), String> {
    if data.len() != 32 {
        Err(format!("{} must be 32 bytes, got {}", field, data.len()))
    } else {
        Ok(())
    }
}
