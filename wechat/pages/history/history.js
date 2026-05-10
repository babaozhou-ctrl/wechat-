// pages/history/history.js
const db = require('../../utils/db.js');

Page({
  data: {
    // 时间选择
    viewMode: 'month', // day, week, month, year
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    currentWeek: 1,
    displayText: '',
    
    // 体重数据
    weightData: [],
    weightTrend: 0, // 趋势：增加或减少
    currentWeight: null,
    targetWeight: 60,
    
    // 运动数据
    sportData: [],
    totalSportMinutes: 0,
    totalCalories: 0,
    
    // 睡眠数据
    sleepData: [],
    avgSleepHours: 0,
    avgSleepQuality: 0,
    
    // 饮食数据
    dietData: [],
    avgCalories: 0,
    
    // 饮水数据
    waterData: [],
    avgWater: 0,
    
    // 步数数据
    stepsData: [],
    avgSteps: 0,
    
    // UI状态
    activeTab: 'weight', // weight, sport, sleep, diet, water, steps
    isLoading: false,
    hasData: false
  },

  onLoad() {
    this.initDate();
    this.loadAllData();
  },

  onShow() {
    this.loadAllData();
  },

  // 初始化日期显示
  initDate() {
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
      currentWeek: this.getWeekNumber(now)
    });
    this.updateDisplayText();
  },

  // 获取一年中的第几周
  getWeekNumber(date) {
    const firstDay = new Date(date.getFullYear(), 0, 1);
    const pastDays = (date - firstDay) / 86400000;
    return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
  },

  // 更新时间显示文本
  updateDisplayText() {
    const { viewMode, currentYear, currentMonth, currentWeek } = this.data;
    let text = '';
    
    switch (viewMode) {
      case 'day':
        text = `${currentYear}年${currentMonth}月`;
        break;
      case 'week':
        text = `${currentYear}年第${currentWeek}周`;
        break;
      case 'month':
        text = `${currentYear}年${currentMonth}月`;
        break;
      case 'year':
        text = `${currentYear}年`;
        break;
    }
    
    this.setData({ displayText: text });
  },

  // 切换时间维度
  onViewModeChange(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ viewMode: mode }, () => {
      this.updateDisplayText();
      this.loadAllData();
    });
  },

  // 切换到上一个时间周期
  onPrev() {
    const { viewMode, currentYear, currentMonth, currentWeek } = this.data;
    let newYear = currentYear, newMonth = currentMonth, newWeek = currentWeek;
    
    switch (viewMode) {
      case 'day':
      case 'month':
        if (currentMonth === 1) {
          newYear = currentYear - 1;
          newMonth = 12;
        } else {
          newMonth = currentMonth - 1;
        }
        break;
      case 'week':
        if (currentWeek === 1) {
          newYear = currentYear - 1;
          newWeek = 52;
        } else {
          newWeek = currentWeek - 1;
        }
        break;
      case 'year':
        newYear = currentYear - 1;
        break;
    }
    
    this.setData({
      currentYear: newYear,
      currentMonth: newMonth,
      currentWeek: newWeek
    }, () => {
      this.updateDisplayText();
      this.loadAllData();
    });
  },

  // 切换到下一个时间周期
  onNext() {
    const { viewMode, currentYear, currentMonth, currentWeek } = this.data;
    let newYear = currentYear, newMonth = currentMonth, newWeek = currentWeek;
    
    switch (viewMode) {
      case 'day':
      case 'month':
        if (currentMonth === 12) {
          newYear = currentYear + 1;
          newMonth = 1;
        } else {
          newMonth = currentMonth + 1;
        }
        break;
      case 'week':
        if (currentWeek === 52) {
          newYear = currentYear + 1;
          newWeek = 1;
        } else {
          newWeek = currentWeek + 1;
        }
        break;
      case 'year':
        newYear = currentYear + 1;
        break;
    }
    
    this.setData({
      currentYear: newYear,
      currentMonth: newMonth,
      currentWeek: newWeek
    }, () => {
      this.updateDisplayText();
      this.loadAllData();
    });
  },

  // 回到今天
  onGoToday() {
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
      currentWeek: this.getWeekNumber(now)
    }, () => {
      this.updateDisplayText();
      this.loadAllData();
    });
  },

  // 切换Tab
  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  // 加载所有数据
  async loadAllData() {
    this.setData({ isLoading: true });
    
    await Promise.all([
      this.loadWeightData(),
      this.loadSportData(),
      this.loadSleepData(),
      this.loadDietData(),
      this.loadWaterData(),
      this.loadStepsData()
    ]);
    
    this.setData({ isLoading: false });
  },

  // 获取日期范围内的数据
  getDateRange() {
    const { viewMode, currentYear, currentMonth, currentWeek } = this.data;
    const dates = [];
    
    switch (viewMode) {
      case 'day':
        // 当月所有天
        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
          dates.push(`${currentYear}-${currentMonth.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`);
        }
        break;
      case 'week':
        // 一周的日期
        const firstDayOfYear = new Date(currentYear, 0, 1);
        const daysToFirstWeek = (currentWeek - 1) * 7;
        const firstDayOfWeek = new Date(currentYear, 0, 1 + daysToFirstWeek);
        for (let i = 0; i < 7; i++) {
          const d = new Date(firstDayOfWeek);
          d.setDate(firstDayOfWeek.getDate() + i);
          dates.push(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`);
        }
        break;
      case 'month':
        // 当月所有天
        const daysInM = new Date(currentYear, currentMonth, 0).getDate();
        for (let i = 1; i <= daysInM; i++) {
          dates.push(`${currentYear}-${currentMonth.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`);
        }
        break;
      case 'year':
        // 当年所有月
        for (let i = 1; i <= 12; i++) {
          dates.push(`${currentYear}-${i.toString().padStart(2, '0')}`);
        }
        break;
    }
    
    return dates;
  },

  // 加载体重数据
  async loadWeightData() {
    try {
      const dateRange = this.getDateRange();
      const localData = wx.getStorageSync('weight_records') || [];
      
      const filtered = localData.filter(item => {
        const itemDate = this.formatDate(item.date || item.recordDate);
        if (this.data.viewMode === 'year') {
          return itemDate.startsWith(item.date.substring(0, 7));
        }
        return dateRange.includes(itemDate);
      });
      
      // 计算趋势
      let trend = 0;
      if (filtered.length >= 2) {
        trend = filtered[filtered.length - 1].weight - filtered[0].weight;
      }
      
      this.setData({
        weightData: filtered.reverse(),
        weightTrend: trend.toFixed(1),
        currentWeight: filtered.length > 0 ? filtered[0].weight : null
      });
    } catch (e) {
      console.error('加载体重数据失败', e);
    }
  },

  // 加载运动数据
  async loadSportData() {
    try {
      const dateRange = this.getDateRange();
      const localData = wx.getStorageSync('sport_records') || [];
      
      const filtered = localData.filter(item => {
        const itemDate = this.formatDate(item.date || item.recordDate);
        if (this.data.viewMode === 'year') {
          return itemDate.startsWith(item.date.substring(0, 7));
        }
        return dateRange.includes(itemDate);
      });
      
      // 计算总时长和卡路里
      const totalMinutes = filtered.reduce((sum, item) => sum + (item.duration || 0), 0);
      const totalCal = filtered.reduce((sum, item) => sum + (item.calories || 0), 0);
      
      this.setData({
        sportData: filtered.reverse(),
        totalSportMinutes: totalMinutes,
        totalCalories: totalCal
      });
    } catch (e) {
      console.error('加载运动数据失败', e);
    }
  },

  // 加载睡眠数据
  async loadSleepData() {
    try {
      const dateRange = this.getDateRange();
      const localData = wx.getStorageSync('sleep_records') || [];
      
      const filtered = localData.filter(item => {
        const itemDate = this.formatDate(item.date || item.recordDate);
        if (this.data.viewMode === 'year') {
          return itemDate.startsWith(item.date.substring(0, 7));
        }
        return dateRange.includes(itemDate);
      });
      
      // 计算平均睡眠时长
      const avgHours = filtered.length > 0 
        ? (filtered.reduce((sum, item) => sum + (item.hours || 0), 0) / filtered.length).toFixed(1)
        : 0;
      
      const avgQuality = filtered.length > 0
        ? Math.round(filtered.reduce((sum, item) => sum + (item.quality || 3), 0) / filtered.length)
        : 0;
      
      this.setData({
        sleepData: filtered.reverse(),
        avgSleepHours: avgHours,
        avgSleepQuality: avgQuality
      });
    } catch (e) {
      console.error('加载睡眠数据失败', e);
    }
  },

  // 加载饮食数据
  async loadDietData() {
    try {
      const dateRange = this.getDateRange();
      const localData = wx.getStorageSync('diet_records') || [];
      
      const filtered = localData.filter(item => {
        const itemDate = this.formatDate(item.date);
        if (this.data.viewMode === 'year') {
          return itemDate.startsWith(item.date.substring(0, 7));
        }
        return dateRange.includes(itemDate);
      });
      
      // 按日期分组计算每日平均
      const avgCal = filtered.length > 0
        ? Math.round(filtered.reduce((sum, item) => sum + (item.calories || 0), 0) / dateRange.length)
        : 0;
      
      this.setData({
        dietData: filtered.reverse(),
        avgCalories: avgCal
      });
    } catch (e) {
      console.error('加载饮食数据失败', e);
    }
  },

  // 加载饮水数据
  async loadWaterData() {
    try {
      const dateRange = this.getDateRange();
      const localData = wx.getStorageSync('water_records') || [];
      
      const filtered = localData.filter(item => {
        const itemDate = this.formatDate(item.date);
        if (this.data.viewMode === 'year') {
          return itemDate.startsWith(item.date.substring(0, 7));
        }
        return dateRange.includes(itemDate);
      });
      
      const avgWater = filtered.length > 0
        ? Math.round(filtered.reduce((sum, item) => sum + (item.amount || 0), 0) / dateRange.length)
        : 0;
      
      this.setData({
        waterData: filtered.reverse(),
        avgWater: avgWater
      });
    } catch (e) {
      console.error('加载饮水数据失败', e);
    }
  },

  // 加载步数数据
  async loadStepsData() {
    try {
      const dateRange = this.getDateRange();
      const localData = wx.getStorageSync('steps_records') || [];
      
      const filtered = localData.filter(item => {
        const itemDate = this.formatDate(item.date);
        if (this.data.viewMode === 'year') {
          return itemDate.startsWith(item.date.substring(0, 7));
        }
        return dateRange.includes(itemDate);
      });
      
      const avgSteps = filtered.length > 0
        ? Math.round(filtered.reduce((sum, item) => sum + (item.steps || 0), 0) / filtered.length)
        : 0;
      
      this.setData({
        stepsData: filtered.reverse(),
        avgSteps: avgSteps
      });
    } catch (e) {
      console.error('加载步数数据失败', e);
    }
  },

  // 格式化日期
  formatDate(date) {
    if (!date) return '';
    if (date.includes('-')) return date;
    return date;
  },

  // 获取周几名称
  getWeekdayName(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
  },

  // 获取月份简称
  getMonthName(month) {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    return months[month - 1] || '';
  }
});
