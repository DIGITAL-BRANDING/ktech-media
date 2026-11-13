-- ============================================================
-- WARAKA TV - Complete Database Schema
-- MySQL 8.0+ compatible
-- Run this file in phpMyAdmin or MySQL CLI:
--   mysql -u root -p < waraka_tv.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS waraka_tv
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE waraka_tv;

-- ============================================================
-- 1. USERS (Admins & Staff)
-- ============================================================
CREATE TABLE users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name   VARCHAR(120)  NOT NULL,
  username    VARCHAR(60)   NOT NULL UNIQUE,
  email       VARCHAR(180)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,           -- Bcrypt hash
  role        ENUM('super_admin','admin','editor','reporter') NOT NULL DEFAULT 'reporter',
  avatar      VARCHAR(255)  DEFAULT NULL,
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,
  last_login  DATETIME      DEFAULT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 2. CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(80)  NOT NULL,
  slug        VARCHAR(80)  NOT NULL UNIQUE,
  description TEXT         DEFAULT NULL,
  color       VARCHAR(7)   DEFAULT '#E8001D',   -- Hex colour for badges
  sort_order  INT UNSIGNED NOT NULL DEFAULT 0,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Seed default categories
INSERT INTO categories (name, slug, color) VALUES
  ('Politics',       'politics',       '#E8001D'),
  ('Business',       'business',       '#C9961A'),
  ('Entertainment',  'entertainment',  '#8B5CF6'),
  ('Sports',         'sports',         '#22C55E'),
  ('Health',         'health',         '#14B8A6'),
  ('Technology',     'technology',     '#3B82F6'),
  ('International',  'international',  '#F97316'),
  ('Education',      'education',      '#EC4899');

-- ============================================================
-- 3. NEWS / ARTICLES
-- ============================================================
CREATE TABLE news (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  author_id      INT UNSIGNED NOT NULL,
  category_id    INT UNSIGNED NOT NULL,
  title          VARCHAR(255)  NOT NULL,
  slug           VARCHAR(255)  NOT NULL UNIQUE,
  excerpt        TEXT          DEFAULT NULL,       -- Short summary
  body           LONGTEXT      NOT NULL,
  featured_image VARCHAR(255)  DEFAULT NULL,       -- Path to uploaded image
  image_caption  VARCHAR(255)  DEFAULT NULL,
  tags           VARCHAR(500)  DEFAULT NULL,       -- Comma-separated tags
  is_featured    TINYINT(1)    NOT NULL DEFAULT 0, -- Show in hero/featured slots
  is_breaking    TINYINT(1)    NOT NULL DEFAULT 0, -- Show in ticker
  status         ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  views          INT UNSIGNED  NOT NULL DEFAULT 0,
  meta_title     VARCHAR(255)  DEFAULT NULL,
  meta_desc      VARCHAR(320)  DEFAULT NULL,
  published_at   DATETIME      DEFAULT NULL,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_news_author   FOREIGN KEY (author_id)   REFERENCES users(id)      ON DELETE RESTRICT,
  CONSTRAINT fk_news_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  INDEX idx_news_slug    (slug),
  INDEX idx_news_status  (status),
  INDEX idx_news_published (published_at),
  INDEX idx_news_cat     (category_id)
) ENGINE=InnoDB;

-- ============================================================
-- 4. VIDEOS
-- ============================================================
CREATE TABLE videos (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  author_id      INT UNSIGNED NOT NULL,
  category_id    INT UNSIGNED DEFAULT NULL,
  title          VARCHAR(255) NOT NULL,
  slug           VARCHAR(255) NOT NULL UNIQUE,
  description    TEXT         DEFAULT NULL,
  thumbnail      VARCHAR(255) DEFAULT NULL,
  video_source   ENUM('youtube','upload','facebook','vimeo') NOT NULL DEFAULT 'youtube',
  video_url      VARCHAR(500) DEFAULT NULL,       -- YouTube URL or embed ID
  video_file     VARCHAR(255) DEFAULT NULL,       -- Path if self-hosted
  duration       VARCHAR(10)  DEFAULT NULL,       -- e.g. "12:34"
  views          INT UNSIGNED NOT NULL DEFAULT 0,
  is_featured    TINYINT(1)   NOT NULL DEFAULT 0,
  status         ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  published_at   DATETIME     DEFAULT NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_video_author   FOREIGN KEY (author_id)   REFERENCES users(id)      ON DELETE RESTRICT,
  CONSTRAINT fk_video_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_video_status (status),
  INDEX idx_video_published (published_at)
) ENGINE=InnoDB;

