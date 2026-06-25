use serde::Deserialize;
use std::time::Duration;

const GAMEPIX_SID: &str = "4E437";
const GAMEPIX_FEED_URL: &str = "https://feeds.gamepix.com/v2/json";
const GAMEPIX_DEFAULT_PER_PAGE: u32 = 24;
const REQUEST_TIMEOUT_SECS: u64 = 15;

#[derive(Debug, Deserialize)]
pub struct GamePixFeed {
    #[serde(default)]
    pub items: Vec<GamePixItem>,
}

#[derive(Debug, Deserialize)]
pub struct GamePixItem {
    #[serde(default)]
    pub id: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub namespace: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub category: String,
    #[serde(default)]
    pub orientation: String,
    #[serde(default)]
    pub quality_score: f64,
    #[serde(default)]
    pub width: u32,
    #[serde(default)]
    pub height: u32,
    #[serde(default)]
    pub banner_image: String,
    #[serde(default)]
    pub image: String,
    #[serde(default)]
    pub url: String,
}

pub async fn fetch_gamepix_games(
    category: &str,
    page: u32,
    per_page: u32,
) -> Result<Vec<crate::commands::Game>, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(REQUEST_TIMEOUT_SECS))
        .user_agent("PINC/3.0")
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let pp = if per_page == 0 { GAMEPIX_DEFAULT_PER_PAGE } else { per_page };

    let url = format!(
        "{}?sid={}&pagination={}&page={}",
        GAMEPIX_FEED_URL, GAMEPIX_SID, pp, page
    );

    let url = if category != "all" && !category.is_empty() {
        format!("{}&category={}", url, category)
    } else {
        url
    };

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("GamePix request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("GamePix returned status: {}", response.status()));
    }

    let feed: GamePixFeed = response
        .json()
        .await
        .map_err(|e| format!("GamePix JSON parse error: {}", e))?;

    let games: Vec<crate::commands::Game> = feed
        .items
        .into_iter()
        .map(|item| item_to_game(item))
        .collect();

    if games.is_empty() {
        return Err("No games returned from GamePix".to_string());
    }

    Ok(games)
}

fn item_to_game(item: GamePixItem) -> crate::commands::Game {
    let category = match item.category.to_lowercase().as_str() {
        "racing" | "driving" | "car" => "Racing".to_string(),
        "action" | "shooter" | "fps" | "war" => "FPS".to_string(),
        "sports" | "football" | "soccer" | "basketball" | "tennis" | "golf" => "Sports".to_string(),
        "strategy" | "board" | "chess" | "tower defense" => "Strategy".to_string(),
        "puzzle" | "match3" | "logic" | "brain" | "mahjong" => "Puzzle".to_string(),
        "survival" | "horror" | "zombie" | "adventure" | "rpg" => "Survival".to_string(),
        "multiplayer" | ".io" | "social" | "casual" => "Multiplayer".to_string(),
        _ => item.category.clone(),
    };

    let rating = (item.quality_score * 5.0).clamp(1.0, 5.0);

    crate::commands::Game {
        id: item.id,
        title: item.title,
        description: item.description,
        thumbnail: if !item.image.is_empty() {
            item.image
        } else if !item.banner_image.is_empty() {
            item.banner_image
        } else {
            format!("https://img.gamepix.com/games/{}/icon/{}.png?w=300", item.namespace, item.namespace)
        },
        url: if item.url.is_empty() {
            format!("https://play.gamepix.com/{}/embed?sid={}", item.namespace, GAMEPIX_SID)
        } else {
            item.url
        },
        category,
        provider: "GamePix".to_string(),
        rating,
        plays: (item.quality_score * 1000000.0) as u64,
    }
}

pub fn fallback_games() -> Vec<crate::commands::Game> {
    crate::core::games::gamedistribution::curated_gd_games()
}
