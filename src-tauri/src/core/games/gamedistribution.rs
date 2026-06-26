use crate::commands::Game;
use serde::Deserialize;
use std::time::Duration;

const GD_RSS_BASE: &str = "https://html5.gamedistribution.com/rss";
const GD_EMBED_BASE: &str = "https://html5.gamedistribution.com";
const REQUEST_TIMEOUT_SECS: u64 = 15;

#[derive(Debug, Deserialize)]
pub struct GdRssFeed {
    #[serde(default)]
    pub items: Vec<GdRssItem>,
}

#[derive(Debug, Deserialize)]
pub struct GdRssItem {
    #[serde(default)]
    pub id: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub category: String,
    #[serde(default)]
    pub thumbnail: String,
    #[serde(default)]
    pub image: String,
    #[serde(default)]
    pub url: String,
}

pub async fn fetch_gd_games(
    publisher_id: &str,
    category: &str,
    page: u32,
    per_page: u32,
) -> Result<Vec<Game>, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(REQUEST_TIMEOUT_SECS))
        .user_agent("PINC/3.0")
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let url = format!("{}/{}/games.json", GD_RSS_BASE, publisher_id);

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("GameDistribution request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "GameDistribution returned status: {}",
            response.status()
        ));
    }

    let feed: GdRssFeed = response
        .json()
        .await
        .map_err(|e| format!("GameDistribution JSON parse error: {}", e))?;

    let games: Vec<Game> = feed
        .items
        .into_iter()
        .map(gd_item_to_game)
        .collect();

    let filtered = if category == "all" || category.is_empty() {
        games
    } else {
        games
            .into_iter()
            .filter(|g| g.category.to_lowercase() == category)
            .collect()
    };

    let start = ((page - 1) * per_page) as usize;
    let end = (start + per_page as usize).min(filtered.len());

    if start >= filtered.len() {
        return Ok(vec![]);
    }

    Ok(filtered[start..end].to_vec())
}

fn gd_item_to_game(item: GdRssItem) -> Game {
    let category = match item.category.to_lowercase().as_str() {
        "racing" | "driving" | "car" => "Racing".to_string(),
        "action" | "shooter" | "fps" | "war" => "FPS".to_string(),
        "sports" | "football" | "soccer" | "basketball" | "tennis" | "golf" => "Sports".to_string(),
        "strategy" | "board" | "chess" | "tower defense" => "Strategy".to_string(),
        "puzzle" | "match3" | "logic" | "brain" | "mahjong" => "Puzzle".to_string(),
        "survival" | "horror" | "zombie" | "adventure" | "rpg" => "Survival".to_string(),
        "multiplayer" | ".io" | "social" | "casual" => "Multiplayer".into(),
        _ => item.category.clone(),
    };

    let embed_url = if item.url.is_empty() {
        format!("{}/{}/", GD_EMBED_BASE, item.id)
    } else {
        item.url.clone()
    };

    let thumbnail = if !item.image.is_empty() {
        item.image
    } else if !item.thumbnail.is_empty() {
        item.thumbnail
    } else {
        format!("https://img.gamedistribution.com/{}.jpg", item.id)
    };

    Game {
        id: item.id,
        title: item.title,
        description: item.description,
        thumbnail,
        url: embed_url,
        category,
        provider: "GameDistribution".to_string(),
        rating: 4.5,
        plays: 0,
    }
}

