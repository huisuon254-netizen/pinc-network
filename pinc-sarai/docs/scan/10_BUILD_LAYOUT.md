# Agent 10 — BUILD & LAYOUT Exhaustive Report
**Files:** `src-tauri/tauri.conf.json:41`, `Cargo.toml:122`, `build.rs:1`, `capabilities/default.json:9`, `gen/android 95L gradle`, `.cargo/config.toml:26`, `icons 40+`, `vite.config.ts:47 port1420`, `package.json:41`, `globals.css:368`, `lib.rs:384`, `workflows 5`

## tauri.conf.json main 41L productName PINC version 3.0.0 identifier com.pinc.app build frontendDist ../dist windows 1400x900 min1100x700 center decorated CSP assetProtocol enable scope ** targets all icon 32 128 128@2x icns ico, admin com.pinc.admin 42L beforeBuildCommand npm run build same window CSP identical bundle icons, SARAI must com.pinc.sarai productName SARAI title SARAI Payment Hub keep frontendDist security bundle.

## capabilities default 9L default windows main permissions core:default only, admin identical, should add fs dialog notification clipboard http deep-link per plugin register, SCHEMAS gen 6 auto Tauri 2.11.5.

## Cargo main 122L package pinc 3.0.0 edition 2021 lib pinc_lib staticlib cdylib rlib build tauri-build deps 31 tauri 2 protocol-asset tokio full serde rusqlite bundled chacha ed25519 x25519 hkdf rand sha2 sha3 blake3 argon2 uuid bip39 base64 hex ethers 2 thiserror anyhow log env_logger flate2 zstd hostname num_cpus sysinfo chrono time dirs libc quinn rustls rcgen reqwest tokio-tungstenite qrcode image plugins all 2, conditional not android whisper llama ort redis, android hostname, profiles dev incremental release panic abort codegen16 opt s lto false strip true android same, no root workspace.

## admin Cargo 34L pinc-admin lib pinc_admin_lib deps tauri plugins notification fs shell dialog clipboard http serde uuid chrono rusqlite dirs profiles same release, SARAI keep rusqlite serde tok etc drop whisper/llama.

## build.rs tauri_build::build() identical.

## .cargo/config.toml 26L linker clang mold linux, android aarch64 35 clang ar llvm-ar landrord llog, armv7 24, x86_64 24, i686 24 jobs 2 NDK 27.0.12077973 api 35/24.

## Android gen root build.gradle 12-22 classpath gradle 8.11.0 kotlin 2.1.20, gradle.properties Xmx2048 abi arm64-v8a armeabi-v7a arch arm64 arm target aarch64 armv7 nonTransitiveRClass, settings include app tauri.settings, tauri.settings auto includes tauri-android + 6 plugins deep-link etc, app/tauri.properties versionName 3.0.0 versionCode 3000000, app/tauri.build.gradle lifecycle 2.10.0.

## app/build.gradle 95L compileSdk 36 namespace com.pinc.app applicationId com.pinc.app minSdk24 target34 versionCode/name ndk abiFilters arm64 armv7 signing pincDebug/release](../../../debug.keystore pinc123) buildTypes debug usesCleartext true minify false jni keeps, release minify false proguard, compile Kotlin 11, rust rootDirRel ../../../ dependencies webkit appcompat activity material lifecycle, apply tauri.build.

## Manifest 91L permissions INTERNET WIFI NETWORK FOREGROUND etc POST_NOTIFICATIONS STORAGE MEDIA CAMERA BLUETOOTH etc Application icon mipmap ic_launcher MainActivity singleTask FileProvider PincForegroundService BootReceiver.

## Icons 40+ main/admin identical 32 32@2x 64 128 etc Win Store Square StoreLogo iOS 20 Android mipmap 5 + anydpi xml, copy whole.

## package.json main 41L name pinc 3.0.0 module scripts dev vite build tsc && vite build preview tauri deps tauri api 2 plugins 2.x framer 11 html5-qrcode 2.3.8 lucide 0.383 qrcode.react 4 react 18 react-router 7 zustand 4 dev tailwind vite 4 tauri cli 2 types react vite react tailwind typescript.

## admin package  name pinc-admin 3.0.0 module deps api 2.5 plugins 2 react 19.1 zustand 5 framer 12 lucide 0.511 dev cli 2.5 vite 7 types react 19, no tailwind custom CSS.

## vite.config main 47L react tailwind stripCrossorigin transformIndexHtml remove crossorigin frame-src object-src resolve alias @ port1420 strict host TAURI_DEV_HOST hmr 1421 ws watch ignore src-tauri base ./ target es2021 chrome100 safari13 minify esbuild sourcemap !!TAURI_DEBUG clear false, admin 13L react only base ./ port14200 strict watch ignore, SARAI pick 1422.

## tsconfig 23L target ES2021 lib DOM bundler paths @/* src include src ref node, admin strict false.

## index.html 21L bg #0a0a0f fatal-error handler #root /src/main.tsx, admin similar.