-- ============================================================
-- 5. PROGRAMS / SHOWS
-- ============================================================
CREATE TABLE programs (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title          VARCHAR(150) NOT NULL,
  slug           VARCHAR(150) NOT NULL UNIQUE,
  host           VARCHAR(120) DEFAULT NULL,
  description    TEXT         DEFAULT NULL,
  poster_image   VARCHAR(255) DEFAULT NULL,
  category       VARCHAR(80)  DEFAULT NULL,        -- e.g. "News", "Talk Show"
  air_days       VARCHAR(100) DEFAULT NULL,        -- e.g. "Mon,Tue,Wed"
  air_time       TIME         DEFAULT NULL,
  duration_mins  SMALLINT UNSIGNED DEFAULT NULL,
  is_live        TINYINT(1)   NOT NULL DEFAULT 0,  -- Currently airing live
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order     INT UNSIGNED NOT NULL DEFAULT 0,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 6. PROGRAM SCHEDULE (TV Guide)
-- ============================================================
CREATE TABLE program_schedule (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  program_id   INT UNSIGNED NOT NULL,
  day_of_week  TINYINT(1)   NOT NULL,             -- 0=Sun, 1=Mon ... 6=Sat
  start_time   TIME         NOT NULL,
  end_time     TIME         NOT NULL,
  is_repeat    TINYINT(1)   NOT NULL DEFAULT 0,
  notes        VARCHAR(255) DEFAULT NULL,

  CONSTRAINT fk_schedule_program FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  INDEX idx_schedule_day (day_of_week)
) ENGINE=InnoDB;

-- ============================================================
-- 7. AWARDS & RECOGNITIONS
-- ============================================================
CREATE TABLE awards (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  awarding_body VARCHAR(150) DEFAULT NULL,
  category     VARCHAR(150) DEFAULT NULL,
  year_won     YEAR         NOT NULL,
  description  TEXT         DEFAULT NULL,
  image        VARCHAR(255) DEFAULT NULL,
  is_featured  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 8. ADVERTISEMENTS
-- ============================================================
CREATE TABLE advertisements (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  client_name  VARCHAR(150) NOT NULL,
  contact_name VARCHAR(120) DEFAULT NULL,
  email        VARCHAR(180) NOT NULL,
  phone        VARCHAR(20)  DEFAULT NULL,
  company      VARCHAR(150) DEFAULT NULL,
  ad_type      ENUM('banner','sponsored_post','video_ad','tv_spot','package') NOT NULL,
  ad_position  VARCHAR(80)  DEFAULT NULL,          -- e.g. 'homepage_top', 'sidebar'
  budget       DECIMAL(12,2) DEFAULT NULL,
  start_date   DATE         DEFAULT NULL,
  end_date     DATE         DEFAULT NULL,
  ad_image     VARCHAR(255) DEFAULT NULL,
  ad_url       VARCHAR(500) DEFAULT NULL,
  impressions  INT UNSIGNED NOT NULL DEFAULT 0,
  clicks       INT UNSIGNED NOT NULL DEFAULT 0,
  message      TEXT         DEFAULT NULL,
  status       ENUM('pending','active','paused','completed','rejected') NOT NULL DEFAULT 'pending',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 9. COMMUNITY REPORTS / CITIZEN JOURNALISM
-- ============================================================
CREATE TABLE community_reports (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(180) NOT NULL,
  phone         VARCHAR(20)  DEFAULT NULL,
  location      VARCHAR(150) DEFAULT NULL,
  title         VARCHAR(255) NOT NULL,
  description   LONGTEXT     NOT NULL,
  category_id   INT UNSIGNED DEFAULT NULL,
  attachment    VARCHAR(255) DEFAULT NULL,         -- Uploaded image/video
  is_anonymous  TINYINT(1)   NOT NULL DEFAULT 0,
  status        ENUM('pending','reviewing','approved','rejected','published') NOT NULL DEFAULT 'pending',
  admin_notes   TEXT         DEFAULT NULL,
  reviewed_by   INT UNSIGNED DEFAULT NULL,
  reviewed_at   DATETIME     DEFAULT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_report_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_report_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id)      ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 10. CONTACT MESSAGES
-- ============================================================
CREATE TABLE contact_messages (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name   VARCHAR(120) NOT NULL,
  email       VARCHAR(180) NOT NULL,
  phone       VARCHAR(20)  DEFAULT NULL,
  subject     VARCHAR(200) NOT NULL,
  message     LONGTEXT     NOT NULL,
  ip_address  VARCHAR(45)  DEFAULT NULL,
  is_read     TINYINT(1)   NOT NULL DEFAULT 0,
  replied_at  DATETIME     DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 11. NEWSLETTER SUBSCRIBERS
-- ============================================================
CREATE TABLE newsletter_subscribers (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(180) NOT NULL UNIQUE,
  name          VARCHAR(120) DEFAULT NULL,
  is_confirmed  TINYINT(1)   NOT NULL DEFAULT 0,
  token         VARCHAR(64)  DEFAULT NULL,       -- Confirmation/unsubscribe token
  subscribed_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at DATETIME   DEFAULT NULL
) ENGINE=InnoDB;

-- ============================================================
-- 12. SITE SETTINGS (Key-Value store)
-- ============================================================
CREATE TABLE site_settings (
  setting_key   VARCHAR(100) NOT NULL PRIMARY KEY,
  setting_value TEXT         DEFAULT NULL,
  description   VARCHAR(255) DEFAULT NULL,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO site_settings (setting_key, setting_value, description) VALUES
  ('site_name',        'WARAKA TV',                         'Name of the website'),
  ('site_tagline',     'Nigeria\'s Premier Television & Online Media Platform', 'Site tagline'),
  ('site_email',       'news@warakatv.ng',                  'Main contact email'),
  ('site_phone',       '+234 803 000 0000',                 'Main phone number'),
  ('live_stream_url',  'https://youtube.com/live/YOUR_ID',  'Live stream embed URL'),
  ('facebook_url',     '',                                   'Facebook page URL'),
  ('twitter_url',      '',                                   'Twitter/X URL'),
  ('youtube_url',      '',                                   'YouTube channel URL'),
  ('instagram_url',    '',                                   'Instagram URL'),
  ('breaking_news',    '',                                   'Breaking news text for ticker'),
  ('analytics_id',     '',                                   'Google Analytics ID');

-- ============================================================
-- Default Super Admin (password: Admin@123 – CHANGE IMMEDIATELY)
-- Password hash below is bcrypt of "Admin@123"
-- ============================================================
INSERT INTO users (full_name, username, email, password, role) VALUES
  ('Super Administrator', 'superadmin', 'admin@warakatv.ng',
   '$2y$12$Dv4v3X1i4JFfIz4b1L9F3.K1LijWxFgBQ0YcXELQ7l0UfX4UXeq.K',
   'super_admin');
