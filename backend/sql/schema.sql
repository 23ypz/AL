CREATE DATABASE IF NOT EXISTS academic_light DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE academic_light;

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'mentor', 'admin') NOT NULL DEFAULT 'student',
    college VARCHAR(100),
    major VARCHAR(100),
    avatar_url MEDIUMTEXT,
    bio TEXT,
    expertise_tags VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS competitions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    college VARCHAR(100) NOT NULL,
    level VARCHAR(50) NOT NULL,
    deadline DATE NOT NULL,
    status ENUM('hot', 'deadline', 'normal') DEFAULT 'normal',
    description TEXT,
    focus TEXT,
    records TEXT,
    created_by INT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS discussion_posts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    college VARCHAR(100),
    tags VARCHAR(200),
    created_by INT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS discussion_comments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id INT UNSIGNED NOT NULL,
    content TEXT NOT NULL,
    created_by INT UNSIGNED,
    parent_id INT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES discussion_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES discussion_comments(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    type VARCHAR(100) NOT NULL,
    payload JSON,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_friendships (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    friend_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_friend (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS research_applications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED,
    applicant_name VARCHAR(100) NOT NULL,
    student_number VARCHAR(50) NOT NULL,
    major VARCHAR(100) NOT NULL,
    contact VARCHAR(120) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_project_user (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES research_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS postgraduate_posts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    college VARCHAR(100) NOT NULL,
    category VARCHAR(120) DEFAULT '经验分享',
    stage ENUM('资料收集', '网申/报名', '笔试/测评', '面试汇报', '录取公示') DEFAULT '资料收集',
    highlight TEXT,
    resources TEXT,
    deadline DATE NULL,
    created_by INT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS competition_applications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    competition_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED,
    applicant_name VARCHAR(100) NOT NULL,
    student_number VARCHAR(50) NOT NULL,
    major VARCHAR(100) NOT NULL,
    contact VARCHAR(120) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_competition_user (competition_id, user_id),
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS research_projects (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    college VARCHAR(100) NOT NULL,
    field VARCHAR(120) NOT NULL,
    stage ENUM('课题招募', '数据采集', '论文撰写', '成果申报') DEFAULT '课题招募',
    lab VARCHAR(150),
    plan TEXT,
    summary TEXT,
    team_size INT UNSIGNED DEFAULT 0,
    created_by INT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
