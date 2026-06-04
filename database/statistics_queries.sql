-- ============================================
-- 运动数据统计查询脚本
-- 支持：周/月/季度/年统计
-- ============================================

-- ============================================
-- 1. 周运动统计
-- ============================================

-- 本周运动汇总（按天分组）
SELECT 
    DATE(start_time) AS sport_date,
    DAYNAME(start_time) AS day_name,
    COUNT(*) AS sport_count,
    ROUND(SUM(duration) / 60, 1) AS total_minutes,
    ROUND(SUM(distance), 2) AS total_km,
    SUM(calories) AS total_calories,
    ROUND(AVG(avg_speed), 2) AS avg_speed
FROM sport_records
WHERE openid = '当前用户openid'
    AND start_time >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
    AND start_time < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)
    AND status = 2
    AND is_valid = 1
GROUP BY DATE(start_time)
ORDER BY sport_date;

-- 本周 vs 上周对比
SELECT 
    '本周' AS period,
    COUNT(*) AS sport_count,
    ROUND(SUM(duration) / 60, 1) AS total_minutes,
    ROUND(SUM(distance), 2) AS total_km,
    SUM(calories) AS total_calories
FROM sport_records
WHERE openid = '当前用户openid'
    AND start_time >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
    AND status = 2 AND is_valid = 1
UNION ALL
SELECT 
    '上周' AS period,
    COUNT(*) AS sport_count,
    ROUND(SUM(duration) / 60, 1) AS total_minutes,
    ROUND(SUM(distance), 2) AS total_km,
    SUM(calories) AS total_calories
FROM sport_records
WHERE openid = '当前用户openid'
    AND start_time >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) + 7 DAY)
    AND start_time < DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
    AND status = 2 AND is_valid = 1;

-- ============================================
-- 2. 月运动统计
-- ============================================

-- 本月每日运动趋势
SELECT 
    DATE(start_time) AS sport_date,
    COUNT(*) AS sport_count,
    ROUND(SUM(duration) / 60, 1) AS total_minutes,
    ROUND(SUM(distance), 2) AS total_km,
    SUM(calories) AS total_calories
FROM sport_records
WHERE openid = '当前用户openid'
    AND YEAR(start_time) = YEAR(CURDATE())
    AND MONTH(start_time) = MONTH(CURDATE())
    AND status = 2 AND is_valid = 1
GROUP BY DATE(start_time)
ORDER BY sport_date;

-- 本月各周统计
SELECT 
    CONCAT(YEAR(start_time), '-第', WEEK(start_time, 1), '周') AS week_label,
    WEEK(start_time, 1) AS week_num,
    COUNT(*) AS sport_count,
    ROUND(SUM(duration) / 60, 1) AS total_minutes,
    ROUND(SUM(distance), 2) AS total_km,
    SUM(calories) AS total_calories
FROM sport_records
WHERE openid = '当前用户openid'
    AND YEAR(start_time) = YEAR(CURDATE())
    AND MONTH(start_time) = MONTH(CURDATE())
    AND status = 2 AND is_valid = 1
GROUP BY WEEK(start_time, 1)
ORDER BY week_num;

-- 连续运动天数统计
SELECT 
    COUNT(DISTINCT DATE(start_time)) AS active_days,
    SUM(CASE WHEN DAYOFWEEK(start_time) = 2 THEN 1 ELSE 0 END) AS monday_count,
    SUM(CASE WHEN DAYOFWEEK(start_time) = 3 THEN 1 ELSE 0 END) AS tuesday_count,
    SUM(CASE WHEN DAYOFWEEK(start_time) = 4 THEN 1 ELSE 0 END) AS wednesday_count,
    SUM(CASE WHEN DAYOFWEEK(start_time) = 5 THEN 1 ELSE 0 END) AS thursday_count,
    SUM(CASE WHEN DAYOFWEEK(start_time) = 6 THEN 1 ELSE 0 END) AS friday_count,
    SUM(CASE WHEN DAYOFWEEK(start_time) = 7 THEN 1 ELSE 0 END) AS saturday_count,
    SUM(CASE WHEN DAYOFWEEK(start_time) = 1 THEN 1 ELSE 0 END) AS sunday_count
