use crate::core::database::{connection::Database, queries};
use uuid::Uuid;

pub struct AdminEngine<'a> {
    db: &'a Database,
}

impl<'a> AdminEngine<'a> {
    pub fn new(db: &'a Database) -> Self {
        Self { db }
    }

    pub fn create_admin(
        &self,
        username: &str,
        email: &str,
        password: &str,
        role: &str,
    ) -> Result<queries::AdminUser, String> {
        let password_hash = crate::core::crypto::hash::hash_password(password)
            .map_err(|e| format!("Failed to hash password: {}", e))?;

        let now = chrono::Utc::now().timestamp();
        let user = queries::AdminUser {
            id: Uuid::new_v4().to_string(),
            username: username.to_string(),
            email: email.to_string(),
            password_hash,
            role: role.to_string(),
            permissions: "{}".to_string(),
            created_at: now,
            last_login: None,
            is_active: 1,
        };

        queries::insert_admin_user(self.db, &user)
            .map_err(|e| format!("Failed to insert admin user: {}", e))?;

        self.log_action(
            "system",
            "admin_created",
            "admin_user",
            &user.id,
            &format!("Admin '{}' created with role '{}'", username, role),
        );

        Ok(user)
    }

    pub fn authenticate_admin(
        &self,
        username: &str,
        password: &str,
    ) -> Result<queries::AdminUser, String> {
        let user = queries::get_admin_user_by_username(self.db, username)
            .map_err(|e| format!("User not found: {}", e))?;

        if user.is_active == 0 {
            return Err("Account is deactivated".to_string());
        }

        let valid = crate::core::crypto::hash::verify_password(password, &user.password_hash);

        if !valid {
            return Err("Invalid credentials".to_string());
        }

        let now = chrono::Utc::now().timestamp();
        let mut updated_user = user.clone();
        updated_user.last_login = Some(now);
        queries::update_admin_user(self.db, &updated_user)
            .map_err(|e| format!("Failed to update last login: {}", e))?;

        self.log_action(
            &user.id,
            "admin_login",
            "admin_user",
            &user.id,
            &format!("Admin '{}' logged in", username),
        );

        Ok(updated_user)
    }

    pub fn list_admins(&self) -> Result<Vec<queries::AdminUser>, String> {
        queries::list_admin_users(self.db).map_err(|e| format!("Failed to list admins: {}", e))
    }

    pub fn update_admin_role(&self, admin_id: &str, role: &str) -> Result<(), String> {
        let mut user = queries::get_admin_user(self.db, admin_id)
            .map_err(|e| format!("User not found: {}", e))?;

        user.role = role.to_string();
        queries::update_admin_user(self.db, &user)
            .map_err(|e| format!("Failed to update role: {}", e))?;

        self.log_action(
            "system",
            "role_updated",
            "admin_user",
            admin_id,
            &format!("Role changed to '{}' for user '{}'", role, user.username),
        );

        Ok(())
    }

    pub fn deactivate_admin(&self, admin_id: &str) -> Result<(), String> {
        let mut user = queries::get_admin_user(self.db, admin_id)
            .map_err(|e| format!("User not found: {}", e))?;

        user.is_active = 0;
        queries::update_admin_user(self.db, &user)
            .map_err(|e| format!("Failed to deactivate: {}", e))?;

        self.log_action(
            "system",
            "admin_deactivated",
            "admin_user",
            admin_id,
            &format!("Admin '{}' deactivated", user.username),
        );

        Ok(())
    }

    pub fn log_action(
        &self,
        admin_id: &str,
        action: &str,
        target_type: &str,
        target_id: &str,
        details: &str,
    ) {
        let log = queries::AdminLog {
            id: 0,
            admin_id: admin_id.to_string(),
            action: action.to_string(),
            target_type: target_type.to_string(),
            target_id: Some(target_id.to_string()),
            details: Some(details.to_string()),
            ip_address: None,
            user_agent: None,
            created_at: chrono::Utc::now().timestamp(),
        };
        let _ = queries::insert_admin_log(self.db, &log);
    }

    pub fn admin_count(&self) -> Result<i64, String> {
        let admins = queries::list_admin_users(self.db)
            .map_err(|e| format!("Failed to count admins: {}", e))?;
        Ok(admins.len() as i64)
    }
}
