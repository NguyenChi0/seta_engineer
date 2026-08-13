-- Chạy trên database seta_engineer nếu chưa khởi động backend (backend tự migrate khi start).
ALTER TABLE posts ADD COLUMN slug VARCHAR(255) NULL UNIQUE AFTER title;
ALTER TABLE posts ADD COLUMN meta_title VARCHAR(255) NULL AFTER excerpt;
ALTER TABLE posts ADD COLUMN meta_description VARCHAR(500) NULL AFTER meta_title;
