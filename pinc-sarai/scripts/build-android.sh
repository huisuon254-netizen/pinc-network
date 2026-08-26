#!/bin/bash
set -e
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_SDK="$HOME/Android/Sdk"
export ANDROID_HOME="$ANDROID_SDK"
NDK_VERSION="27.0.12077973"
export NDK_HOME="$ANDROID_SDK/ndk/$NDK_VERSION"
export ANDROID_NDK_HOME="$NDK_HOME"
[ -d "$NDK_HOME" ] || { echo "Missing NDK $NDK_HOME"; exit 1; }
KEYSTORE="$PROJECT_DIR/../debug.keystore"
KEY_ALIAS="pinc-debug"
KEY_PASS="pinc123"
OUTPUT_APK="$HOME/Desktop/SARAI.apk"

echo "=== SARAI Android Build ==="
echo "Project: $PROJECT_DIR"
[ -d "$ANDROID_SDK" ] || { echo "Missing SDK $ANDROID_SDK"; exit 1; }
rustup target list --installed | grep -q aarch64-linux-android || rustup target add aarch64-linux-android
[ -f "$KEYSTORE" ] || keytool -genkey -v -keystore "$KEYSTORE" -alias "$KEY_ALIAS" -keyalg RSA -keysize 2048 -validity 10000 -storepass "$KEY_PASS" -keypass "$KEY_PASS" -dname "CN=SARAI, OU=Dev, O=PINC, L=City, S=State, C=US"

cd "$PROJECT_DIR"
npm install
npm run build
cd src-tauri
npx tauri android init 2>&1 | head -n 20 || true
npx tauri android build --target aarch64 2>&1 | tee android-build.log

APK=$(find gen/android -name "*.apk" | grep -v unsigned | head -n 1)
if [ -z "$APK" ]; then APK=$(find gen/android -name "*.apk" | head -n 1); fi
if [ -n "$APK" ]; then
  cp "$APK" "$OUTPUT_APK"
  echo "APK -> $OUTPUT_APK"
else
  echo "No APK found"
  exit 1
fi
