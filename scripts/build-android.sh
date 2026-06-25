#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_SDK="${ANDROID_HOME:-$HOME/Android/Sdk}"
JAVA_HOME="${JAVA_HOME:-/usr}"
KEYSTORE="$PROJECT_DIR/debug.keystore"
KEY_ALIAS="pinc-debug"
KEY_PASS="pinc123"
OUTPUT_APK="$HOME/Desktop/PINC.apk"

echo "=== PINC Android Build Script ==="
echo "Project: $PROJECT_DIR"
echo "Android SDK: $ANDROID_SDK"
echo "Java: $JAVA_HOME"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if [ ! -d "$ANDROID_SDK" ]; then
    echo "ERROR: Android SDK not found at $ANDROID_SDK"
    echo "Install Android Studio or set ANDROID_HOME"
    exit 1
fi

if [ ! -d "$ANDROID_SDK/ndk" ]; then
    echo "ERROR: Android NDK not found. Install via: sdkmanager 'ndk;35.0.0'"
    exit 1
fi

if ! command -v rustup &> /dev/null; then
    echo "ERROR: rustup not found"
    exit 1
fi

# Check Android Rust targets
echo "Checking Rust Android targets..."
for target in aarch64-linux-android armv7-linux-androideabi; do
    if ! rustup target list --installed | grep -q "$target"; then
        echo "Installing target: $target"
        rustup target add "$target"
    fi
done

# Generate signing key if missing
if [ ! -f "$KEYSTORE" ]; then
    echo "Generating debug signing keystore..."
    keytool -genkey -v -keystore "$KEYSTORE" \
        -alias "$KEY_ALIAS" -keyalg RSA -keysize 2048 -validity 10000 \
        -storepass "$KEY_PASS" -keypass "$KEY_PASS" \
        -dname "CN=PINC Debug, O=PINC Network, L=Unknown, ST=Unknown, C=US"
fi

echo ""
echo "Starting Android build (this may take 15-30 minutes for Rust cross-compilation)..."
echo "Build log will be saved to $PROJECT_DIR/android-build.log"
echo ""

cd "$PROJECT_DIR"

# Set environment
export ANDROID_HOME="$ANDROID_SDK"
export JAVA_HOME="$JAVA_HOME"

# Run Tauri Android build
npx tauri android build 2>&1 | tee "$PROJECT_DIR/android-build.log"

# Sign the APK if build succeeded
APK_PATH=$(find "$PROJECT_DIR/src-tauri/gen/android/app/build/outputs/apk" -name "*.apk" ! -name "*-unsigned.apk" | head -1)

if [ -z "$APK_PATH" ]; then
    # Try to sign the unsigned APK
    UNSIGNED=$(find "$PROJECT_DIR/src-tauri/gen/android/app/build/outputs/apk" -name "*-unsigned.apk" | head -1)
    if [ -n "$UNSIGNED" ]; then
        echo "Signing unsigned APK..."
        "$ANDROID_SDK/build-tools/$(ls "$ANDROID_SDK/build-tools/" | sort -V | tail -1)/apksigner" sign \
            --ks "$KEYSTORE" --ks-key-alias "$KEY_ALIAS" \
            --ks-pass "pass:$KEY_PASS" --key-pass "pass:$KEY_PASS" \
            --out "$OUTPUT_APK" "$UNSIGNED"
        APK_PATH="$OUTPUT_APK"
    fi
fi

if [ -n "$APK_PATH" ]; then
    cp "$APK_PATH" "$OUTPUT_APK" 2>/dev/null || true
    echo ""
    echo "=== Build Complete ==="
    echo "APK: $OUTPUT_APK"
    ls -lh "$OUTPUT_APK"
    echo ""
    echo "To install: adb install $OUTPUT_APK"
else
    echo ""
    echo "=== Build Failed ==="
    echo "Check $PROJECT_DIR/android-build.log for details"
    echo ""
    echo "Common issues:"
    echo "  1. Missing NDK: sdkmanager 'ndk;35.0.0'"
    echo "  2. Missing Android targets: rustup target add aarch64-linux-android"
    echo "  3. Missing Java: install openjdk-21-jdk"
    echo "  4. Out of memory: increase Gradle heap in gradle.properties"
    exit 1
fi
