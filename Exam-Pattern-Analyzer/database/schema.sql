-- Exam Pattern Analyzer (EPA) Database Schema
-- Brand: Developed by Mehedi364 | Tagline: Analyze. Understand. Practice.
-- Optimized for MySQL 8+, MariaDB, cPanel, and phpMyAdmin

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users Table
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  `reset_token` VARCHAR(100) NULL,
  `reset_token_expires` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Subjects Table
DROP TABLE IF EXISTS `subjects`;
CREATE TABLE `subjects` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `code` VARCHAR(50) NULL,
  `department` VARCHAR(100) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Courses Table
DROP TABLE IF EXISTS `courses`;
CREATE TABLE `courses` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `subject_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `course_code` VARCHAR(50) NULL,
  `exam_type` VARCHAR(100) DEFAULT 'Degree / Honours',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Chapters Table
DROP TABLE IF EXISTS `chapters`;
CREATE TABLE `chapters` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `subject_id` INT UNSIGNED NOT NULL,
  `course_id` INT UNSIGNED NULL,
  `name` VARCHAR(255) NOT NULL,
  `chapter_number` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Topics Table
DROP TABLE IF EXISTS `topics`;
CREATE TABLE `topics` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `chapter_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `subtopic` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Uploads Table
DROP TABLE IF EXISTS `uploads`;
CREATE TABLE `uploads` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NULL,
  `original_filename` VARCHAR(255) NOT NULL,
  `stored_filename` VARCHAR(255) NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `file_size` INT UNSIGNED NOT NULL,
  `status` ENUM('Uploaded', 'Processing', 'Extracting', 'Analyzing', 'Completed', 'Needs Verification', 'Failed') DEFAULT 'Uploaded',
  `error_log` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Exam Papers Table
DROP TABLE IF EXISTS `exam_papers`;
CREATE TABLE `exam_papers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `upload_id` INT UNSIGNED NULL,
  `subject_id` INT UNSIGNED NOT NULL,
  `course_id` INT UNSIGNED NULL,
  `title` VARCHAR(255) NOT NULL,
  `exam_year` VARCHAR(10) NOT NULL,
  `academic_session` VARCHAR(20) NULL,
  `exam_type` VARCHAR(100) DEFAULT 'Degree',
  `total_questions` INT DEFAULT 0,
  `is_verified` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Paper Pages Table
DROP TABLE IF EXISTS `paper_pages`;
CREATE TABLE `paper_pages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `paper_id` INT UNSIGNED NOT NULL,
  `page_number` INT NOT NULL,
  `image_path` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`paper_id`) REFERENCES `exam_papers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. OCR Results Table
DROP TABLE IF EXISTS `ocr_results`;
CREATE TABLE `ocr_results` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `page_id` INT UNSIGNED NOT NULL,
  `raw_text` LONGTEXT NOT NULL,
  `confidence_score` DECIMAL(5,2) DEFAULT 0.00,
  `detected_year` VARCHAR(10) NULL,
  `detected_subject` VARCHAR(100) NULL,
  `detected_sections` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`page_id`) REFERENCES `paper_pages`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Questions Table
DROP TABLE IF EXISTS `questions`;
CREATE TABLE `questions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `paper_id` INT UNSIGNED NOT NULL,
  `subject_id` INT UNSIGNED NOT NULL,
  `chapter_id` INT UNSIGNED NULL,
  `topic_id` INT UNSIGNED NULL,
  `question_number` VARCHAR(10) NOT NULL,
  `question_text` TEXT NOT NULL,
  `original_ocr_text` TEXT NOT NULL,
  `verified_question_text` TEXT NOT NULL,
  `normalized_text` TEXT NOT NULL,
  `section` VARCHAR(50) NOT NULL DEFAULT 'ক বিভাগ',
  `marks` INT NOT NULL DEFAULT 1,
  `exam_year` VARCHAR(10) NOT NULL,
  `answer_text` TEXT NULL,
  `verification_status` ENUM('Verified', 'Needs Verification', 'Extraction Failed') DEFAULT 'Needs Verification',
  `ocr_confidence` DECIMAL(5,2) DEFAULT 0.85,
  `page_number` INT DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`paper_id`) REFERENCES `exam_papers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE,
  INDEX (`exam_year`),
  INDEX (`verification_status`),
  INDEX (`marks`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Question Options Table (for MCQs)
DROP TABLE IF EXISTS `question_options`;
CREATE TABLE `question_options` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `question_id` INT UNSIGNED NOT NULL,
  `option_label` VARCHAR(10) NOT NULL,
  `option_text` VARCHAR(255) NOT NULL,
  `is_correct` TINYINT(1) DEFAULT 0,
  FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Question Topics Mapping Table
DROP TABLE IF EXISTS `question_topics`;
CREATE TABLE `question_topics` (
  `question_id` INT UNSIGNED NOT NULL,
  `topic_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`question_id`, `topic_id`),
  FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Question Similarities Table
