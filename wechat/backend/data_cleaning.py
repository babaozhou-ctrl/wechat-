#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
运动数据清洗脚本
功能：
1. 处理异常值
2. 数据验证
3. 数据标准化
4. 生成清洗报告

使用方法:
    python data_cleaning.py --mode weekly  # 清洗本周数据
    python data_cleaning.py --mode full    # 全量清洗
    python data_cleaning.py --mode validate # 仅验证
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import argparse
import logging
from typing import Dict, List, Tuple, Optional

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('data_cleaning.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ============================================
# 配置参数
# ============================================
class Config:
    """数据清洗配置"""
    
    # 运动类型配置
    MAX_SPEED = {
        'running': 25.0,      # 跑步最大速度 km/h
        'walking': 10.0,      # 步行最大速度
        'cycling': 50.0,      # 骑行最大速度
        'swimming': 8.0,     # 游泳最大速度
        'hiking': 10.0,       # 徒步最大速度
        'rope_jumping': 15.0, # 跳绳最大速度
        'default': 30.0       # 默认最大速度
    }
    
    # 每种运动每公里消耗的标准范围 (kcal/kg)
    CALORIES_PER_KM_RANGE = {
        'running': (0.8, 1.5),
        'walking': (0.4, 0.8),
        'cycling': (0.3, 0.6),
        'swimming': (0.8, 1.5),
        'hiking': (0.5, 1.0),
        'rope_jumping': (0.8, 1.5),
        'default': (0.3, 2.0)
    }
    
    # 异常值阈值
    THRESHOLDS = {
        'max_distance': 50.0,           # 单次最大距离(km)
        'max_duration': 28800,          # 单次最大时长(秒) = 8小时
        'max_speed': 30.0,              # 单次最大速度(km/h)
        'max_calories': 5000,           # 单次最大消耗(kcal)
        'min_distance': 0.01,          # 单次最小距离(km)
        'min_duration': 60,             # 单次最小时长(秒)
        'max_calories_per_km': 200,     # 每公里最大消耗
        'min_calories_per_km': 10,     # 每公里最小消耗
    }
    
    # 允许的偏差范围
    DEVIATION = {
        'speed_outlier': 3,            # 速度标准差倍数
        'calories_outlier': 3,         # 消耗标准差倍数
    }


class DataValidator:
    """数据验证器"""
    
    def __init__(self, config: Config):
        self.config = config
        
    def validate_speed(self, row: pd.Series) -> Tuple[bool, str]:
        """验证速度是否合理"""
        if row['distance'] <= 0 or row['duration'] <= 0:
            return True, "跳过(无距离或时长)"
            
        # 计算实际速度
        actual_speed = row['distance'] / (row['duration'] / 3600)
        sport_type = row.get('sport_type', 'default')
        max_speed = self.config.MAX_SPEED.get(sport_type, self.config.MAX_SPEED['default'])
        
        if actual_speed > max_speed:
            return False, f"速度异常: {actual_speed:.1f}km/h > {max_speed}km/h"
            
        return True, "正常"
    
    def validate_calories(self, row: pd.Series) -> Tuple[bool, str]:
        """验证消耗是否合理"""
        sport_type = row.get('sport_type', 'default')
        range_tuple = self.config.CALORIES_PER_KM_RANGE.get(
            sport_type, 
            self.config.CALORIES_PER_KM_RANGE['default']
        )
        
        weight = row.get('weight', 70)  # 默认体重70kg
        min_cal = range_tuple[0] * row['distance'] * weight
        max_cal = range_tuple[1] * row['distance'] * weight
        
        if row['calories'] < min_cal * 0.5:  # 允许50%偏差
            return False, f"消耗偏低: {row['calories']} < {min_cal:.0f}"
        if row['calories'] > max_cal * 2:  # 允许100%偏差
            return False, f"消耗偏高: {row['calories']} > {max_cal:.0f}"
            
        return True, "正常"
    
    def validate_duration(self, row: pd.Series) -> Tuple[bool, str]:
        """验证时长是否合理"""
        if row['duration'] > self.config.THRESHOLDS['max_duration']:
            return False, f"时长异常: {row['duration']/3600:.1f}h > 8h"
        if row['duration'] < self.config.THRESHOLDS['min_duration']:
            return False, f"时长过短: {row['duration']}s < 60s"
        return True, "正常"
    
    def validate_distance(self, row: pd.Series) -> Tuple[bool, str]:
        """验证距离是否合理"""
        if row['distance'] > self.config.THRESHOLDS['max_distance']:
            return False, f"距离异常: {row['distance']:.1f}km > 50km"
        if row['distance'] < self.config.THRESHOLDS['min_distance']:
            return False, f"距离过短: {row['distance']}km < 0.01km"
        return True, "正常"
    
    def validate_completeness(self, row: pd.Series) -> Tuple[bool, str]:
        """验证数据完整性"""
        required_fields = ['openid', 'sport_type', 'start_time', 'duration', 'distance']
        missing = []
        for field in required_fields:
            if pd.isna(row.get(field)) or row.get(field) == '':
                missing.append(field)
        if missing:
            return False, f"缺失字段: {', '.join(missing)}"
        return True, "正常"


class DataCleaner:
    """数据清洗主类"""
    
    def __init__(self, config: Config = None):
        self.config = config or Config()
        self.validator = DataValidator(self.config)
        self.cleaning_report = {
            'total_records': 0,
            'valid_records': 0,
            'invalid_records': 0,
            'anomalies': [],
            'corrections': [],
            'removed_records': []
        }
    
    def load_data(self, file_path: str) -> pd.DataFrame:
        """加载数据"""
        logger.info(f"正在加载数据: {file_path}")
        
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        elif file_path.endswith('.json'):
            df = pd.read_json(file_path)
        elif file_path.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file_path)
        else:
            raise ValueError(f"不支持的文件格式: {file_path}")
        
        logger.info(f"加载了 {len(df)} 条记录")
        self.cleaning_report['total_records'] = len(df)
        return df
    
    def handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """处理缺失值"""
        logger.info("处理缺失值...")
        
        # 记录缺失值情况
        missing_before = df.isnull().sum()
        
        # 填充数值型缺失值
        numeric_cols = ['distance', 'duration', 'calories', 'avg_speed', 'max_speed']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = df[col].fillna(0)
        
        # 填充字符串型缺失值
        string_cols = ['sport_name', 'weather', 'remark']
        for col in string_cols:
            if col in df.columns:
                df[col] = df[col].fillna('')
        
        # 处理时间类型
        if 'start_time' in df.columns:
            df['start_time'] = pd.to_datetime(df['start_time'], errors='coerce')
        if 'end_time' in df.columns:
            df['end_time'] = pd.to_datetime(df['end_time'], errors='coerce')
        
        return df
    
    def remove_duplicates(self, df: pd.DataFrame) -> pd.DataFrame:
        """删除重复记录"""
        logger.info("删除重复记录...")
        
        before_count = len(df)
        df = df.drop_duplicates(subset=['openid', 'start_time', 'sport_type'], keep='first')
        removed = before_count - len(df)
        
        if removed > 0:
            logger.info(f"删除了 {removed} 条重复记录")
            self.cleaning_report['removed_records'].extend([
                {'type': 'duplicate', 'count': removed}
            ])
        
        return df
    
    def detect_outliers_zscore(self, df: pd.DataFrame, column: str, threshold: float = 3) -> pd.DataFrame:
        """使用Z-score方法检测异常值"""
        if column not in df.columns:
            return df
            
        mean = df[column].mean()
        std = df[column].std()
        
        if std == 0:
            return df
            
        z_scores = np.abs((df[column] - mean) / std)
        outliers = z_scores > threshold
        
        outlier_count = outliers.sum()
        if outlier_count > 0:
            logger.warning(f"检测到 {outlier_count} 个 {column} 异常值 (Z-score > {threshold})")
        
        return df
    
    def detect_outliers_iqr(self, df: pd.DataFrame, column: str, multiplier: float = 1.5) -> pd.DataFrame:
        """使用IQR方法检测异常值"""
        if column not in df.columns:
            return df
            
        Q1 = df[column].quantile(0.25)
        Q3 = df[column].quantile(0.75)
        IQR = Q3 - Q1
        
        lower_bound = Q1 - multiplier * IQR
        upper_bound = Q3 + multiplier * IQR
        
        outliers = (df[column] < lower_bound) | (df[column] > upper_bound)
        
        outlier_count = outliers.sum()
        if outlier_count > 0:
            logger.warning(f"检测到 {outlier_count} 个 {column} 异常值 (IQR方法)")
        
        return df
    
    def correct_invalid_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """修正无效数据"""
        logger.info("修正无效数据...")
        
        corrections = []
        
        # 修正速度计算
        if 'distance' in df.columns and 'duration' in df.columns:
            valid_mask = (df['distance'] > 0) & (df['duration'] > 0)
            corrected_speed = (df.loc[valid_mask, 'distance'] / 
                            (df.loc[valid_mask, 'duration'] / 3600))
            
            if 'avg_speed' in df.columns:
                diff = (corrected_speed - df.loc[valid_mask, 'avg_speed']).abs()
                mask = diff > 0.1  # 差异超过0.1
                if mask.sum() > 0:
                    corrections.append({
                        'field': 'avg_speed',
                        'count': mask.sum()
                    })
                    df.loc[valid_mask, 'avg_speed'] = corrected_speed
        
        # 修正卡路里（基于距离和运动类型）
        if 'calories' in df.columns and 'distance' in df.columns:
            default_calories_per_km = 60  # 默认跑步消耗
            for idx, row in df.iterrows():
                if row['distance'] > 0 and row['calories'] == 0:
                    sport_type = row.get('sport_type', 'running')
                    cal_rate = self.config.CALORIES_PER_KM_RANGE.get(
                        sport_type, 
                        self.config.CALORIES_PER_KM_RANGE['default']
                    )[0]
                    weight = row.get('weight', 70)
                    df.loc[idx, 'calories'] = row['distance'] * cal_rate * weight
        
        if corrections:
            self.cleaning_report['corrections'].extend(corrections)
            
        return df
    
    def flag_anomalies(self, df: pd.DataFrame) -> pd.DataFrame:
        """标记异常数据"""
        logger.info("标记异常数据...")
        
        df['is_valid'] = 1
        df['abnormal_reason'] = ''
        
        anomaly_records = []
        
        for idx, row in df.iterrows():
            reasons = []
            
            # 验证各项指标
            valid, msg = self.validator.validate_speed(row)
            if not valid:
                reasons.append(msg)
                
            valid, msg = self.validator.validate_calories(row)
            if not valid:
                reasons.append(msg)
                
            valid, msg = self.validator.validate_duration(row)
            if not valid:
                reasons.append(msg)
                
            valid, msg = self.validator.validate_distance(row)
            if not valid:
                reasons.append(msg)
            
            valid, msg = self.validator.validate_completeness(row)
            if not valid:
                reasons.append(msg)
            
            if reasons:
                df.loc[idx, 'is_valid'] = 0
                df.loc[idx, 'abnormal_reason'] = '; '.join(reasons)
                anomaly_records.append({
                    'id': idx,
                    'reasons': reasons
                })
        
        self.cleaning_report['anomalies'] = anomaly_records
        self.cleaning_report['invalid_records'] = len(anomaly_records)
        
        logger.info(f"标记了 {len(anomaly_records)} 条异常记录")
        
        return df
    
    def calculate_statistics(self, df: pd.DataFrame) -> Dict:
        """计算数据统计信息"""
        stats = {
            'total_records': len(df),
            'valid_records': len(df[df['is_valid'] == 1]),
            'invalid_records': len(df[df['is_valid'] == 0]),
            'total_distance': float(df['distance'].sum()),
            'total_duration': int(df['duration'].sum()),
            'total_calories': int(df['calories'].sum()),
            'avg_speed': float(df['avg_speed'].mean()) if 'avg_speed' in df.columns else 0,
            'sport_types': df['sport_type'].nunique() if 'sport_type' in df.columns else 0,
            'unique_users': df['openid'].nunique() if 'openid' in df.columns else 0
        }
        return stats
    
    def clean(self, df: pd.DataFrame, remove_invalid: bool = False) -> Tuple[pd.DataFrame, Dict]:
        """
        执行完整的数据清洗流程
        
        Args:
            df: 原始数据
            remove_invalid: 是否删除无效数据，False则标记
            
        Returns:
            清洗后的数据和统计报告
        """
        logger.info("开始数据清洗流程...")
        start_time = datetime.now()
        
        # 1. 处理缺失值
        df = self.handle_missing_values(df)
        
        # 2. 删除重复
        df = self.remove_duplicates(df)
        
        # 3. 修正无效数据
        df = self.correct_invalid_data(df)
        
        # 4. 异常值检测
        for col in ['distance', 'duration', 'calories', 'avg_speed']:
            if col in df.columns:
                df = self.detect_outliers_iqr(df, col)
        
        # 5. 标记异常
        df = self.flag_anomalies(df)
        
        # 6. 根据设置删除或保留无效数据
        if remove_invalid:
            before = len(df)
            df = df[df['is_valid'] == 1].copy()
            logger.info(f"删除了 {before - len(df)} 条无效记录")
        
        # 7. 计算统计信息
        stats = self.calculate_statistics(df)
        
        # 8. 添加清洗时间戳
        df['cleaned_at'] = datetime.now()
        
        elapsed = (datetime.now() - start_time).total_seconds()
        logger.info(f"数据清洗完成，耗时 {elapsed:.2f} 秒")
        
        self.cleaning_report['elapsed_seconds'] = elapsed
        self.cleaning_report['final_stats'] = stats
        
        return df, self.cleaning_report
    
    def save_report(self, report: Dict, output_path: str):
        """保存清洗报告"""
        report_path = output_path.replace('.csv', '_report.json')
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2, default=str)
        logger.info(f"清洗报告已保存: {report_path}")


