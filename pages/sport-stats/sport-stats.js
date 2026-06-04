// pages/sport-stats/sport-stats.js
import * as echarts from '../../components/ec-canvas/ec-canvas';
const db = require('../../utils/db.js');

Page({
  data: {
    currentTab: 'week',
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    
    // 统计摘要
    summary: {
      totalDistance: '0.00',
      totalDuration: '0',
      totalCalories: '0',
      sportCount: '0'
    },
    
    // 日历数据
    currentMonthName: '',
    calendarDays: [],
    
    // 类型分布数据
    typeData: [],
    
    // 最近记录
    recentRecords: [],
    
    // 图表配置
    trendChartEc: null,
    longTrendChartEc: null,
    pieChartEc: null,
    compareChartEc: null,
    
    trendRange: ['近7天', '近30天', '近3个月', '近一年'],
    trendRangeIndex: 0
  },

  onLoad() {
    this.initCharts();
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  // 初始化图表
  initCharts() {
    // 延迟初始化，确保组件已渲染
    setTimeout(() => {
      this.initTrendChart();
      this.initPieChart();
      this.initCompareChart();
    }, 100);
  },

  // 初始化趋势图
  initTrendChart() {
    this.setData({
      trendChartEc: {
        onInit: (canvas, width, height, dpr) => {
          const chart = echarts.init(canvas, null, {
            width, height, dpr
          });
          canvas.setChart(chart);
          
          const option = {
            tooltip: {
              trigger: 'axis',
              axisPointer: { type: 'cross' }
            },
            legend: {
              data: ['距离(km)', '消耗(kcal)'],
              bottom: 0
            },
            grid: {
              left: '3%',
              right: '4%',
              bottom: '15%',
              top: '10%',
              containLabel: true
            },
            xAxis: {
              type: 'category',
              data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
              axisLine: { lineStyle: { color: '#ddd' } }
            },
            yAxis: [
              {
                type: 'value',
                name: '距离',
                axisLine: { lineStyle: { color: '#07c160' } }
              },
              {
                type: 'value',
                name: '消耗',
                axisLine: { lineStyle: { color: '#ff9500' } }
              }
            ],
            series: [
              {
                name: '距离(km)',
                type: 'bar',
                data: [0, 0, 0, 0, 0, 0, 0],
                itemStyle: { color: '#07c160' },
                barWidth: '40%'
              },
              {
                name: '消耗(kcal)',
                type: 'line',
                yAxisIndex: 1,
                data: [0, 0, 0, 0, 0, 0, 0],
                itemStyle: { color: '#ff9500' },
                smooth: true
              }
            ]
          };
          
          chart.setOption(option);
          this.trendChart = chart;
          return chart;
        }
      }
    });
  },

  // 初始化饼图
  initPieChart() {
    this.setData({
      pieChartEc: {
        onInit: (canvas, width, height, dpr) => {
          const chart = echarts.init(canvas, null, {
            width, height, dpr
          });
          canvas.setChart(chart);
          
          const option = {
            tooltip: {
              trigger: 'item',
              formatter: '{b}: {c}次 ({d}%)'
            },
            series: [{
              type: 'pie',
              radius: ['40%', '70%'],
              avoidLabelOverlap: false,
              label: { show: false },
              emphasis: {
                label: { show: true, fontSize: 14, fontWeight: 'bold' }
              },
              data: []
            }]
          };
          
          chart.setOption(option);
          this.pieChart = chart;
          return chart;
        }
      }
    });
  },

  // 初始化对比图
  initCompareChart() {
    this.setData({
      compareChartEc: {
        onInit: (canvas, width, height, dpr) => {
          const chart = echarts.init(canvas, null, {
            width, height, dpr
          });
          canvas.setChart(chart);
          
          const option = {
            tooltip: {
              trigger: 'axis'
            },
            legend: {
              data: ['本周', '上周'],
              bottom: 0
            },
            radar: {
              indicator: [
                { name: '距离', max: 50 },
                { name: '时长', max: 300 },
                { name: '消耗', max: 3000 },
                { name: '次数', max: 20 }
              ],
              center: ['50%', '50%'],
              radius: '65%'
            },
            series: [{
              type: 'radar',
              data: [
                { name: '本周', value: [0, 0, 0, 0] },
                { name: '上周', value: [0, 0, 0, 0] }
              ]
            }]
          };
          
          chart.setOption(option);
          this.compareChart = chart;
          return chart;
        }
      }
    });
  },

  // 加载数据
  async loadData() {
    wx.showLoading({ title: '加载中...' });
    
    try {
      // 从云数据库加载运动记录
      const result = await db.queryRecords(db.COLLECTIONS.SPORT, {}, 200);
      
      let records = [];
      if (result.success && result.data && result.data.length > 0) {
        records = result.data;
        
        // 同步到本地存储
        try {
          wx.setStorageSync('sport_history', records);
        } catch (e) {
          console.error('本地存储同步失败', e);
        }
      } else {
        // 从本地存储加载作为备用
        records = wx.getStorageSync('sport_history') || [];
      }
      
      // 计算统计摘要
      this.calculateSummary(records);
      
      // 计算本周数据
      this.calculateWeekData(records);
      
      // 计算本月数据
      this.calculateMonthData(records);
      
      // 计算类型分布
      this.calculateTypeData(records);
      
      // 设置最近记录
      this.setData({
        recentRecords: records.slice(0, 10).map(r => ({
          ...r,
          dateStr: this.formatDate(r.createTime)
        }))
      });
    } catch (e) {
      console.error('加载运动统计数据失败', e);
      // 从本地存储加载
      const records = wx.getStorageSync('sport_history') || [];
      this.calculateSummary(records);
      this.calculateWeekData(records);
      this.calculateMonthData(records);
      this.calculateTypeData(records);
      this.setData({
        recentRecords: records.slice(0, 10).map(r => ({
          ...r,
          dateStr: this.formatDate(r.createTime)
        }))
      });
    }
    
    wx.hideLoading();
  },

  // 计算统计摘要
  calculateSummary(records) {
    const now = new Date();
    const startOfWeek = this.getStartOfWeek(now);
    
    const weekRecords = records.filter(r => r.createTime >= startOfWeek.getTime());
    
    const totalDistance = weekRecords.reduce((sum, r) => sum + (r.distance || 0), 0);
    const totalDuration = weekRecords.reduce((sum, r) => sum + (r.durationSeconds || 0), 0);
    const totalCalories = weekRecords.reduce((sum, r) => sum + (r.calories || 0), 0);
    
    this.setData({
      summary: {
        totalDistance: totalDistance.toFixed(2),
        totalDuration: Math.round(totalDuration / 60).toString(),
        totalCalories: totalCalories.toString(),
        sportCount: weekRecords.length.toString()
      }
    });
  },

  // 计算本周数据
  calculateWeekData(records) {
    const now = new Date();
    const startOfWeek = this.getStartOfWeek(now);
    
    // 每天的数据
    const dailyData = [[], [], [], [], [], [], []];
    
    records.forEach(r => {
      const date = new Date(r.createTime);
      if (date >= startOfWeek) {
        const dayOfWeek = date.getDay();
        const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 周一=0
        dailyData[index].push(r);
      }
    });
    
    // 更新图表
    if (this.trendChart) {
      const distanceData = dailyData.map(d => d.reduce((sum, r) => sum + (r.distance || 0), 0));
      const caloriesData = dailyData.map(d => d.reduce((sum, r) => sum + (r.calories || 0), 0));
      
      this.trendChart.setOption({
        series: [
          { data: distanceData },
          { data: caloriesData }
        ]
      });
    }
    
    if (this.compareChart) {
      // 上周数据
      const lastWeekStart = new Date(startOfWeek);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      
      let lastWeekTotal = { distance: 0, duration: 0, calories: 0, count: 0 };
      let thisWeekTotal = { distance: 0, duration: 0, calories: 0, count: 0 };
      
      records.forEach(r => {
        const date = new Date(r.createTime);
        if (date >= startOfWeek) {
          thisWeekTotal.distance += r.distance || 0;
          thisWeekTotal.duration += (r.durationSeconds || 0) / 60;
          thisWeekTotal.calories += r.calories || 0;
          thisWeekTotal.count++;
        } else if (date >= lastWeekStart) {
          lastWeekTotal.distance += r.distance || 0;
          lastWeekTotal.duration += (r.durationSeconds || 0) / 60;
          lastWeekTotal.calories += r.calories || 0;
          lastWeekTotal.count++;
        }
      });
      
      this.compareChart.setOption({
        series: [{
          data: [
            { name: '本周', value: [
              Math.min(thisWeekTotal.distance, 50),
              Math.min(thisWeekTotal.duration, 300),
              Math.min(thisWeekTotal.calories, 3000),
              Math.min(thisWeekTotal.count, 20)
            ]},
            { name: '上周', value: [
              Math.min(lastWeekTotal.distance, 50),
              Math.min(lastWeekTotal.duration, 300),
              Math.min(lastWeekTotal.calories, 3000),
              Math.min(lastWeekTotal.count, 20)
            ]}
          ]
        }]
      });
    }
  },

  // 计算本月数据
  calculateMonthData(records) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const monthName = now.toLocaleString('zh-CN', { month: 'long' });
    
    // 计算日历数据
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const calendarDays = [];
    
    // 填充空白
    for (let i = 0; i < startDayOfWeek; i++) {
      calendarDays.push({ day: '', hasSport: false });
    }
    
    // 填充日期
    const monthRecords = records.filter(r => {
      const d = new Date(r.createTime);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    
    const sportDates = new Set(monthRecords.map(r => new Date(r.createTime).getDate()));
    
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push({
        day,
        hasSport: sportDates.has(day)
      });
    }
    
    this.setData({
      currentMonthName: monthName,
      calendarDays
    });
  },

  // 计算类型分布
  calculateTypeData(records) {
    const typeMap = {};
    
    records.forEach(r => {
      const type = r.sportType || 'other';
      if (!typeMap[type]) {
        typeMap[type] = {
          name: r.sportName || '其他',
          value: 0,
          color: this.getRandomColor()
        };
      }
      typeMap[type].value++;
    });
    
    const typeData = Object.values(typeMap).sort((a, b) => b.value - a.value);
    
    this.setData({ typeData });
    
    if (this.pieChart) {
      this.pieChart.setOption({
        series: [{
          data: typeData.map(t => ({
            name: t.name,
            value: t.value,
            itemStyle: { color: t.color }
          }))
        }]
      });
    }
  },

  // 获取随机颜色
  getRandomColor() {
    const colors = ['#07c160', '#ff9500', '#5856d6', '#ff3b30', '#5ac8fa', '#ffcc00'];
    return colors[Math.floor(Math.random() * colors.length)];
  },

  // 获取本周开始日期
  getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  // 格式化日期
  formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // 切换Tab
  onSwitchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
    
    // 重新初始化图表
    if (tab === 'trend') {
      this.initLongTrendChart();
    }
  },

  // 初始化长期趋势图
  initLongTrendChart() {
    this.setData({
      longTrendChartEc: {
        onInit: (canvas, width, height, dpr) => {
          const chart = echarts.init(canvas, null, {
            width, height, dpr
          });
          canvas.setChart(chart);
          
          const option = {
            tooltip: { trigger: 'axis' },
            grid: {
              left: '3%',
              right: '4%',
              bottom: '10%',
              top: '10%',
              containLabel: true
            },
            xAxis: { type: 'category', data: [] },
            yAxis: { type: 'value', name: '公里' },
            series: [{
              type: 'line',
              data: [],
              areaStyle: { color: 'rgba(7, 193, 96, 0.3)' },
              itemStyle: { color: '#07c160' },
              smooth: true
            }]
          };
          
          chart.setOption(option);
          this.longTrendChart = chart;
          return chart;
        }
      }
    });
    
    // 加载长期数据
    this.loadLongTrendData();
  },

  // 加载长期趋势数据
  loadLongTrendData() {
    const records = wx.getStorageSync('sport_history') || [];
    const days = this.data.trendRangeIndex === 0 ? 7 : 
                 this.data.trendRangeIndex === 1 ? 30 : 
                 this.data.trendRangeIndex === 2 ? 90 : 365;
    
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    // 按日期分组
    const dateMap = {};
    
    records.forEach(r => {
      const date = new Date(r.createTime);
      if (date >= startDate) {
        const dateKey = date.toLocaleDateString();
        if (!dateMap[dateKey]) {
          dateMap[dateKey] = 0;
        }
        dateMap[dateKey] += r.distance || 0;
      }
    });
    
    // 转换为数组
    const dates = Object.keys(dateMap).sort();
    const distances = dates.map(d => parseFloat(dateMap[d].toFixed(2)));
    
    if (this.longTrendChart) {
      this.longTrendChart.setOption({
        xAxis: { data: dates.map(d => d.slice(5)) },
        series: [{ data: distances }]
      });
    }
  },

  // 趋势范围变化
  onTrendRangeChange(e) {
    this.setData({
      trendRangeIndex: e.detail.value
    });
    this.loadLongTrendData();
  }
});
