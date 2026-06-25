# PINC Web Games Integration

## Overview

Real browser-based games integrated via **GamePix RSS Feed API**. The platform fetches live game catalogs from GamePix's curated library, providing hundreds of high-quality HTML5 games across 7 categories.

## Architecture

```
GamePix RSS Feed API
        │
        ▼
┌──────────────────────────┐
│  Rust Backend (reqwest)  │
│  gamepix.rs              │
│  - Fetch JSON feed       │
│  - Parse GamePixItem     │
│  - Map to Game struct    │
│  - Fallback catalog      │
└──────────────────────────┘
        │
        ▼  Tauri IPC (cmd_get_games)
┌──────────────────────────┐
│  React Frontend          │
│  ForgePage.tsx           │
│  - Category tabs         │
│  - Search & filter       │
│  - Iframe game player    │
│  - Fullscreen mode       │
└──────────────────────────┘
```

## GamePix RSS Feed

### Feed URL
```
https://feeds.gamepix.com/v2/json?sid=4E437&pagination=24&page=1
```

### Parameters
| Param | Type | Description |
|-------|------|-------------|
| `sid` | string | Site ID (4E437) |
| `pagination` | int | Games per page (12-48) |
| `page` | int | Page number |
| `category` | string | Filter by category |

### Response Format
```json
{
  "version": "2.0",
  "title": "GamePix Games",
  "items": [
    {
      "id": "game-id",
      "title": "Game Title",
      "namespace": "game-namespace",
      "description": "Game description",
      "category": "racing",
      "orientation": "landscape",
      "quality_score": 0.85,
      "width": 960,
      "height": 600,
      "banner_image": "https://img.gamepix.com/...",
      "image": "https://img.gamepix.com/...",
      "url": "https://play.gamepix.com/game/embed?sid=4E437"
    }
  ]
}
```

## Categories

| Category | Games | Examples |
|----------|-------|---------|
| Racing | 10+ | Endless Car Chase, Drift Hunters, Madalin Stunt Cars |
| FPS / Shooter | 10+ | Shell Shockers, Bullet Force, Combat Online |
| Sports | 10+ | Basketball Stars, Soccer Skills, Tennis Champions |
| Strategy | 10+ | Chess, Tower Defense, Age of War |
| Puzzle | 10+ | Cut the Rope, 2048, Mahjong |
| Survival | 10+ | Temple Run 2, Zombie Survival, Minecraft Classic |
| Multiplayer | 10+ | Agar.io, Slither.io, Paper.io |

## Backend Implementation

### File: `src-tauri/src/core/games/gamepix.rs`
- `fetch_gamepix_games()` — Async HTTP fetch from GamePix RSS
- `item_to_game()` — Maps GamePixItem to PINC Game struct
- `fallback_games()` — 10 hardcoded games when API is unavailable
- 15-second request timeout with graceful fallback

### Tauri Command: `cmd_get_games`
```rust
pub async fn cmd_get_games(
    _state: State<'_, AppState>,
    category: Option<String>,  // "all", "racing", "action", etc.
    page: Option<u32>,         // Page number (default: 1)
    per_page: Option<u32>,     // Games per page (default: 24)
) -> Result<Vec<Game>, String>
```

## Frontend Implementation

### File: `src/components/forge/ForgePage.tsx`
- **Category Tabs**: All, Racing, FPS, Sports, Strategy, Puzzle, Survival, Multiplayer
- **Search Bar**: Real-time filtering by title, description, category
- **Game Cards**: Thumbnail, title, rating, play count, provider badge
- **Game Player**: Fullscreen iframe with ESC to exit
- **Pagination**: Navigate through pages of games
- **Error Handling**: Broken images fall back to SVG placeholder

## Database Tables

### game_sessions
Tracks active game sessions with wager amounts and player scores.

### web_games
Local cache of game catalog (optional, for offline use).

### tournaments
Tournament bracket system with entry fees and prize pools.

## Game Flow

1. User opens Forge > Games tab
2. Frontend calls `cmd_get_games` with category/page
3. Backend fetches from GamePix RSS API
4. Games displayed as cards with thumbnails
5. User clicks Play → fullscreen iframe loads game
6. ESC key exits back to game browser

## Wager Integration

- Gaming category tracked in internal ledger (7 categories)
- WagerPage supports gaming category for bets
- Tournament system with entry fees and brackets
- Arena duels with referee voting

## Files

```
src-tauri/src/core/games/
├── mod.rs          — Module declaration
├── types.rs        — WebGame, GameSession structs
└── gamepix.rs      — GamePix RSS feed fetcher

src/components/forge/
└── ForgePage.tsx   — Game browser UI with category tabs
```

## Testing

```bash
# Rust build check
cd src-tauri && cargo check

# TypeScript check
npx tsc --noEmit

# Full build
npx vite build && cd src-tauri && cargo build --release

# Tauri desktop build
npx tauri build
```

## Next Steps

1. Add postMessage listener for score capture from games
2. Implement multiplayer lobby with WebRTC
3. Tournament bracket integration with live updates
4. Offline game caching for repeated plays