pub fn curated_gd_games() -> Vec<Game> {
    vec![
        Game {
            id: "6552bf3254b441c1baf6b4727006bd28".into(),
            title: "Stunt Multiplayer Arena".into(),
            description: "Go solo in free roam or engage in fierce multiplayer derby. Perform stunts, crash opponents, and rule the arena.".into(),
            thumbnail: "https://img.gamedistribution.com/6552bf3254b441c1baf6b4727006bd28.jpg".into(),
            url: format!("{}/6552bf3254b441c1baf6b4727006bd28/", GD_EMBED_BASE),
            category: "Racing".into(),
            provider: "GameDistribution".into(),
            rating: 4.7,
            plays: 2500000,
        },
        Game {
            id: "9a58b299e9e144a8b79219e2e28a6f6a".into(),
            title: "Madalin Stunt Cars 2".into(),
            description: "Perform amazing stunts and drift in an open world with supercars.".into(),
            thumbnail: "https://img.gamedistribution.com/9a58b299e9e144a8b79219e2e28a6f6a.jpg".into(),
            url: format!("{}/9a58b299e9e144a8b79219e2e28a6f6a/", GD_EMBED_BASE),
            category: "Racing".into(),
            provider: "GameDistribution".into(),
            rating: 4.7,
            plays: 2500000,
        },
        Game {
            id: "drift-hunters-gd".into(),
            title: "Drift Hunters".into(),
            description: "Awesome 3D car drifting game with realistic physics.".into(),
            thumbnail: "https://img.gamedistribution.com/drift-hunters-gd.jpg".into(),
            url: format!("{}/drift-hunters-gd/", GD_EMBED_BASE),
            category: "Racing".into(),
            provider: "GameDistribution".into(),
            rating: 4.8,
            plays: 1500000,
        },
        Game {
            id: "shell-shockers-gd".into(),
            title: "Shell Shockers".into(),
            description: "World's most popular egg-based multiplayer shooter.".into(),
            thumbnail: "https://img.gamedistribution.com/shell-shockers-gd.jpg".into(),
            url: format!("{}/shell-shockers-gd/", GD_EMBED_BASE),
            category: "FPS".into(),
            provider: "GameDistribution".into(),
            rating: 4.9,
            plays: 5000000,
        },
        Game {
            id: "slope-gd".into(),
            title: "Slope".into(),
            description: "Roll a ball down a steep slope at breakneck speed.".into(),
            thumbnail: "https://img.gamedistribution.com/slope-gd.jpg".into(),
            url: format!("{}/slope-gd/", GD_EMBED_BASE),
            category: "Action".into(),
            provider: "GameDistribution".into(),
            rating: 4.5,
            plays: 3000000,
        },
        Game {
            id: "chess-gd".into(),
            title: "Chess Classic".into(),
            description: "Classic chess against AI or friends. Multiple difficulty levels.".into(),
            thumbnail: "https://img.gamedistribution.com/chess-gd.jpg".into(),
            url: format!("{}/chess-gd/", GD_EMBED_BASE),
            category: "Strategy".into(),
            provider: "GameDistribution".into(),
            rating: 4.5,
            plays: 2000000,
        },
        Game {
            id: "basketball-stars-gd".into(),
            title: "Basketball Stars".into(),
            description: "1v1 basketball with incredible moves and dunks.".into(),
            thumbnail: "https://img.gamedistribution.com/basketball-stars-gd.jpg".into(),
            url: format!("{}/basketball-stars-gd/", GD_EMBED_BASE),
            category: "Sports".into(),
            provider: "GameDistribution".into(),
            rating: 4.6,
            plays: 1200000,
        },
        Game {
            id: "cut-the-rope-gd".into(),
            title: "Cut the Rope".into(),
            description: "Physics puzzle. Cut ropes to feed candy to Om Nom.".into(),
            thumbnail: "https://img.gamedistribution.com/cut-the-rope-gd.jpg".into(),
            url: format!("{}/cut-the-rope-gd/", GD_EMBED_BASE),
            category: "Puzzle".into(),
            provider: "GameDistribution".into(),
            rating: 4.7,
            plays: 3000000,
        },
        Game {
            id: "agar-gd".into(),
            title: "Agar.io".into(),
            description: "Classic multiplayer. Eat cells and grow bigger than everyone.".into(),
            thumbnail: "https://img.gamedistribution.com/agar-gd.jpg".into(),
            url: format!("{}/agar-gd/", GD_EMBED_BASE),
            category: "Multiplayer".into(),
            provider: "GameDistribution".into(),
            rating: 4.6,
            plays: 8000000,
        },
        Game {
            id: "temple-run-2-gd".into(),
            title: "Temple Run 2".into(),
            description: "Navigate ancient temples while running from demon monkeys.".into(),
            thumbnail: "https://img.gamedistribution.com/temple-run-2-gd.jpg".into(),
            url: format!("{}/temple-run-2-gd/", GD_EMBED_BASE),
            category: "Survival".into(),
            provider: "GameDistribution".into(),
            rating: 4.5,
            plays: 7000000,
        },
        Game {
            id: "subway-surfers-gd".into(),
            title: "Subway Surfers".into(),
            description: "Dash through subway tracks, dodge trains and collect coins.".into(),
            thumbnail: "https://img.gamedistribution.com/subway-surfers-gd.jpg".into(),
            url: format!("{}/subway-surfers-gd/", GD_EMBED_BASE),
            category: "Racing".into(),
            provider: "GameDistribution".into(),
            rating: 4.8,
            plays: 10000000,
        },
        Game {
            id: "fruit-ninja-gd".into(),
            title: "Fruit Ninja".into(),
            description: "Slice flying fruits with your blade. Don't hit bombs!".into(),
            thumbnail: "https://img.gamedistribution.com/fruit-ninja-gd.jpg".into(),
            url: format!("{}/fruit-ninja-gd/", GD_EMBED_BASE),
            category: "Action".into(),
            provider: "GameDistribution".into(),
            rating: 4.5,
            plays: 4000000,
        },
        Game {
            id: "stickman-hook-gd".into(),
            title: "Stickman Hook".into(),
            description: "Swing through levels as a stickman. Physics-based platformer.".into(),
            thumbnail: "https://img.gamedistribution.com/stickman-hook-gd.jpg".into(),
            url: format!("{}/stickman-hook-gd/", GD_EMBED_BASE),
            category: "Action".into(),
            provider: "GameDistribution".into(),
            rating: 4.5,
            plays: 4000000,
        },
        Game {
            id: "crossy-road-gd".into(),
            title: "Crossy Road".into(),
            description: "Help the blocky character cross busy roads and rivers.".into(),
            thumbnail: "https://img.gamedistribution.com/crossy-road-gd.jpg".into(),
            url: format!("{}/crossy-road-gd/", GD_EMBED_BASE),
            category: "Action".into(),
            provider: "GameDistribution".into(),
            rating: 4.4,
            plays: 7000000,
        },
        Game {
            id: "plants-vs-zombies-gd".into(),
            title: "Plants vs Zombies".into(),
            description: "Defend your garden from waves of zombies using plants.".into(),
            thumbnail: "https://img.gamedistribution.com/plants-vs-zombies-gd.jpg".into(),
            url: format!("{}/plants-vs-zombies-gd/", GD_EMBED_BASE),
            category: "Strategy".into(),
            provider: "GameDistribution".into(),
            rating: 4.7,
            plays: 6000000,
        },
        Game {
            id: "among-us-gd".into(),
            title: "Among Us Online".into(),
            description: "Find the impostor among the crew. Classic social deduction.".into(),
            thumbnail: "https://img.gamedistribution.com/among-us-gd.jpg".into(),
            url: format!("{}/among-us-gd/", GD_EMBED_BASE),
            category: "Multiplayer".into(),
            provider: "GameDistribution".into(),
            rating: 4.6,
            plays: 8000000,
        },
        Game {
            id: "minecraft-classic-gd".into(),
            title: "Minecraft Classic".into(),
            description: "Creative sandbox building game. Place blocks and build anything.".into(),
            thumbnail: "https://img.gamedistribution.com/minecraft-classic-gd.jpg".into(),
            url: format!("{}/minecraft-classic-gd/", GD_EMBED_BASE),
            category: "Strategy".into(),
            provider: "GameDistribution".into(),
            rating: 4.9,
            plays: 12000000,
        },
        Game {
            id: "8-ball-pool-gd".into(),
            title: "8 Ball Pool".into(),
            description: "Classic billiards game. Pot all your balls and sink the 8-ball.".into(),
            thumbnail: "https://img.gamedistribution.com/8-ball-pool-gd.jpg".into(),
            url: format!("{}/8-ball-pool-gd/", GD_EMBED_BASE),
            category: "Sports".into(),
            provider: "GameDistribution".into(),
            rating: 4.6,
            plays: 6000000,
        },
        Game {
            id: "traffic-rider-gd".into(),
            title: "Traffic Rider".into(),
            description: "Race through traffic at high speeds. Don't crash!".into(),
            thumbnail: "https://img.gamedistribution.com/traffic-rider-gd.jpg".into(),
            url: format!("{}/traffic-rider-gd/", GD_EMBED_BASE),
            category: "Racing".into(),
            provider: "GameDistribution".into(),
            rating: 4.4,
            plays: 3000000,
        },
        Game {
            id: "doodle-jump-gd".into(),
            title: "Doodle Jump".into(),
            description: "Guide the Doodler higher and higher by jumping on platforms.".into(),
            thumbnail: "https://img.gamedistribution.com/doodle-jump-gd.jpg".into(),
            url: format!("{}/doodle-jump-gd/", GD_EMBED_BASE),
            category: "Action".into(),
            provider: "GameDistribution".into(),
            rating: 4.3,
            plays: 5000000,
        },
    ]
}

pub fn search_gd_games(query: &str, category: &str) -> Vec<Game> {
    let games = curated_gd_games();
    let q = query.to_lowercase();
    let cat = category.to_lowercase();

    games
        .into_iter()
        .filter(|g| {
            let matches_query = q.is_empty()
                || g.title.to_lowercase().contains(&q)
                || g.description.to_lowercase().contains(&q);
            let matches_cat = cat == "all" || cat.is_empty() || g.category.to_lowercase() == cat;
            matches_query && matches_cat
        })
        .collect()
}
