// pages/diet/diet.js
const db = require('../../utils/db.js');

Page({
  data: {
    // 日期相关
    currentDate: '',
    displayDate: '',
    weekDay: '',
    dateOffset: 0,
    
    // 卡路里数据
    totalCalories: 0,
    targetCalories: 2000,
    remaining: 0,
    calorieAngle: 0,
    
    // 营养成分
    protein: 0,
    carbs: 0,
    fat: 0,
    proteinAngle: 0,
    carbsAngle: 0,
    fatAngle: 0,
    
    // 餐食展开状态
    mealExpanded: {
      breakfast: true,
      lunch: false,
      dinner: false,
      snack: false
    },
    
    // 餐食数据
    breakfastItems: [],
    lunchItems: [],
    dinnerItems: [],
    snackItems: [],
    breakfastCal: 0,
    lunchCal: 0,
    dinnerCal: 0,
    snackCal: 0,
    
    // 加载状态
    isLoading: false
  },

  onLoad() {
    this.initDate();
    this.loadDietData();
  },

  onShow() {
    // 每次显示页面时更新日期显示并重新加载数据
    this.updateDateDisplay();
    this.loadDietData();
  },

  // 初始化日期
  initDate() {
    this.updateDateDisplay();
  },

  // 更新日期显示
  updateDateDisplay() {
    const date = new Date();
    date.setDate(date.getDate() + this.data.dateOffset);
    
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    
    this.setData({
      currentDate: `${date.getFullYear()}-${month}-${day}`,
      displayDate: `${month}月${day}日`,
      weekDay: weekDays[date.getDay()]
    });
  },

  // 切换到前一天
  onPrevDay() {
    this.setData({ dateOffset: this.data.dateOffset - 1 }, () => {
      this.updateDateDisplay();
      this.loadDietData();
    });
  },

  // 切换到后一天
  onNextDay() {
    this.setData({ dateOffset: this.data.dateOffset + 1 }, () => {
      this.updateDateDisplay();
      this.loadDietData();
    });
  },

  // 加载饮食数据
  async loadDietData() {
    this.setData({ isLoading: true });
    
    try {
      // 先尝试从云数据库加载
      const result = await db.queryRecords(db.COLLECTIONS.DIET, { date: this.data.currentDate }, 100);
      
      let records = [];
      if (result.success && result.data && result.data.length > 0) {
        records = result.data;
        
        // 同步到本地存储
        try {
          wx.setStorageSync('diet_records', records);
        } catch (e) {
          console.error('本地存储同步失败', e);
        }
      } else {
        // 从本地存储加载作为备用
        records = wx.getStorageSync('diet_records') || [];
        records = records.filter(r => r.date === this.data.currentDate);
      }
      
      this.processDietRecords(records);
    } catch (e) {
      console.error('加载饮食数据失败', e);
      // 从本地存储加载
      const localRecords = wx.getStorageSync('diet_records') || [];
      const filteredRecords = localRecords.filter(r => r.date === this.data.currentDate);
      this.processDietRecords(filteredRecords);
    }
    
    this.setData({ isLoading: false });
  },

  // 处理饮食记录
  processDietRecords(records) {
    // 计算各餐食数据
    let breakfast = [], lunch = [], dinner = [], snack = [];
    let breakfastCal = 0, lunchCal = 0, dinnerCal = 0, snackCal = 0;
    let totalCal = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
    
    records.forEach(r => {
      totalCal += r.calories || 0;
      totalProtein += r.protein || 0;
      totalCarbs += r.carbs || 0;
      totalFat += r.fat || 0;
      
      if (r.meal === 'breakfast') {
        breakfast.push(r);
        breakfastCal += r.calories || 0;
      } else if (r.meal === 'lunch') {
        lunch.push(r);
        lunchCal += r.calories || 0;
      } else if (r.meal === 'dinner') {
        dinner.push(r);
        dinnerCal += r.calories || 0;
      } else if (r.meal === 'snack') {
        snack.push(r);
        snackCal += r.calories || 0;
      }
    });
    
    // 计算进度角度
    const calorieAngle = Math.min((totalCal / this.data.targetCalories) * 360, 360);
    const proteinAngle = Math.min((totalProtein / 80) * 360, 360);
    const carbsAngle = Math.min((totalCarbs / 250) * 360, 360);
    const fatAngle = Math.min((totalFat / 65) * 360, 360);
    
    this.setData({
      totalCalories: totalCal,
      remaining: this.data.targetCalories - totalCal,
      calorieAngle,
      protein: totalProtein.toFixed(0),
      carbs: totalCarbs.toFixed(0),
      fat: totalFat.toFixed(0),
      proteinAngle,
      carbsAngle,
      fatAngle,
      breakfastItems: breakfast,
      lunchItems: lunch,
      dinnerItems: dinner,
      snackItems: snack,
      breakfastCal,
      lunchCal,
      dinnerCal,
      snackCal
    });
  },

  // 切换餐食展开状态
  onToggleMeal(e) {
    const meal = e.currentTarget.dataset.meal;
    const expanded = this.data.mealExpanded;
    expanded[meal] = !expanded[meal];
    this.setData({ mealExpanded: expanded });
  },

  // 添加食物
  onAddFood(e) {
    const meal = e.currentTarget.dataset.meal;
    wx.navigateTo({
      url: '/pages/diet-add/diet-add?meal=' + meal + '&date=' + this.data.currentDate
    });
  },

  // 删除食物记录
  async onDeleteFood(e) {
    const foodId = e.currentTarget.dataset.id;
    const food = e.currentTarget.dataset.food;
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${food.name}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            // 优先使用 _id（云数据库ID）删除
            const deleteId = food._id || food.cloudId || foodId;
            
            if (deleteId) {
              // 尝试从云数据库删除
              const result = await db.deleteRecord(db.COLLECTIONS.DIET, deleteId);
              if (!result.success) {
                console.warn('云数据库删除失败，尝试本地删除');
              }
            }
            
            // 从本地存储删除（无论云数据库删除是否成功）
            const records = wx.getStorageSync('diet_records') || [];
            const filtered = records.filter(r => 
              r.id !== foodId && 
              r._id !== foodId && 
              r.cloudId !== deleteId
            );
            wx.setStorageSync('diet_records', filtered);
            
            wx.showToast({ title: '已删除', icon: 'success' });
            
            // 重新加载数据
            this.loadDietData();
          } catch (err) {
            console.error('删除失败', err);
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 返回
  onBack() {
    wx.navigateBack();
  },

  // 预览图片
  onPreviewImage(e) {
    const src = e.currentTarget.dataset.src;
    if (src) {
      wx.previewImage({
        current: src,
        urls: [src]
      });
    }
  },

  // 查看历史数据
  onViewHistory() {
    wx.navigateTo({
      url: '/pages/history/history'
    });
  }
});
