# wechat - 微信健康追踪小程序

## 项目概述

一款基于微信小程序的健康追踪应用，集成饮食记录、运动管理、体重监测、饮水追踪、睡眠记录等核心功能。

## 技术栈

- **框架**: 微信小程序原生开发
- **后端**: 腾讯云开发 CloudBase + NoSQL 数据库
- **UI**: WXML + WXSS + JavaScript

## 项目结构

- .codebuddy/ - backend/ - components/ - database/ - i18n/ - pages/ - utils/ - - .eslintrc.js - app.js - app.json - app.miniapp.json - app.wxss - cloudbase.config.js - project.config.json - project.miniapp.json - project.private.config.json - README.md - sitemap.json - 项目文档.md

## 功能模块

1. **首页**: 今日健康数据总览（热量、步数、体重、饮水、睡眠）
2. **饮食管理**: 快速/自定义添加食物，营养分析
3. **体重监测**: 趋势追踪，BMI 计算
4. **饮水追踪**: 记录饮水量，设置提醒
5. **睡眠记录**: 时长记录，质量追踪
6. **步数管理**: 步数记录
7. **运动管理**: 多种运动类型，GPS 轨迹，卡路里计算
8. **个人中心**: 头像/昵称自定义，健康目标设置

## 数据规范

- 日期: YYYY-M-D
- 热量: 千卡 | 体重: kg | 饮水: ml | 睡眠: 小时

## 开发

使用微信开发者工具打开本项目根目录即可。

