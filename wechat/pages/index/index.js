// pages/index/index.js - iofit风格健康追踪应用

Page({
  data: {
    // 用户信息
    greeting: '早上好',
    currentDate: '',
    userNickname: '健康用户',
    userAvatar: '👤',
    
    // 健康数据
    todayCalories: 0,
    targetCalories: 2000,
    calorieProgress: 0,
    
    todaySteps: 0,
    targetSteps: 10000,
    stepsProgress: 0,
    
    currentWeight: '--',
    targetWeight: 65,
    weightChange: 0,
    weightChangeAbs: '--',
    
    todayWater: 0,
    targetWater: 2000,
    
    todaySleep: 0,
    targetSleep: 8,
    
    // 饮食记录
    currentMeal: 'breakfast',
    mealNameMap: {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐',
      snack: '加餐'
    },
    breakfastCal: 0,
    lunchCal: 0,
    dinnerCal: 0,
    snackCal: 0,
    currentMealItems: [],
    
    // 运动
    selectedSport: '',
    sportTypes: []
  },

  onLoad() {
    this.initDate();
    this.loadUserInfo();
    this.loadHealthData();
    this.loadSportTypes();
    this.loadDietData();
  },

  onShow() {
    this.loadUserInfo();
    this.loadHealthData();
    this.loadDietData();
  },

  // 加载用户信息
  loadUserInfo() {
    const profile = wx.getStorageSync('user_profile') || {};
    const userInfo = profile.userInfo || { nickname: '健康用户', avatar: '👤' };
    this.setData({
      userNickname: userInfo.nickname,
      userAvatar: userInfo.avatar
    });
  },

  // 初始化日期
  initDate() {
    const now = new Date();
    const hours = now.getHours();
    
    if (hours < 12) {
      this.setData({ greeting: '早上好' });
    } else if (hours < 18) {
      this.setData({ greeting: '下午好' });
    } else {
      this.setData({ greeting: '晚上好' });
    }
    
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekDay = weekDays[now.getDay()];
    
    this.setData({
      currentDate: `${month}月${day}日 ${weekDay}`
    });
  },

  // 加载健康数据
  loadHealthData() {
    // 加载体重数据
    const weightRecords = wx.getStorageSync('weight_records') || [];
    if (weightRecords.length > 0) {
      const latest = weightRecords[weightRecords.length - 1];
      const currentWeight = latest.weight;
      
      let weightChange = 0;
      if (weightRecords.length > 1) {
        const previous = weightRecords[weightRecords.length - 2];
        weightChange = currentWeight - previous.weight;
      }
      
      this.setData({
        currentWeight: currentWeight.toFixed(1),
        weightChange: weightChange,
        weightChangeAbs: Math.abs(weightChange).toFixed(1)
      });
    }
    
    // 加载饮水数据
    const waterRecords = wx.getStorageSync('water_records') || [];
    const today = this.getTodayKey();
    const todayWater = waterRecords[today] || 0;
    this.setData({ todayWater });
    
    // 计算卡路里
    this.calculateCalories();
    
    // 计算步数
    this.calculateSteps();
    
    // 计算睡眠
    this.calculateSleep();
  },

  // 获取今日日期key
  getTodayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  },

  // 计算今日摄入卡路里
  calculateCalories() {
    const dietRecords = wx.getStorageSync('diet_records') || [];
    const today = this.getTodayKey();
    const todayRecords = dietRecords.filter(r => r.date === today);
    
    let total = 0;
    let breakfast = 0, lunch = 0, dinner = 0, snack = 0;
    
    todayRecords.forEach(r => {
      total += r.calories || 0;
      if (r.meal === 'breakfast') breakfast += r.calories || 0;
      else if (r.meal === 'lunch') lunch += r.calories || 0;
      else if (r.meal === 'dinner') dinner += r.calories || 0;
      else if (r.meal === 'snack') snack += r.calories || 0;
    });
    
    const progress = Math.min((total / this.data.targetCalories) * 100, 100);
    
    this.setData({
      todayCalories: total,
      calorieProgress: progress,
      breakfastCal: breakfast,
      lunchCal: lunch,
      dinnerCal: dinner,
      snackCal: snack
    });
  },

  // 计算步数
  calculateSteps() {
    const stepRecords = wx.getStorageSync('step_records') || [];
    const today = this.getTodayKey();
    const todaySteps = stepRecords[today] || 0;
    const progress = Math.min((todaySteps / this.data.targetSteps) * 100, 100);
    
    this.setData({
      todaySteps: todaySteps.toLocaleString(),
      stepsProgress: progress
    });
  },

  // 计算睡眠
  calculateSleep() {
    const sleepRecords = wx.getStorageSync('sleep_records') || [];
    const today = this.getTodayKey();
    const todaySleep = sleepRecords[today] || 0;
    
    this.setData({ todaySleep });
  },

  // 加载运动类型
  loadSportTypes() {
    try {
      const customSports = wx.getStorageSync('custom_sports') || [];
      const defaultSports = [
        { key: 'running', name: '跑步', icon: '🏃', caloriesPerKm: 60 },
        { key: 'cycling', name: '骑行', icon: '🚴', caloriesPerKm: 40 },
        { key: 'walking', name: '健走', icon: '🚶', caloriesPerKm: 50 },
        { key: 'hiking', name: '徒步', icon: '🏔️', caloriesPerKm: 45 }
      ];
      
      const allSports = [...defaultSports, ...customSports];
      wx.setStorageSync('sport_types', allSports);
      
      this.setData({ 
        sportTypes: allSports,
        selectedSport: allSports[0]?.key || ''
      });
    } catch (e) {
      console.error('加载运动类型失败', e);
    }
  },

  // 加载饮食数据
  loadDietData() {
    this.calculateCalories();
    this.updateCurrentMealItems();
  },

  // 更新当前餐食项目
  updateCurrentMealItems() {
    const dietRecords = wx.getStorageSync('diet_records') || [];
    const today = this.getTodayKey();
    const items = dietRecords.filter(r => r.date === today && r.meal === this.data.currentMeal);
    
    this.setData({ currentMealItems: items });
  },

  // 选择餐食类型
  onSelectMeal(e) {
    const meal = e.currentTarget.dataset.meal;
    this.setData({ currentMeal: meal }, () => {
      this.updateCurrentMealItems();
    });
  },

  // 添加餐食
  onAddMeal() {
    wx.navigateTo({
      url: '/pages/diet-add/diet-add?meal=' + this.data.currentMeal
    });
  },

  // 快速记录饮食
  onQuickDiet() {
    this.onGoToDiet();
  },

  // 快速添加饮水
  onQuickWater() {
    wx.navigateTo({
      url: '/pages/water-add/water-add'
    });
  },

  // 快速记录体重
  onQuickWeight() {
    wx.navigateTo({
      url: '/pages/weight-add/weight-add'
    });
  },

  // 快速开始运动
  onQuickSport() {
    this.onStartSport();
  },

  // 跳转到饮食记录页
  onGoToDiet() {
    wx.navigateTo({
      url: '/pages/diet/diet'
    });
  },

  // 跳转到体重记录页
  onGoToWeight() {
    wx.navigateTo({
      url: '/pages/weight/weight'
    });
  },

  // 跳转到饮水记录页
  onGoToWater() {
    wx.navigateTo({
      url: '/pages/water/water'
    });
  },

  // 跳转到步数页
  onGoToSteps() {
    wx.navigateTo({
      url: '/pages/steps/steps'
    });
  },

  // 跳转到睡眠页
  onGoToSleep() {
    wx.navigateTo({
      url: '/pages/sleep/sleep'
    });
  },

  // 选择运动
  onSelectSport(e) {
    const sportType = e.currentTarget.dataset.type;
    this.setData({ selectedSport: sportType });
  },

  // 开始运动
  onStartSport() {
    if (!this.data.selectedSport) {
      wx.showToast({ title: '请先选择运动类型', icon: 'none' });
      return;
    }
    
    wx.navigateTo({
      url: `/pages/sport-target/sport-target?sportType=${this.data.selectedSport}`
    });
  },

  // 管理运动
  onManageSport() {
    wx.navigateTo({
      url: '/pages/sport-manage/sport-manage'
    });
  },

  // 查看历史
  onViewHistory() {
    wx.navigateTo({
      url: '/pages/history/history'
    });
  },

  // 个人中心
  onProfile() {
    wx.navigateTo({
      url: '/pages/profile/profile'
    });
  }
});
