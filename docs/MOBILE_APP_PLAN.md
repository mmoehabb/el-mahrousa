# Mobile Application Development Plan

This document outlines the plan to convert the El Mahrousa web application into a native mobile application (initially targeting Android) using Capacitor.

## 1. Tooling and Framework

We will use **Capacitor** (by Ionic) to wrap the existing React/Vite application into a native mobile app. Capacitor is lightweight, modern, and drops seamlessly into an existing web project, providing native wrappers and bridging capabilities without fundamentally changing the web architecture.

## 2. Dependencies

- `@capacitor/core`: Core Capacitor library.
- `@capacitor/cli`: Command-line tools for Capacitor.
- `@capacitor/android`: Capacitor Android platform support.
- `@capacitor-community/admob`: AdMob plugin for displaying native ads.

## 3. Ads Integration (Web vs. Mobile)

The current web app uses Google AdSense H5 Games. AdSense cannot be used in a mobile wrapper due to policy restrictions, so we will use Google AdMob for the mobile build.

We will update the `useAdBreak` hook (`src/hooks/useAdBreak.ts`) to:

1. Detect if the app is running natively (`Capacitor.isNativePlatform()`).
2. If native, initialize `@capacitor-community/admob`, load an interstitial ad, and display it.
3. If web, fallback to the existing `window.adBreak` logic.

## 4. PeerJS and Networking

PeerJS relies on WebRTC, which works excellently in mobile WebViews. We acknowledge that the connection may drop when the mobile OS backgrounds the app. Given current requirements, we accept this limitation and players will be disconnected if they minimize the application. No complex background reconnection loop is strictly required at this stage.

## 5. Capacitor Initialization

1. Build the Vite app: `pnpm build`.
2. Initialize Capacitor: `npx cap init el-mahrousa "com.elmahrousa.app" --web-dir dist`.
3. Add Android platform: `npx cap add android`.
4. Update `android/app/src/main/AndroidManifest.xml` with the AdMob App ID `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="ca-app-pub-3940256099942544~3347511713"/>` (using Google's test ID for development).
5. Sync everything: `npx cap sync`.

## 6. Build and Deploy

Future builds will require:

1. Building the web app: `pnpm build`
2. Syncing Capacitor: `npx cap sync android`
3. Opening Android Studio: `npx cap open android`
4. Building the APK/AAB from Android Studio.
