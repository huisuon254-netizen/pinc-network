use crate::core::infrastructure::nexus::NexusEngine;

pub use crate::core::infrastructure::nexus::SpeedTestResult;

pub async fn run_real_speed_test() -> Result<SpeedTestResult, String> {
    NexusEngine::run_speed_test_logic().await
}
