#!/bin/bash
set -e

echo "=== Setting up PINC Network Dev Container ==="

# Update package lists
sudo apt-get update

# Install system dependencies for Tauri
sudo apt-get install -y \
  libwebkit2gtk-4.0-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf \
  libssl-dev \
  libglib2.0-dev

# Install Rust components
rustup component add clippy rustfmt
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android

# Install Tauri CLI
cargo install tauri-cli --version "^2"

# Install Trunk for WASM
cargo install trunk

# Configure Android environment
export ANDROID_HOME=$HOME/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Accept Android SDK licenses
yes | sdkmanager --licenses || true

# Install Android build tools and NDK
sdkmanager "build-tools;34.0.0" "platforms;android-34" "ndk;26.1.10909125"

# Set up environment variables
cat >> ~/.bashrc << 'EOF'

# Android SDK
export ANDROID_HOME=$HOME/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Tauri
export PATH="$HOME/.cargo/bin:$PATH"
EOF

# Install npm dependencies
npm install

echo "=== Setup Complete ==="
echo "Android SDK installed at: $ANDROID_HOME"
echo "NDK version: 26.1.10909125"
