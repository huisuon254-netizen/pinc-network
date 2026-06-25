use crate::core::database::{connection::Database, queries};

pub struct SystemConfigEngine<'a> {
    db: &'a Database,
}

impl<'a> SystemConfigEngine<'a> {
    pub fn new(db: &'a Database) -> Self {
        Self { db }
    }

    pub fn get_config(&self, key: &str) -> Result<String, String> {
        match queries::get_system_config(self.db, key) {
            Ok(config) => Ok(config.config_value),
            Err(_) => Err(format!("Config '{}' not found", key)),
        }
    }

    pub fn set_config(
        &self,
        key: &str,
        value: &str,
        description: Option<&str>,
        category: &str,
    ) -> Result<(), String> {
        queries::update_system_config(
            self.db,
            key,
            value,
            description.map(|s| s.to_string()),
            category,
        )
        .map_err(|e| format!("Failed to set config: {}", e))
    }

    pub fn list_config(&self, category: Option<&str>) -> Result<Vec<queries::SystemConfig>, String> {
        queries::list_system_config(self.db, category)
            .map_err(|e| format!("Failed to list config: {}", e))
    }

    pub fn init_defaults(&self) -> Result<(), String> {
        let defaults: Vec<(&str, &str, &str, &str)> = vec![
            ("platform_name", "PINC Network", "Platform display name", "system"),
            ("max_upload_size_mb", "100", "Maximum file upload size in MB", "system"),
            ("registration_enabled", "true", "Allow new user registrations", "system"),
            ("maintenance_mode", "false", "Enable maintenance mode", "system"),
        ];

        for (key, value, description, category) in defaults {
            if queries::get_system_config(self.db, key).is_err() {
                queries::update_system_config(
                    self.db,
                    key,
                    value,
                    Some(description.to_string()),
                    category,
                )
                .map_err(|e| format!("Failed to init config '{}': {}", key, e))?;
            }
        }
        Ok(())
    }
}
