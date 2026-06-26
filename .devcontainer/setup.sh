#!/bin/bash
set -e

echo "=== Setting up PINC Network Dev Container ==="

sudo apt-get update -qq

# Tauri system dependencies
sudo apt-get install -y -qq \
  libwebkit2gtk-4.1-dev libgtk-3-dev libsoup-3.0-dev \
  libjavascriptcoregtk-4.1-dev libappindicator3-dev \
  librsvg2-dev patchelf libssl-dev pkg-config curl zip unzip

# Windows cross-compilation (mingw-w64)
sudo apt-get install -y -qq gcc-mingw-w64-x86-64 g++-mingw-w64-x86-64

# Rust targets
rustup target add aarch64-linux-android x86_64-pc-windows-msvc

# Install Tauri CLI
cargo install tauri-cli --version "^2"

# Install frontend deps
npm install

# Android SDK
export ANDROID_HOME=$HOME/android-sdk
mkdir -p $ANDROID_HOME
curl -fsSL https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -o /tmp/cmdtools.zip
unzip -q -o /tmp/cmdtools.zip -d $ANDROID_HOME/cmdline-tools/
mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest 2>/dev/null || true
rm /tmp/cmdtools.zip

export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Accept licenses and install
yes | sdkmanager --licenses > /dev/null 2>&1 || true
sdkmanager "build-tools;34.0.0" "platforms;android-34" "ndk;27.0.12077973"

# Env vars for bashrc
cat >> ~/.bashrc << 'ENVEOF'

# Android SDK
export ANDROID_HOME=$HOME/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/34.0.0

# Rust/Cargo
export PATH="$HOME/.cargo/bin:$PATH"
ENVEOF

echo "=== Setup Complete ==="
echo "Android SDK: $ANDROID_HOME"
echo "NDK: 27.0.12077973"