## tailwind @tailwindcss/vite 4 no config CSS import.

## esbuild.config fallback.

## globals.css 368L font JetBrains Mono Inter Space Grotesk woff2 vars bg primary #0a0a0f secondary #0f0f1a tertiary #16162a card #12121e elevated #1a1a2e border #1e1e3a bright #2a2a4a electric-blue #00d4ff neon-cyan #00ffcc soft-purple #a855f7 neon-green #39ff14 neon-red #ff2255 neon-yellow #ffe600 text #e2e8f0 etc scrollbar glow pinc-card border radius8 padding1rem hover border-bright pinc-btn inline gap .5rem padding .5 1.25 border electric transparent color 700 hover rgba shadow active scale disabled .4 input width100 bg secondary border radius focus ring badges 5 variants app-shell flex h100vh sidebar 190 width inner 190 h100vh bg secondary border-right column padding 1.25rem header logo sidebar-node label 0.58 dot 6 online green offline red nav-item width gap8 padding .6 1rem transparent border-left 2 transparent color #94a3b8 font 0.7 mono hover active border-left electric-blue main flex1 overflow auto hamburger hidden media 767 card padding .75 radius6 sidebar fixed left -200 transition left .25s open left0 overlay inset0 60 z90 hamburger 36 radius6 card border etc.

## Admin theme 60+216+453 lines themes dark-cyber #0a0e1a light-pro #ffffff matrix-green #000000 layout classic-side 240 top compact-top flex-column dash-grid 12 columns widget 360 min height.

## NAV Sidebar 70L FullDashTab 10 identity contacts treific starteran rentbit sarai Wallet 15 zeroflipper openmaestro settings notifications NAV active page props nodeId online header brand_logo 242KB v3.0 dot online nav active.

## DashboardPage 63L useAppStore refreshNodeStatus interval 15s not wallet renderContent switch sarai→SaraiPage overlay sidebarWrapper hamburger.

## SaraiPage tabs 8  Dashboard Wallet Receipt CreditCard Bitcoin Shield User Bell History TxFilter all deposit damage etc grids 220 140 260 1fr1fr no media responsive gap gap .375 32px circle.

## AppState lib.rs 384L setup SIGHUP ring env_logger validate secrets plugins notification fs shell dialog clipboard http deep-link data_dir pinc.db Database open run_migrations startup_check vault_dir kingsman hash peer_registry WebSocket webrtc handler node_id db_arc manage AppState 19 fields db nexus rift kingsman ghost localization peer bandwidth discovery relay message_router metrics net_share p2p vault audit starteran treific spawn ws invoke_handler 100+ commands includes p2p agents 10.

## Store 376L persist pinc-settings partialize settings identity activeTab default identity, fields screen splash login dashboard identity nodeStatus peers vault network error activeTab role default user plus wallet etc refreshWallet invoke balance synthesize pending sum total_earned balance.

## WORKFLOWS desktop 91 matrix ubuntu windows macos targets x86_64-unknown-linux-gnu pc-windows-msvc aarch64-apple-darwin Node20 rust stable tauri cli linux apt webkit cache npm ci vite build cargo tauri build target upload tags bundle, android 173 jobs build-android build-admin-android needs first ubuntu Node20 Java17 android v3 rust aarch64 sdkmanager ndk 27 build-tools 34 platforms 34 env CC/CXX/AR LINKER tauri-cli npm install build tauri android init continue-on-error build target aarch64 timeout 30 find apk sign keytool 2048 pinc123 zipalign apksigner upload 7 days, rust-check 55 apt webkit clippy fmt cache Node vite build cargo fmt check cargo check, typescript 30 Node npm ci tsc noEmit vite build, admin-windows 57 manual windows Node Java Rust pc-windows-msvc tauri build find exe upload.

## public/assets sounds 6 images 11 fonts 6, brand_logo 242KB, scripts build-android 104 vars PROJECT_DIR ANDROID_SDK JAVA_HOME KEYSTORE pinc-debug pinc123 OUTPUT $HOME/Desktop/PINC.apk checks SDK ndk rustup targets keystore npx tauri android build tee find apk sign cp warn.

## What must copy for SARAI standalone — tauri.conf Cargo build capabilities .cargo/icons gen vite tsconfig package index globals public scripts main App store sidebar dashboard Sarai i18n types core modules lib main etc omit zeroflipper openmaestro etc.

## Ports identifiers targets table: dev1420 admin14200 SARAI 1422, window 1400x900 base ./ target es2021 identifier com.pinc.app admin sarai proposed com.pinc.sarai namespace min24 target34 compile36 version 3.0.0 code 3000000 NDK27 Rust aarch64 abi arm64 armeabi profile s false true keystore debug pinc-debug sign apk path FileProvider.

## Gaps: capability minimal plugin deny, gradle minify false APK larger, no tailwind config reliance, heap 2048 may OOM, permissions excessive camera bluetooth, keystore path relative, Node20 Java17 Rust required.

