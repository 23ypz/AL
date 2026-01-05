USE academic_light;

INSERT INTO users (full_name, email, password_hash, role)
VALUES
('系统管理员', 'admin@academic-light.test', '$2a$10$yLECkCmZJLdnOjFkMrDXFuMh35vj0IadB1iKsFcfoTmyaKOA1NVUa', 'admin')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- 密码为：Admin123!
