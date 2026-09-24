# Exam Pattern Analyzer (EPA) - Installation Guide

Developed by **Mehedi364**  
Tagline: **Analyze. Understand. Practice.**

---

## 1. System Requirements

* **PHP:** Version 8.0 or higher
* **MySQL:** Version 5.7+ or MySQL 8.0+ / MariaDB 10.3+
* **PHP Extensions:** `pdo`, `pdo_mysql`, `mbstring`, `json`, `curl`, `gd`
* **Web Server:** Apache (with `mod_rewrite`) or Nginx or LiteSpeed
* **Hosting Compatibility:** cPanel, DirectAdmin, InfinityFree, Namecheap, Hostinger, Localhost (XAMPP/Laragon)

---

## 2. Web Application Setup

### Method A: Web-Based GUI Installer (Recommended)
1. Upload the files inside the `web/` folder to your server's `public_html/` (or a subdirectory like `public_html/epa/`).
2. Create a MySQL database and user in your hosting control panel (e.g., cPanel MySQL Database Wizard) and grant all privileges.
3. Open your browser and navigate to:
   ```text
   https://yourdomain.com/install.php
   ```
4. The installer will test your PHP version and extensions, connect to your MySQL database, run `schema.sql` and `seed.sql`, configure your admin credentials, and create the `install.lock` file.
5. Click **Launch Application** to start using the system.

### Method B: Manual Configuration
1. Import `database/schema.sql` into phpMyAdmin.
2. Import `database/seed.sql` to load initial verified degree and honours questions.
3. Copy `.env.example` to `.env` or create `web/config/config.php`:
   ```php
   <?php
   return [
       'db_host' => 'localhost',
       'db_port' => '3306',
       'db_name' => 'your_database_name',
       'db_user' => 'your_database_user',
       'db_pass' => 'your_database_password'
   ];
   ```
4. Create an empty `install.lock` file inside `web/` to prevent installer access.

---

## 3. InfinityFree Hosting Notes
* When deploying on InfinityFree, ensure your database host matches the custom SQL host provided in your account details (e.g. `sqlxxx.epizy.com`), not `localhost`.
* Set file permissions to `755` for directories and `644` for files.

---

## 4. OpenRouter AI Setup
1. Sign up at [OpenRouter.ai](https://openrouter.ai).
2. Generate an API key.
3. In the application's Admin Settings or `.env`, set:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-xxxxxxxx
   OPENROUTER_MODEL=google/gemini-2.0-flash-001
   ```
4. The backend securely proxies all requests and grounds responses strictly in database questions.
