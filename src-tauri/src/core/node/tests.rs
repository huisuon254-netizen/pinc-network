#[cfg(test)]
mod tests {
    use crate::core::node::types::NodeStatus;
    #[test]
    fn test_default_node_status() {
        let s = NodeStatus::default();
        assert!(!s.online);
        assert!(s.node_id.is_none());
    }
}
