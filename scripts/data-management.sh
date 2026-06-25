#!/usr/bin/env bash
set -euo pipefail

# PINC Data Management Script
# Usage: ./scripts/data-management.sh <command> [options]

DATA_DIR="${PINC_DATA_DIR:-$HOME/.local/share/com.pinc.app}"
DB_PATH="$DATA_DIR/pinc.db"
BACKUP_DIR="$DATA_DIR/backups"

usage() {
    cat <<EOF
PINC Data Management

Usage: $0 <command> [options]

Commands:
  backup              Backup the database
  cleanup             Remove expired cache entries and old logs
  models-list         List downloaded AI models and sizes
  models-size         Show total model storage usage
  export-settings     Export settings to a JSON file
  import-settings     Import settings from a JSON file
  verify              Verify data directory integrity
  stats               Show data directory statistics
  help                Show this help message

Environment:
  PINC_DATA_DIR       Override data directory (default: ~/.local/share/com.pinc.app)
EOF
}

cmd_backup() {
    mkdir -p "$BACKUP_DIR"
    local ts
    ts=$(date +%Y%m%d_%H%M%S)
    local dest="$BACKUP_DIR/pinc_${ts}.db"
    if [[ -f "$DB_PATH" ]]; then
        cp "$DB_PATH" "$dest"
        echo "Backup created: $dest"
    else
        echo "No database found at $DB_PATH" >&2
        exit 1
    fi
}

cmd_cleanup() {
    local cache_dir="$DATA_DIR/cache"
    local logs_dir="$DATA_DIR/logs"
    local removed=0

    if [[ -d "$cache_dir" ]]; then
        while IFS= read -r -d '' ttl_file; do
            local data_file="${ttl_file%.ttl}"
            if [[ -f "$data_file" ]]; then
                local ttl
                ttl=$(cat "$ttl_file")
                local age
                age=$(( ($(date +%s) - $(stat -c %Y "$data_file")) ))
                if (( age > ttl )); then
                    rm -f "$data_file" "$ttl_file"
                    removed=$((removed + 1))
                fi
            fi
        done < <(find "$cache_dir" -name "*.ttl" -print0 2>/dev/null)
    fi

    if [[ -d "$logs_dir" ]]; then
        find "$logs_dir" -type f -mtime +30 -delete 2>/dev/null || true
    fi

    echo "Cleanup complete: removed $removed expired cache entries"
}

cmd_models_list() {
    local models_dir="$DATA_DIR/models"
    if [[ ! -d "$models_dir" ]] || [[ -z "$(ls -A "$models_dir" 2>/dev/null)" ]]; then
        echo "No models downloaded."
        return
    fi
    printf "%-30s %12s %s\n" "MODEL" "SIZE" "PATH"
    printf "%-30s %12s %s\n" "-----" "----" "----"
    for f in "$models_dir"/*; do
        [[ -f "$f" ]] || continue
        local size
        size=$(du -h "$f" | cut -f1)
        printf "%-30s %12s %s\n" "$(basename "$f")" "$size" "$f"
    done
}

cmd_models_size() {
    local models_dir="$DATA_DIR/models"
    if [[ ! -d "$models_dir" ]]; then
        echo "0 bytes"
        return
    fi
    du -sh "$models_dir" 2>/dev/null | cut -f1
}

cmd_export_settings() {
    local dest="${1:-pinc_settings_export.json}"
    local config_dir="$DATA_DIR/config"
    if [[ -d "$config_dir" ]]; then
        cp -r "$config_dir" "$dest"
        echo "Settings exported to: $dest"
    else
        echo "No settings directory found at $config_dir" >&2
        exit 1
    fi
}

cmd_import_settings() {
    local src="${1:-}"
    if [[ -z "$src" ]]; then
        echo "Usage: $0 import-settings <path>" >&2
        exit 1
    fi
    if [[ ! -d "$src" ]]; then
        echo "Settings directory not found: $src" >&2
        exit 1
    fi
    local config_dir="$DATA_DIR/config"
    mkdir -p "$config_dir"
    cp -r "$src"/* "$config_dir"/
    echo "Settings imported from: $src"
}

cmd_verify() {
    local ok=true
    for dir in "$DATA_DIR/vault" "$DATA_DIR/models" "$DATA_DIR/cache" "$DATA_DIR/logs" "$DATA_DIR/config"; do
        if [[ ! -d "$dir" ]]; then
            echo "MISSING: $dir"
            ok=false
        fi
    done
    if [[ ! -f "$DB_PATH" ]]; then
        echo "NOTE: Database not yet created at $DB_PATH"
    fi
    if $ok; then
        echo "All directories present."
    else
        echo "Some directories are missing. Run the app to create them."
    fi
}

cmd_stats() {
    echo "PINC Data Directory: $DATA_DIR"
    echo ""
    if [[ -d "$DATA_DIR" ]]; then
        du -sh "$DATA_DIR"/*/ 2>/dev/null || true
        echo ""
        echo "Total:"
        du -sh "$DATA_DIR" 2>/dev/null || echo "0"
    else
        echo "Data directory does not exist yet."
    fi
}

case "${1:-help}" in
    backup)         cmd_backup ;;
    cleanup)        cmd_cleanup ;;
    models-list)    cmd_models_list ;;
    models-size)    cmd_models_size ;;
    export-settings) cmd_export_settings "${2:-}" ;;
    import-settings) cmd_import_settings "${2:-}" ;;
    verify)         cmd_verify ;;
    stats)          cmd_stats ;;
    help|*)         usage ;;
esac