FROM sport_records
WHERE openid = '当前用户openid'
    AND YEAR(start_time) = YEAR(CURDATE())
    AND MONTH(start_time) = MONTH(CURDATE())
    AND status = 2 AND is_valid = 1;

-- ============================================
-- 3. 季度统计
-- ============================================

-- 按季度汇总
SELECT 
    QUARTER(start_time) AS quarter_num,
    CASE QUARTER(start_time)
        WHEN 1 THEN 'Q1 (1-3月)'
        WHEN 2 THEN 'Q2 (4-6月)'
        WHEN 3 THEN 'Q3 (7-9月)'
        WHEN 4 THEN 'Q4 (10-12月)'
    END AS quarter_label,
    COUNT(*) AS sport_count,
    ROUND(SUM(duration) / 3600, 2) AS total_hours,
    ROUND(SUM(distance), 2) AS total_km,
    SUM(calories) AS total_calories,
    ROUND(AVG(avg_speed), 2) AS avg_speed
FROM sport_records
WHERE openid = '当前用户openid'
    AND YEAR(start_time) = YEAR(CURDATE())
    AND status = 2 AND is_valid = 1
GROUP BY QUARTER(start_time)
ORDER BY quarter_num;

-- ============================================
-- 4. 年度统计
-- ============================================

-- 按月汇总全年数据
SELECT 
    MONTH(start_time) AS month_num,
    MONTHNAME(start_time) AS month_name,
    COUNT(*) AS sport_count,
    ROUND(SUM(duration) / 60, 1) AS total_minutes,
    ROUND(SUM(distance), 2) AS total_km,
    SUM(calories) AS total_calories,
    ROUND(AVG(avg_speed), 2) AS avg_speed,
    ROUND(MAX(distance), 2) AS max_single_distance
FROM sport_records
WHERE openid = '当前用户openid'
    AND YEAR(start_time) = YEAR(CURDATE())
    AND status = 2 AND is_valid = 1
GROUP BY MONTH(start_time)
ORDER BY month_num;

-- ============================================
-- 5. 运动类型分析
-- ============================================

-- 运动类型分布（饼图数据）
SELECT 
    sport_type,
    sport_name,
    COUNT(*) AS count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sport_records WHERE openid = '当前用户openid' AND status = 2 AND is_valid = 1), 1) AS percentage,
    ROUND(SUM(distance), 2) AS total_km,
    SUM(calories) AS total_calories,
    ROUND(SUM(duration) / 60, 1) AS total_minutes,
    ROUND(AVG(avg_speed), 2) AS avg_speed
FROM sport_records
WHERE openid = '当前用户openid'
    AND YEAR(start_time) = YEAR(CURDATE())
    AND status = 2 AND is_valid = 1
GROUP BY sport_type, sport_name
ORDER BY count DESC;

-- 最常进行的运动TOP5
SELECT 
    sport_type,
    sport_name,
    COUNT(*) AS times,
    ROUND(SUM(duration) / 60, 1) AS total_minutes,
    ROUND(SUM(distance), 2) AS total_km,
    SUM(calories) AS total_calories
FROM sport_records
WHERE openid = '当前用户openid'
    AND status = 2 AND is_valid = 1
GROUP BY sport_type, sport_name
ORDER BY times DESC
LIMIT 5;

-- ============================================
-- 6. 效率分析
-- ============================================

-- 每次运动的平均效率
SELECT 
    sport_type,
    sport_name,
    COUNT(*) AS total_sports,
    ROUND(AVG(duration) / 60, 1) AS avg_duration_min,
    ROUND(AVG(distance), 2) AS avg_distance_km,
    AVG(calories) AS avg_calories,
    ROUND(AVG(calories / NULLIF(distance, 0)), 1) AS avg_calories_per_km
FROM sport_records
WHERE openid = '当前用户openid'
    AND status = 2 AND is_valid = 1
    AND distance > 0
GROUP BY sport_type, sport_name
ORDER BY avg_calories_per_km DESC;

