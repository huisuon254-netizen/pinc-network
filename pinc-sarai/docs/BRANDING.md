# SARAI Branding — APK Logo & Visual Icon

**Master Logo:** Provided image 2026-08-24
- Visual: Gold #D4AF37 infinity loop interlocked with shield, 3 arrows (silver #C0C0C0 outer, green #00C853 inner glow), dark brushed metal bg #0a0a0f → green radial glow #0f291e
- Typography: SARAI serif 3D gold emboss, tagline ALL TRANSACTIONS. SECURELY. silver 6pt tracking 0.18em
- Concept: Continuous flow (infinity) + protection (shield) + growth (up arrows + chart zigzag) = secure transactions

## Applied As

### 1. APK Icon (Launcher)
- **Android:** `src-tauri/icons/android/mipmap-*/ic_launcher.png` + `ic_launcher_foreground.png` (adaptive) — 48/72/96/144/192 px, generated from `src/assets/brand/sarai-logo.png` 1024 master via `/tmp/gen_icons.sh` (ImageMagick convert -resize). Also `src-tauri/gen/android/app/src/main/res/mipmap-*/` on `tauri android init` copy.
- **iOS:** `src-tauri/icons/ios/AppIcon-*.png` 20 variants (20@1x → 1024) — same master
- **Windows:** `src-tauri/icons/icon.ico` (256+128+64+48+32+16 multi) + `Square*Logo.png` for Store — generated from master via `convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico`
- **macOS:** `src-tauri/icons/icon.icns` — `iconutil` from 1024 master
- **Linux:** `src-tauri/icons/*.png` 32/64/128/256/512

**Current status:** Placeholder 1024 generated at `src/assets/brand/sarai-logo.png` (gold SARAI text on dark). **Replace with provided PNG:**
```bash
cp ~/Downloads/sarai-logo-gold.png /home/rachael/pinc-network/pinc-sarai/src/assets/brand/sarai-logo.png
bash /tmp/gen_icons.sh  # regenerates all sizes
cp src/assets/brand/sarai-logo.png src-tauri/icons/icon.png
```

### 2. Visual In-App Logo
- **Splash/Login:** `src/App.tsx:8` `<img src="/assets/images/sarai-logo.png" width120>` with gold title SARAI + tagline + Powered by PINC dot
- **Header:** `src/components/sarai/SaraiPage.tsx` uses Wallet lucide icon currently; to replace: import `sarai-logo.png` as `<img>` in tab header (optional)
- **Public asset:** `public/assets/images/sarai-logo.png` copied from master, also `public/assets/images/icon-sarai.png`, `public/sarai-icon.svg`
- **Favicon:** `index.html:4` `<link rel="icon" href="/assets/images/sarai-logo.png">` + apple-touch-icon
- **Social preview:** `index.html:6` meta description "SARAI — All Transactions. Securely."
- **Global CSS:** `--bg-primary #0a0a0f` matches logo dark bg, `--neon-green #39ff14` matches green glow, gold #D4AF37 used for accents in login/splash

### 3. Developer Attribution — Powered by PINC Platform
- **package.json:4** `"author": "PINC Platform — Powered by PINC"`, `"publisher": "PINC Platform"`
- **Cargo.toml:4** `authors = ["PINC Platform", "SARAI Team — Powered by PINC"]` + repository/homepage `https://pinc.network`
- **tauri.conf.json:6** `"publisher": "PINC Platform"`, `"displayName": "SARAI — All Transactions. Securely."`
- **index.html:7** `<meta name="author" content="PINC Platform">` + `<title>... | Powered by PINC Platform</title>`
- **App.tsx:16** Footer `<footer> SARAI v3.0 | Powered by PINC Platform • All Transactions. Securely.` + login screen badge
- **Android:** `gen/android/app/build.gradle.kts:namespace com.pinc.sarai` + `applicationId com.pinc.sarai` + `src/main/AndroidManifest.xml android:label="SARAI"` + `<meta-data android:name="developer" android:value="PINC Platform"/>` (to add on init)
- **iOS/Windows:** bundle publisher PINC Platform (tauri.conf publisher propagates to .plist and .msi)
- **About dialog (future):** `src/components/about/AboutPage.tsx` should show: Logo + "SARAI v3.0.0 — Powered by PINC Platform — All Transactions. Securely." + link to pinc.network

## Icon Generation Checklist for Release
- [ ] Replace placeholder `src/assets/brand/sarai-logo.png` with provided 1024 PNG (transparent or dark bg)
- [ ] Run `bash /tmp/gen_icons.sh` → verifies 32/128/256/512 + iOS + Android mipmaps
- [ ] `magick src/assets/brand/sarai-logo.png -define icon:auto-resize=256,128,64,48,32,16 src-tauri/icons/icon.ico`
- [ ] `iconutil` for icns (macOS) if on mac: `mkdir icon.iconset; cp ...; iconutil -c icns icon.iconset`
- [ ] `npm run build && cargo tauri build` → verify installer shows SARAI gold icon
- [ ] `npx tauri android build` → verify launcher icon on device shows gold infinity/shield
