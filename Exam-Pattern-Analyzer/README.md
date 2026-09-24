# Exam Pattern Analyzer (EPA)

> **Tagline:** Analyze. Understand. Practice.  
> **Brand:** Developed by Mehedi364  
> **Package Name:** `site.wafazone.exampatternanalyzer`

An educational pattern analyzer and question bank system for students in Bangladesh (Degree, Honours, HSC, BCS). Exam Pattern Analyzer extracts, categorizes, detects exact repetitions, identifies similar questions, isolates historical dates, and enables practice using verified past papers.

---

## 🌟 Key Features

1. **Dashboard & Analytics:** Real statistics strictly generated from database questions—no fake counters or simulated figures.
2. **OCR & Multi-Format Ingestion:** Supports PDF, JPG, PNG, and WEBP question papers with Bengali (০-৯) and English digit extraction, section separation (ক বিভাগ, খ বিভাগ, গ বিভাগ), and marks parsing.
3. **Exact Repeat Detector:** Normalizes Bengali text to track questions appearing verbatim across academic years (e.g. First appeared: 2021, Also appeared: 2023, 2025).
4. **Similar Question Detector:** Token overlap calculation (Jaccard + Dice coefficient) with user-configurable similarity threshold (e.g. 75% or 87% similar).
5. **Historical Date Extractor (Important Years):** Extracts historical years (e.g. 622 CE, 1757, 1952, 1971) mentioned inside question text while keeping them strictly separated from Exam Years.
6. **Verified 1-Mark Practice Mode:** Practice flashcard tests generated exclusively from verified questions with timers, accuracy tracking, and persistent history.
7. **Searchable Question Bank:** Advanced filters by Subject, Year, Chapter, Topic, Section, Marks, and Verification Status.
8. **Automated Export & Reports:** Generates PDF, DOCX (Word), and CSV data sheets with clean typography.
9. **Ask AI Integration:** Backend-grounded OpenRouter AI chat proxy that quotes exact exam source citations.
10. **Neumorphic Modern UI:** Bengali-first interface with English toggle, dark/light theme switch, and mobile bottom navigation.
11. **Native Android Application:** Jetpack Compose shell wrapping an offline-ready PWA with camera permissions, file choosers, and custom server URL switching.

---

## 📁 Project Architecture

```text
Exam-Pattern-Analyzer/
├── app/                  # Android Studio / Gradle module (Jetpack Compose & WebView)
├── web/                  # PHP 8+ Web Application & REST API (cPanel & shared hosting ready)
│   ├── assets/           # Neumorphic CSS, JS engines, icons
│   ├── config/           # Database connection & credentials
│   ├── includes/         # Auth, CSRF, text normalization, audit log
│   ├── api/              # RESTful API endpoints
│   ├── install.php       # 10-step graphical installer
│   └── index.php         # Main application entry
├── database/             # MySQL schema (23 normalized tables) & seed dataset
├── docs/                 # Detailed guides (Installation, Android, API)
├── .build-outputs/       # Genuine compiled APK
└── APK_DOWNLOAD/         # Genuine compiled APK for direct distribution
```

---

## 🛠️ Technology Stack

* **Mobile App:** Kotlin, Jetpack Compose, Material 3, Android WebView, Gradle 9.1
* **Web App:** PHP 8+, MySQL PDO, HTML5, CSS3 Neumorphic Design, Vanilla JS, PWA (Service Worker)
* **AI:** OpenRouter API (backend secured)
* **Target Environment:** cPanel, Apache, InfinityFree, MySQL/phpMyAdmin, Android 7.0+ (API 24 to 36)

---

## 🚀 Quick Start

### Android APK
The compiled debug APK is located at:
* `APK_DOWNLOAD/app-debug.apk`
* `.build-outputs/app-debug.apk`

### Web Deployment
1. Upload the contents of `web/` to your server.
2. Open `https://your-domain.com/install.php` in a browser.
3. Enter your MySQL database credentials and complete the automated setup.

---

**Developed with ❤️ by Mehedi364**
