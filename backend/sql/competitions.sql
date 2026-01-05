-- 竞赛中心表
CREATE TABLE IF NOT EXISTS competitions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT '竞赛名称',
    level ENUM('A', 'B', 'C', 'D') NOT NULL COMMENT '竞赛级别',
    category VARCHAR(100) NOT NULL COMMENT '竞赛类别',
    description TEXT COMMENT '竞赛简介',
    
    -- 基础信息
    organizer VARCHAR(255) NOT NULL COMMENT '主办方',
    co_organizer VARCHAR(255) COMMENT '承办方',
    official_website VARCHAR(500) COMMENT '官方网站',
    contact_email VARCHAR(255) COMMENT '联系邮箱',
    contact_phone VARCHAR(50) COMMENT '联系电话',
    
    -- 时间信息
    event_time VARCHAR(255) COMMENT '举办时间',
    registration_time VARCHAR(255) COMMENT '报名时间',
    duration VARCHAR(100) COMMENT '比赛时长',
    
    -- 参赛要求
    target_participants TEXT COMMENT '参赛对象',
    education_requirement VARCHAR(255) COMMENT '学历要求',
    team_requirement VARCHAR(255) COMMENT '组队要求',
    registration_fee VARCHAR(100) COMMENT '报名费用',
    technical_requirements TEXT COMMENT '技术要求',
    
    -- 竞赛内容
    competition_format TEXT COMMENT '竞赛形式',
    knowledge_areas TEXT COMMENT '知识领域',
    technical_skills TEXT COMMENT '技术技能',
    competition_process TEXT COMMENT '竞赛流程',
    
    -- 评审标准
    evaluation_criteria TEXT COMMENT '评审标准',
    award_settings TEXT COMMENT '奖项设置',
    award_ratio VARCHAR(100) COMMENT '获奖比例',
    
    -- 历年数据
    participant_scale VARCHAR(255) COMMENT '参赛规模',
    participating_universities VARCHAR(255) COMMENT '参赛高校',
    historical_topics TEXT COMMENT '历年题目',
    growth_trend VARCHAR(255) COMMENT '增长趋势',
    
    -- 状态和统计
    status ENUM('active', 'inactive', 'expired') DEFAULT 'active' COMMENT '状态',
    popularity_score DECIMAL(3,1) DEFAULT 0.0 COMMENT '热度评分',
    view_count INT UNSIGNED DEFAULT 0 COMMENT '浏览次数',
    favorite_count INT UNSIGNED DEFAULT 0 COMMENT '收藏次数',
    
    -- 管理字段
    created_by INT UNSIGNED COMMENT '创建者ID',
    updated_by INT UNSIGNED COMMENT '更新者ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_level (level),
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_popularity (popularity_score),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教育部认定竞赛信息表';
