-- Database initialization script
-- This runs automatically when the MySQL container is first created

CREATE DATABASE IF NOT EXISTS credit_card_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON credit_card_db.* TO 'ccpay_user'@'%';
FLUSH PRIVILEGES;