class DataAnalyzer:
    """数据分析器"""
    
    def __init__(self):
        self.df = None
    
    def load_data(self, data: pd.DataFrame):
        """加载数据"""
        self.df = data
    
    def weekly_analysis(self) -> Dict:
        """周分析"""
        if self.df is None:
            return {}
        
        self.df['week'] = self.df['start_time'].dt.isocalendar().week
        self.df['year'] = self.df['start_time'].dt.year
        
        weekly = self.df.groupby(['year', 'week']).agg({
            'id': 'count',
            'distance': 'sum',
            'duration': 'sum',
            'calories': 'sum'
        }).reset_index()
        
        return weekly.to_dict('records')
    
    def monthly_analysis(self) -> Dict:
        """月分析"""
        if self.df is None:
            return {}
        
        self.df['month'] = self.df['start_time'].dt.month
        self.df['year'] = self.df['start_time'].dt.year
        
        monthly = self.df.groupby(['year', 'month']).agg({
            'id': 'count',
            'distance': 'sum',
            'duration': 'sum',
            'calories': 'sum'
        }).reset_index()
        
        return monthly.to_dict('records')
    
    def sport_type_analysis(self) -> Dict:
        """运动类型分析"""
        if self.df is None:
            return {}
        
        by_type = self.df.groupby('sport_type').agg({
            'id': 'count',
            'distance': ['sum', 'mean'],
            'duration': ['sum', 'mean'],
            'calories': ['sum', 'mean']
        }).reset_index()
        
        by_type.columns = ['sport_type', 'count', 'total_distance', 'avg_distance',
                          'total_duration', 'avg_duration', 'total_calories', 'avg_calories']
        
        return by_type.to_dict('records')
    
    def trend_analysis(self, period: str = 'week') -> List[Dict]:
        """趋势分析"""
        if self.df is None:
            return []
        
        if period == 'week':
            self.df['period'] = self.df['start_time'].dt.isocalendar().week
        elif period == 'month':
            self.df['period'] = self.df['start_time'].dt.to_period('M')
        else:
            self.df['period'] = self.df['start_time'].dt.to_period('Q')
        
        trend = self.df.groupby('period').agg({
            'distance': 'sum',
            'duration': 'sum',
            'calories': 'sum',
            'id': 'count'
        }).reset_index()
        
        return trend.to_dict('records')


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='运动数据清洗脚本')
    parser.add_argument('--mode', choices=['weekly', 'monthly', 'full', 'validate'],
                       default='weekly', help='清洗模式')
    parser.add_argument('--input', default='sport_records.csv', help='输入文件')
    parser.add_argument('--output', default='sport_records_cleaned.csv', help='输出文件')
    parser.add_argument('--remove', action='store_true', help='删除无效数据而非标记')
    
    args = parser.parse_args()
    
    # 初始化清洗器
    cleaner = DataCleaner()
    
    try:
        # 加载数据
        df = cleaner.load_data(args.input)
        
        # 根据模式筛选数据
        if args.mode == 'weekly':
            cutoff = datetime.now() - timedelta(days=7)
            df = df[pd.to_datetime(df['start_time']) >= cutoff]
            logger.info(f"筛选本周数据: {len(df)} 条")
        elif args.mode == 'monthly':
            cutoff = datetime.now() - timedelta(days=30)
            df = df[pd.to_datetime(df['start_time']) >= cutoff]
            logger.info(f"筛选本月数据: {len(df)} 条")
        
        # 执行清洗
        df_cleaned, report = cleaner.clean(df, remove_invalid=args.remove)
        
        # 保存结果
        if args.mode != 'validate':
            df_cleaned.to_csv(args.output, index=False)
            logger.info(f"清洗后数据已保存: {args.output}")
        
        # 保存报告
        cleaner.save_report(report, args.output)
        
        # 打印摘要
        print("\n" + "="*50)
        print("数据清洗报告摘要")
        print("="*50)
        print(f"总记录数: {report['total_records']}")
        print(f"有效记录: {report['valid_records']}")
        print(f"无效记录: {report['invalid_records']}")
        print(f"耗时: {report.get('elapsed_seconds', 0):.2f}秒")
        print("="*50)
        
    except Exception as e:
        logger.error(f"数据清洗失败: {str(e)}")
        raise


if __name__ == '__main__':
    main()
