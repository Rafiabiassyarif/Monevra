CREATE DATABASE IF NOT EXISTS `monevra`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `monevra`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `goals`;
DROP TABLE IF EXISTS `budgets`;
DROP TABLE IF EXISTS `wallets`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `system_settings`;
DROP TABLE IF EXISTS `security_logs`;
DROP TABLE IF EXISTS `master_categories`;
DROP TABLE IF EXISTS `exchange_rates`;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(190) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  `currency` CHAR(3) NOT NULL DEFAULT 'IDR',
  `language` VARCHAR(10) NOT NULL DEFAULT 'id',
  `phone` VARCHAR(20) NULL,
  `avatar` VARCHAR(255) NULL,
  `two_factor_enabled` BOOLEAN NOT NULL DEFAULT FALSE,
  `notif_email` BOOLEAN NOT NULL DEFAULT TRUE,
  `notif_push` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `wallets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `type` ENUM('Bank', 'Crypto', 'eWallet') NOT NULL,
  `account_number` VARCHAR(120) NULL,
  `balance` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `wallets_user_id_index` (`user_id`),
  CONSTRAINT `wallets_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `transactions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `wallet_id` BIGINT UNSIGNED NULL,
  `title` VARCHAR(160) NOT NULL,
  `category` VARCHAR(120) NOT NULL,
  `amount` DECIMAL(18,2) NOT NULL,
  `wallet_name` VARCHAR(120) NOT NULL,
  `transaction_date` DATE NOT NULL,
  `status` ENUM('Completed', 'Pending', 'Failed') NOT NULL DEFAULT 'Completed',
  `type` ENUM('income', 'expense') NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `transactions_user_id_date_index` (`user_id`, `transaction_date`),
  KEY `transactions_wallet_id_index` (`wallet_id`),
  CONSTRAINT `transactions_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `transactions_wallet_id_foreign`
    FOREIGN KEY (`wallet_id`) REFERENCES `wallets` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `title` VARCHAR(160) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('info', 'success', 'warning', 'error') NOT NULL DEFAULT 'info',
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `notifications_user_id_index` (`user_id`),
  CONSTRAINT `notifications_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `budgets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `category` VARCHAR(120) NOT NULL,
  `limit_amount` DECIMAL(18,2) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `budgets_user_id_index` (`user_id`),
  CONSTRAINT `budgets_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `currency`) VALUES
  (1, 'Rafia Admin', 'rafiabiassyarif@gmail.com', '$2b$12$Nv.xWwuxoAskwrtsVZhfluedW7MWwKkHukSNwvZtIqxtyAu6Rf88.', 'admin', 'IDR'),
  (2, 'Demo User', 'user.demo@monevra.com', '$2b$12$qehgZTVnUdhrm4v6QjtVJuwEx7FIq/6rNMqsmoqo191rGUDkQd3eu', 'user', 'IDR');

INSERT INTO `wallets` (`id`, `user_id`, `name`, `type`, `account_number`, `balance`) VALUES
  (1, 2, 'Main Bank', 'Bank', '**** 4421', 8450.20),
  (2, 2, 'Credit Card', 'Bank', '**** 8899', -450.00),
  (3, 2, 'PayPal', 'eWallet', 'alex@example.com', 1250.00),
  (4, 2, 'Revolut', 'eWallet', '+1 415-555-0198', 150.00);

INSERT INTO `transactions` (`user_id`, `wallet_id`, `title`, `category`, `amount`, `wallet_name`, `transaction_date`, `status`, `type`) VALUES
  (2, 1, 'Apple Music Subscription', 'Entertainment', -10.99, 'Main Bank', '2026-05-24', 'Completed', 'expense'),
  (2, 3, 'Freelance Design Work', 'Income', 1250.00, 'PayPal', '2026-05-22', 'Completed', 'income'),
  (2, 1, 'Grocery Store', 'Food', -124.50, 'Main Bank', '2026-05-21', 'Completed', 'expense'),
  (2, 2, 'AWS Server Hosting', 'Infrastructure', -45.00, 'Credit Card', '2026-05-20', 'Pending', 'expense'),
  (2, 1, 'Coffee Beans', 'Food', -18.99, 'Main Bank', '2026-05-19', 'Completed', 'expense');

INSERT INTO `budgets` (`user_id`, `category`, `limit_amount`) VALUES
  (2, 'Housing', 1200.00),
  (2, 'Food', 600.00),
  (2, 'Transport', 300.00),
  (2, 'Entertainment', 200.00);

CREATE TABLE `goals` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `target_amount` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  `current_amount` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  `deadline` DATE NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `goals_user_id_index` (`user_id`),
  CONSTRAINT `goals_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `system_settings` (
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `system_settings` (`setting_key`, `setting_value`) VALUES
  ('smtp_host', 'smtp.mailtrap.io'),
  ('sender_email', 'noreply@monevra.com'),
  ('notify_new_transaction', 'true'),
  ('notify_budget_alert', 'true'),
  ('email_weekly_report', 'false');

CREATE TABLE `security_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `action` VARCHAR(255) NOT NULL,
  `user_email` VARCHAR(190) NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `security_logs` (`action`, `user_email`, `ip_address`) VALUES
  ('System initialized', 'system', '127.0.0.1');

CREATE TABLE `master_categories` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `type` ENUM('income', 'expense') NOT NULL,
  `color` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `master_categories` (`id`, `name`, `type`, `color`) VALUES
  ('cat_1', 'Makanan & Minuman', 'expense', '#f43f5e'),
  ('cat_2', 'Transportasi', 'expense', '#f59e0b'),
  ('cat_3', 'Gaji', 'income', '#10b981');

CREATE TABLE `exchange_rates` (
  `code` CHAR(3) NOT NULL,
  `rate` DECIMAL(18,4) NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `exchange_rates` (`code`, `rate`) VALUES
  ('USD', 16400.00),
  ('EUR', 17500.00),
  ('SGD', 12100.00),
  ('MYR', 3480.00);
