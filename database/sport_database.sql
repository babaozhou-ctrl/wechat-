-- ============================================
-- 运动小程序数据库设计
-- 数据库：sport_db
-- 版本：1.0
-- ============================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    `openid` VARCHAR(64) NOT NULL COMMENT '微信OpenID',
    `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称',
    `avatar_url` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
    `gender` TINYINT DEFAULT 0 COMMENT '性别: 0未知 1男 2女',
    `height` DECIMAL(5,1) DEFAULT NULL COMMENT '身高(cm)',
    `weight` DECIMAL(5,1) DEFAULT NULL COMMENT '体重(kg)',
    `birthday` DATE DEFAULT NULL COMMENT '生日',
    `target_calories` INT DEFAULT 500 COMMENT '每日目标消耗(kcal)',
    `target_duration` INT DEFAULT 60 COMMENT '每日目标时长(分钟)',
    `total_distance` DECIMAL(10,2) DEFAULT 0 COMMENT '累计运动距离(km)',
    `total_duration` INT DEFAULT 0 COMMENT '累计运动时长(分钟)',
    `total_calories` INT DEFAULT 0 COMMENT '累计消耗(kcal)',
    `total_sports` INT DEFAULT 0 COMMENT '累计运动次数',
    `streak_days` INT DEFAULT 0 COMMENT '连续运动天数',
    `last_sport_date` DATE DEFAULT NULL COMMENT '最后运动日期',
    `level` INT DEFAULT 1 COMMENT '用户等级',
    `experience` INT DEFAULT 0 COMMENT '经验值',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_openid` (`openid`),
    KEY `idx_last_sport_date` (`last_sport_date`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 2. 运动记录表
CREATE TABLE IF NOT EXISTS `sport_records` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    `openid` VARCHAR(64) NOT NULL COMMENT '用户OpenID',
    `sport_type` VARCHAR(50) NOT NULL COMMENT '运动类型key',
    `sport_name` VARCHAR(50) NOT NULL COMMENT '运动名称',
    `start_time` DATETIME NOT NULL COMMENT '开始时间',
    `end_time` DATETIME DEFAULT NULL COMMENT '结束时间',
    `duration` INT NOT NULL DEFAULT 0 COMMENT '运动时长(秒)',
    `distance` DECIMAL(10,3) DEFAULT 0 COMMENT '运动距离(km)',
    `calories` INT DEFAULT 0 COMMENT '消耗卡路里(kcal)',
    `avg_speed` DECIMAL(5,2) DEFAULT 0 COMMENT '平均速度(km/h)',
    `max_speed` DECIMAL(5,2) DEFAULT 0 COMMENT '最大速度(km/h)',
    `avg_heart_rate` INT DEFAULT NULL COMMENT '平均心率',
    `max_heart_rate` INT DEFAULT NULL COMMENT '最大心率',
    `elevation_gain` DECIMAL(8,2) DEFAULT 0 COMMENT '累计爬升(m)',
    `elevation_loss` DECIMAL(8,2) DEFAULT 0 COMMENT '累计下降(m)',
    `steps` INT DEFAULT 0 COMMENT '步数',
    `avg_step_rate` DECIMAL(5,1) DEFAULT 0 COMMENT '平均步频',
    `map_points` JSON DEFAULT NULL COMMENT 'GPS轨迹点',
    `pace_records` JSON DEFAULT NULL COMMENT '分段配速记录',
    `status` TINYINT DEFAULT 1 COMMENT '状态: 0已删除 1进行中 2已完成 3暂停',
    `is_valid` TINYINT DEFAULT 1 COMMENT '数据是否有效: 0异常 1正常',
    `abnormal_reason` VARCHAR(100) DEFAULT NULL COMMENT '异常原因',
    `weather` VARCHAR(20) DEFAULT NULL COMMENT '天气',
    `temperature` DECIMAL(4,1) DEFAULT NULL COMMENT '温度',
    `remark` VARCHAR(200) DEFAULT NULL COMMENT '备注',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_openid` (`openid`),
    KEY `idx_sport_type` (`sport_type`),
    KEY `idx_start_time` (`start_time`),
    KEY `idx_status` (`status`),
    KEY `idx_openid_time` (`openid`, `start_time`),
    KEY `idx_openid_type` (`openid`, `sport_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='运动记录表';

-- 3. 运动类型表（系统预设）
CREATE TABLE IF NOT EXISTS `sport_types` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '类型ID',
    `sport_key` VARCHAR(50) NOT NULL COMMENT '运动类型key',
    `name` VARCHAR(50) NOT NULL COMMENT '运动名称',
    `icon` VARCHAR(10) NOT NULL COMMENT '图标emoji',
    `calories_per_km` DECIMAL(6,2) NOT NULL COMMENT '每公里消耗(kcal)',
    `description` VARCHAR(200) DEFAULT NULL COMMENT '描述',
    `is_default` TINYINT DEFAULT 1 COMMENT '是否系统预设: 0否 1是',
    `sort_order` INT DEFAULT 0 COMMENT '排序',
    `status` TINYINT DEFAULT 1 COMMENT '状态: 0禁用 1启用',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_sport_key` (`sport_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='运动类型表';

-- 4. 用户自定义运动类型表
CREATE TABLE IF NOT EXISTS `custom_sport_types` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
    `openid` VARCHAR(64) NOT NULL COMMENT '用户OpenID',
    `sport_key` VARCHAR(50) NOT NULL COMMENT '运动类型key',
    `name` VARCHAR(50) NOT NULL COMMENT '运动名称',
    `icon` VARCHAR(10) NOT NULL COMMENT '图标',
    `calories_per_km` DECIMAL(6,2) NOT NULL COMMENT '每公里消耗',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_openid_key` (`openid`, `sport_key`),
    KEY `idx_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户自定义运动类型表';

-- ============================================
-- 初始化预设运动类型数据
-- ============================================
INSERT INTO `sport_types` (`sport_key`, `name`, `icon`, `calories_per_km`, `description`, `is_default`, `sort_order`) VALUES
('running', '跑步', '🏃', 60.00, '户外跑步或室内跑步机', 1, 1),
('walking', '健走', '🚶', 40.00, '快走或散步', 1, 2),
('cycling', '骑行', '🚴', 35.00, '户外骑行或室内动感单车', 1, 3),
('swimming', '游泳', '🏊', 80.00, '游泳锻炼', 1, 4),
('hiking', '徒步', '🥾', 50.00, '山地徒步或远足', 1, 5),
('rope_jumping', '跳绳', '🪢', 70.00, '跳绳运动', 1, 6),
('yoga', '瑜伽', '🧘', 25.00, '瑜伽练习', 1, 7),
('basketball', '篮球', '🏀', 55.00, '篮球运动', 1, 8),
('football', '足球', '⚽', 65.00, '足球运动', 1, 9),
('badminton', '羽毛球', '🏸', 45.00, '羽毛球运动', 1, 10);

-- ============================================
-- 创建统计视图
-- ============================================

-- 周运动统计视图
CREATE OR REPLACE VIEW `v_weekly_stats` AS
SELECT 
    openid,
    YEARWEEK(start_time, 1) AS year_week,
    COUNT(*) AS sport_count,
    SUM(duration) / 60 AS total_minutes,
    SUM(distance) AS total_distance,
    SUM(calories) AS total_calories,
    AVG(avg_speed) AS avg_speed
FROM sport_records
WHERE status = 2 AND is_valid = 1
GROUP BY openid, YEARWEEK(start_time, 1);

-- 月运动统计视图
CREATE OR REPLACE VIEW `v_monthly_stats` AS
SELECT 
    openid,
    DATE_FORMAT(start_time, '%Y-%m') AS year_month,
    COUNT(*) AS sport_count,
    SUM(duration) / 60 AS total_minutes,
    SUM(distance) AS total_distance,
    SUM(calories) AS total_calories,
    AVG(avg_speed) AS avg_speed
FROM sport_records
WHERE status = 2 AND is_valid = 1
GROUP BY openid, DATE_FORMAT(start_time, '%Y-%m');

-- 运动类型分布视图
CREATE OR REPLACE VIEW `v_sport_type_dist` AS
SELECT 
    openid,
    sport_type,
    sport_name,
    COUNT(*) AS sport_count,
    SUM(duration) / 60 AS total_minutes,
    SUM(distance) AS total_distance,
    SUM(calories) AS total_calories
FROM sport_records
WHERE status = 2 AND is_valid = 1
GROUP BY openid, sport_type, sport_name;

-- ============================================
-- 存储过程：每日数据统计
-- ============================================
DELIMITER //

CREATE PROCEDURE `sp_daily_user_stats`(IN p_openid VARCHAR(64))
BEGIN
    DECLARE v_date DATE;
    SET v_date = CURDATE();
    
    -- 更新用户累计数据
    UPDATE users SET
        total_sports = (
            SELECT COUNT(*) FROM sport_records 
            WHERE openid = p_openid AND status = 2 AND is_valid = 1
        ),
        total_duration = (
            SELECT COALESCE(SUM(duration), 0) / 60 FROM sport_records 
            WHERE openid = p_openid AND status = 2 AND is_valid = 1
        ),
        total_distance = (
            SELECT COALESCE(SUM(distance), 0) FROM sport_records 
            WHERE openid = p_openid AND status = 2 AND is_valid = 1
        ),
        total_calories = (
            SELECT COALESCE(SUM(calories), 0) FROM sport_records 
            WHERE openid = p_openid AND status = 2 AND is_valid = 1
        )
    WHERE openid = p_openid;
END //

DELIMITER ;

-- ============================================
-- 索引优化建议
-- ============================================
-- 1. 对于高频查询 (openid + 时间范围)，确保 idx_openid_time 索引存在
-- 2. 对于报表查询，考虑创建覆盖索引: (openid, start_time, sport_type, distance, calories)
-- 3. 定期执行 OPTIMIZE TABLE 整理表碎片
-- 4. 对于历史数据归档，可以按月分区表
