-- 好友申请表
CREATE TABLE IF NOT EXISTS friend_requests (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sender_id INT UNSIGNED NOT NULL,
    receiver_id INT UNSIGNED NOT NULL,
    message TEXT,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_sender_receiver (sender_id, receiver_id),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_receiver_status (receiver_id, status),
    INDEX idx_sender_status (sender_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 更新好友关系表，添加状态字段
ALTER TABLE user_friendships 
ADD COLUMN IF NOT EXISTS status ENUM('active', 'blocked') DEFAULT 'active',
ADD INDEX IF NOT EXISTS idx_status (status);
