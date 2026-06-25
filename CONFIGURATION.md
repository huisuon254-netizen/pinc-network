# PINC Configuration Guide

## API Keys

All API keys are loaded from environment variables at runtime. Configure them in your `.env` file or shell environment.

| Variable | Service | Purpose | Required |
|---|---|---|---|
| `GAMEPIX_SID` | GamePix | Publisher ID for game feed | No (default: `4E437`) |
| `GAMEDISTRIBUTION_PUBLISHER_ID` | GameDistribution | Publisher ID for game RSS feed | No |
| `EXCHANGERATE_API_KEY` | ExchangeRate | Currency conversion | No |
| `FINNHUB_API_KEY` | Finnhub | Stock/crypto data | No |
| `ALCHEMY_API_KEY` | Alchemy | Ethereum RPC | No |
| `GROQ_API_KEY` | Groq | LLM inference | No |
| `OPENAI_API_KEY` | OpenAI | Enhanced AI features | No |

### Public APIs (no key needed)

These are used with their base URLs directly:

- **CoinGecko**: `https://api.coingecko.com/api/v3` — Crypto prices
- **Nominatim**: `https://nominatim.openstreetmap.org` — Geocoding
- **Open-Meteo**: `https://api.open-meteo.com/v1` — Weather
- **WorldTimeAPI**: `https://worldtimeapi.org/api` — Time zones
- **REST Countries**: `https://restcountries.com/v3.1` — Country data

## Data Directory Structure

Default location: `~/.local/share/com.pinc.app/`

```
com.pinc.app/
├── pinc.db          # Main SQLite database (WAL mode)
├── pinc.db-wal      # Write-ahead log
├── pinc.db-shm      # Shared memory for WAL
├── vault/           # Encrypted user files
├── models/          # Downloaded AI models (whisper, llama, onnx, tts)
├── cache/           # Application cache with TTL entries
│   ├── *.cache      # Cached data files
│   └── *.ttl        # TTL expiry timestamps (seconds)
├── logs/            # Application log files
├── config/          # Local configuration overrides
└── backups/         # Database backups
```

## Directory Purposes

### `vault/`
Encrypted user files. Files here are encrypted at rest using the PINC encryption engine. Do not modify these directly.

### `models/`
AI model files downloaded by the model manager. Supported types:
- Whisper models (speech-to-text)
- Llama models (LLM inference)
- ONNX models (image segmentation)
- TTS models (text-to-speech)

### `cache/`
Temporary data cache with per-entry TTL. Each cached item has a `.cache` file and a `.ttl` file containing the expiry in seconds. Use `scripts/data-management.sh cleanup` to remove expired entries.

### `logs/`
Application log files. Auto-rotated after 30 days by the data lifecycle manager.

### `config/`
Local configuration overrides. Settings here take precedence over defaults.

### `backups/`
Database backups created by `scripts/data-management.sh backup`.

## Backup Procedures

### Manual Backup
```bash
./scripts/data-management.sh backup
```
Creates a timestamped copy in `~/.local/share/com.pinc.app/backups/`.

### Automated Backup
Add to crontab:
```
0 2 * * * /path/to/pinc-network/scripts/data-management.sh backup
```

### Restore from Backup
```bash
cp ~/.local/share/com.pinc.app/backups/pinc_YYYYMMDD_HHMMSS.db ~/.local/share/com.pinc.app/pinc.db
```

## Model Management

### List Models
```bash
./scripts/data-management.sh models-list
```

### Show Total Model Size
```bash
./scripts/data-management.sh models-size
```

### Delete a Model
Use the `ModelManager::delete_model()` API or delete manually:
```bash
rm ~/.local/share/com.pinc.app/models/<model-file>
```

## Cache Cleanup

### Cleanup Expired Entries
```bash
./scripts/data-management.sh cleanup
```

### Clear Entire Cache
Use the `CacheManager::clear()` API or:
```bash
rm -rf ~/.local/share/com.pinc.app/cache/*
```

## Settings Import/Export

```bash
# Export
./scripts/data-management.sh export-settings /path/to/backup.json

# Import
./scripts/data-management.sh import-settings /path/to/backup.json
```

## Data Integrity Verification

```bash
./scripts/data-management.sh verify
```

## Statistics

```bash
./scripts/data-management.sh stats
```

## Gitignore

The following patterns are excluded from version control:
- `*.keystore` — Keystore files
- `*.db`, `*.db-wal`, `*.db-shm` — Database files
- `vault/` — Encrypted files
- `models/` — AI model files
- `cache/` — Cache data
- `logs/` — Log files
- `target/` — Rust build artifacts
