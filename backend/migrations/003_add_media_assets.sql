CREATE TABLE IF NOT EXISTS media_assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  url VARCHAR(1000) NOT NULL,
  kind ENUM('content', 'title') NOT NULL DEFAULT 'content',
  filename VARCHAR(255) NOT NULL,
  alt_text VARCHAR(500) NULL,
  title_attr VARCHAR(500) NULL,
  caption VARCHAR(500) NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_media_assets_url (url(768)),
  KEY idx_media_assets_kind (kind),
  KEY idx_media_assets_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