DROP TABLE IF EXISTS `question_similarities`;
CREATE TABLE `question_similarities` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `question_id_1` INT UNSIGNED NOT NULL,
  `question_id_2` INT UNSIGNED NOT NULL,
  `similarity_score` DECIMAL(5,2) NOT NULL,
  `is_exact_repeat` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`question_id_1`) REFERENCES `questions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id_2`) REFERENCES `questions`(`id`) ON DELETE CASCADE,
  INDEX (`similarity_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Historical Dates Table
DROP TABLE IF EXISTS `historical_dates`;
CREATE TABLE `historical_dates` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `question_id` INT UNSIGNED NOT NULL,
  `historical_date` VARCHAR(50) NOT NULL,
  `bengali_date` VARCHAR(50) NOT NULL,
  `event_hint` VARCHAR(255) NOT NULL,
  `exam_year` VARCHAR(10) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE,
  INDEX (`historical_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Analysis Results Table
DROP TABLE IF EXISTS `analysis_results`;
CREATE TABLE `analysis_results` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `subject_id` INT UNSIGNED NOT NULL,
  `years_covered` TEXT NOT NULL,
  `total_questions` INT NOT NULL,
  `repeated_count` INT NOT NULL,
  `top_topics_json` JSON NULL,
  `generated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Practice Tests Table
DROP TABLE IF EXISTS `practice_tests`;
CREATE TABLE `practice_tests` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `subject_id` INT UNSIGNED NULL,
  `mode` VARCHAR(50) DEFAULT '1_mark',
  `time_limit_minutes` INT DEFAULT 10,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Practice Questions Table
DROP TABLE IF EXISTS `practice_questions`;
CREATE TABLE `practice_questions` (
  `test_id` INT UNSIGNED NOT NULL,
  `question_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`test_id`, `question_id`),
  FOREIGN KEY (`test_id`) REFERENCES `practice_tests`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Practice Attempts Table
DROP TABLE IF EXISTS `practice_attempts`;
CREATE TABLE `practice_attempts` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NULL,
  `test_id` INT UNSIGNED NULL,
  `total_questions` INT NOT NULL,
  `correct_count` INT NOT NULL DEFAULT 0,
  `wrong_count` INT NOT NULL DEFAULT 0,
  `skipped_count` INT NOT NULL DEFAULT 0,
  `score` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `accuracy_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `time_used_seconds` INT NOT NULL DEFAULT 0,
  `completed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Practice Answers Table
DROP TABLE IF EXISTS `practice_answers`;
CREATE TABLE `practice_answers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `attempt_id` INT UNSIGNED NOT NULL,
  `question_id` INT UNSIGNED NOT NULL,
  `is_correct` TINYINT(1) DEFAULT 0,
  `is_skipped` TINYINT(1) DEFAULT 0,
  `user_answer` TEXT NULL,
  FOREIGN KEY (`attempt_id`) REFERENCES `practice_attempts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. AI Requests Table
DROP TABLE IF EXISTS `ai_requests`;
CREATE TABLE `ai_requests` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NULL,
  `prompt_text` TEXT NOT NULL,
  `model_used` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. AI Responses Table
DROP TABLE IF EXISTS `ai_responses`;
CREATE TABLE `ai_responses` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `request_id` INT UNSIGNED NOT NULL,
  `response_text` LONGTEXT NOT NULL,
  `grounded_sources_json` JSON NULL,
  `tokens_used` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`request_id`) REFERENCES `ai_requests`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. System Settings Table
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `key_name` VARCHAR(100) PRIMARY KEY,
  `key_value` TEXT NULL,
  `description` VARCHAR(255) NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. Audit Logs Table
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NULL,
  `entity_id` INT UNSIGNED NULL,
  `details` TEXT NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
