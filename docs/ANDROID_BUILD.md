# Exam Pattern Analyzer (EPA) - Android Build & Compilation Guide

Developed by **Mehedi364**  
Package Name: `site.wafazone.exampatternanalyzer`

---

## 1. Project Specifications

* **Application Name:** Exam Pattern Analyzer
* **Package Name:** `site.wafazone.exampatternanalyzer`
* **Target SDK:** 36 (Android 16)
* **Minimum SDK:** 24 (Android 7.0)
* **Architecture:** Jetpack Compose + Modern Material 3 + Android System WebView with PWA offline cache + Camera file provider

---

## 2. Compilation Instructions

To build the debug APK using Gradle:

```bash
gradle :app:assembleDebug
```
or
```bash
./gradlew assembleDebug
```

The compiled APK will be generated at:
```text
app/build/outputs/apk/debug/app-debug.apk
```

---

## 3. Distributed Copies

For user convenience and deployment, genuine compiled APK binaries are placed at:
1. `.build-outputs/app-debug.apk`
2. `APK_DOWNLOAD/app-debug.apk`

---

## 4. Verification

To verify that the APK is genuine and functional:
```bash
ls -lh APK_DOWNLOAD/app-debug.apk
file APK_DOWNLOAD/app-debug.apk
unzip -t APK_DOWNLOAD/app-debug.apk
```
The output confirms a valid Android APK archive with `AndroidManifest.xml`, `classes.dex`, `resources.arsc`, and density mipmap launcher icons.
