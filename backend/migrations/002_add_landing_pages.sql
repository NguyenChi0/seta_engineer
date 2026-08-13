-- Chạy trên database seta_engineer nếu chưa khởi động backend (backend tự migrate khi start).
CREATE TABLE IF NOT EXISTS landing_pages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  content MEDIUMTEXT NOT NULL,
  meta_title VARCHAR(255) NULL,
  meta_description VARCHAR(500) NULL,
  status TINYINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_landing_pages_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