-- 运动时间段分析
SELECT 
    CASE 
        WHEN HOUR(start_time) BETWEEN 5 AND 8 THEN '清晨 (5-8点)'
        WHEN HOUR(start_time) BETWEEN 8 AND 12 THEN '上午 (8-12点)'
        WHEN HOUR(start_time) BETWEEN 12 AND 14 THEN '中午 (12-14点)'
        WHEN HOUR(start_time) BETWEEN 14 AND 18 THEN '下午 (14-18点)'
        WHEN HOUR(start_time) BETWEEN 18 AND 21 THEN '傍晚 (18-21点)'
        ELSE '夜间 (21-5点)'
    END AS time_period,
    COUNT(*) AS sport_count,
    ROUND(SUM(duration) / 60, 1) AS total_minutes,
    ROUND(SUM(distance), 2) AS total_km,
    SUM(calories) AS total_calories
FROM sport_records
WHERE openid = '当前用户openid'
    AND YEAR(start_time) = YEAR(CURDATE())
    AND status = 2 AND is_valid = 1
GROUP BY time_period
ORDER BY sport_count DESC;

-- ============================================
-- 7. 目标完成率统计
-- ============================================

-- 每日目标完成情况
SELECT 
    DATE(start_time) AS sport_date,
    CASE 
        WHEN SUM(calories) >= u.target_calories THEN '✅ 完成'
        WHEN SUM(calories) >= u.target_calories * 0.5 THEN '⚠️ 部分完成'
        ELSE '❌ 未达标'
    END AS target_status,
    SUM(calories) AS calories_achieved,
    u.target_calories,
    ROUND(SUM(calories) / u.target_calories * 100, 1) AS achievement_rate
FROM sport_records r
CROSS JOIN users u ON r.openid = u.openid
WHERE r.openid = '当前用户openid'
    AND r.start_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    AND r.status = 2 AND r.is_valid = 1
GROUP BY DATE(start_time), u.target_calories
ORDER BY sport_date DESC;

-- ============================================
-- 8. 排行榜数据（可扩展为好友排行榜）
-- ============================================

-- 用户排名（总消耗）
SELECT 
    ROW_NUMBER() OVER (ORDER BY SUM(calories) DESC) AS rank,
    openid,
    COUNT(*) AS sport_count,
    ROUND(SUM(distance), 2) AS total_km,
    SUM(calories) AS total_calories,
    ROUND(SUM(duration) / 60, 1) AS total_minutes
FROM sport_records
WHERE YEAR(start_time) = YEAR(CURDATE())
    AND status = 2 AND is_valid = 1
GROUP BY openid
ORDER BY total_calories DESC
LIMIT 100;

-- ============================================
-- 9. 异常数据检测
-- ============================================

-- 距离异常（超过50km/天需审核）
SELECT 
    id, openid, sport_type, start_time, distance, duration, calories, avg_speed
FROM sport_records
WHERE distance > 50
    OR (distance > 0 AND duration > 0 AND distance / (duration / 3600) > 30)  -- 速度超过30km/h
    OR (distance > 0 AND calories > 0 AND calories / distance > 200)  -- 每公里消耗超过200kcal
ORDER BY created_at DESC;

-- 时长异常（超过8小时）
SELECT 
    id, openid, sport_type, start_time, end_time, duration, distance, calories
FROM sport_records
WHERE duration > 28800  -- 8小时
ORDER BY created_at DESC;

-- ============================================
-- 10. 综合数据导出
-- ============================================

-- 年度运动总结
SELECT 
    COUNT(*) AS total_sports,
    ROUND(SUM(duration) / 3600, 1) AS total_hours,
    ROUND(SUM(distance), 2) AS total_km,
    SUM(calories) AS total_calories,
    ROUND(AVG(avg_speed), 2) AS overall_avg_speed,
    ROUND(MAX(distance), 2) AS longest_distance,
    MAX(duration) AS longest_duration,
    SUM(calories) AS total_calories,
    COUNT(DISTINCT DATE(start_time)) AS active_days
FROM sport_records
WHERE openid = '当前用户openid'
    AND YEAR(start_time) = YEAR(CURDATE())
    AND status = 2 AND is_valid = 1;
