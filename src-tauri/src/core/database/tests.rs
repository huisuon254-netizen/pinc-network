#[cfg(test)]
mod tests {
    use crate::core::{
        database::{connection::open_test_db, queries::*, validator::check_schema_version},
        identity::types::Identity,
        vault::types::VaultFileRecord,
    };

    fn mock_id(id: &str) -> Identity {
        Identity {
            id: id.to_string(),
            node_id: "1234567".to_string(),
            username: "test".to_string(),
            public_key: "cHVia2V5".to_string(),
            private_key_encrypted: "ZW5jcnlwdGVk".to_string(),
            fingerprint: "fp_abc123".to_string(),
            recovery_key_hash: "rkhash".to_string(),
            recovery_phrase_hash: "rphash".to_string(),
            password_hash: "phash".to_string(),
            created_at: 1700000000,
        }
    }

    #[test]
    fn test_db_opens() {
        assert!(open_test_db().is_ok());
    }
    #[test]
    fn test_schema_version_ok() {
        let db = open_test_db().unwrap();
        assert!(check_schema_version(&db).is_ok());
    }

    #[test]
    fn test_insert_and_load_identity() {
        let db = open_test_db().unwrap();
        insert_identity(&db, &mock_id("id-001")).unwrap();
        let loaded = load_identity(&db, "id-001").unwrap();
        assert_eq!(loaded.id, "id-001");
    }

    #[test]
    fn test_identity_count() {
        let db = open_test_db().unwrap();
        assert_eq!(identity_count(&db).unwrap(), 0);
        insert_identity(&db, &mock_id("id-a")).unwrap();
        insert_identity(&db, &mock_id("id-b")).unwrap();
        assert_eq!(identity_count(&db).unwrap(), 2);
    }

    #[test]
    fn test_load_missing_returns_error() {
        let db = open_test_db().unwrap();
        assert!(load_identity(&db, "nonexistent").is_err());
    }

    #[test]
    fn test_duplicate_id_fails() {
        let db = open_test_db().unwrap();
        insert_identity(&db, &mock_id("dup")).unwrap();
        assert!(insert_identity(&db, &mock_id("dup")).is_err());
    }

    #[test]
    fn test_vault_insert_and_list() {
        let db = open_test_db().unwrap();
        let rec = VaultFileRecord {
            id: "vf-001".to_string(),
            name: "test.txt".to_string(),
            hash: "abc".to_string(),
            encrypted: true,
            size_bytes: 100,
            created_at: 1700000000,
        };
        insert_vault_file(&db, &rec).unwrap();
        let list = list_vault_files(&db).unwrap();
        assert_eq!(list.len(), 1);
    }

    #[test]
    fn test_settings_upsert_and_get() {
        let db = open_test_db().unwrap();
        upsert_settings(&db, r#"{"theme":"dark"}"#).unwrap();
        let val = get_settings_row(&db).unwrap();
        assert!(val.is_some());
        upsert_settings(&db, r#"{"theme":"light"}"#).unwrap();
        let val2 = get_settings_row(&db).unwrap().unwrap();
        assert!(val2.contains("light"));
    }
}
