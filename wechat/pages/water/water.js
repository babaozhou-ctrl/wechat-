// pages/water/water.js

Page({
  data: {
    currentAmount: 0,
    targetAmount: 2000,
    progress: 0,
    fillHeight: 0,
    reminderEnabled: false,
    reminderInterval: 2,
    todayRecords: []
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  // 获取今日日期key
  getTodayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  },

  // 加载数据
  loadData() {
    const waterRecords = wx.getStorageSync('water_records') || [];
    const today = this.getTodayKey();
    const todayAmount = waterRecords[today] || 0;
    const todayLogs = waterRecords[today + '_logs'] || [];
    
    const progress = Math.min((todayAmount / this.data.targetAmount) * 100, 100);
    const fillHeight = Math.min((todayAmount / this.data.targetAmount) * 100, 100);
    
    this.setData({
      currentAmount: todayAmount,
      progress,
      fillHeight,
      todayRecords: todayLogs
    });
  },

  // 添加饮水记录
  onAddWater(e) {
    const amount = parseInt(e.currentTarget.dataset.amount);
    this.addWaterRecord(amount);
  },

  // 自定义添加
  onCustomAdd() {
    wx.showModal({
      title: '添加饮水量',
      editable: true,
      placeholderText: '输入饮水量(ml)',
      success: (res) => {
        if (res.confirm && res.content) {
          const amount = parseInt(res.content);
          if (amount > 0 && amount <= 5000) {
            this.addWaterRecord(amount);
          } else {
            wx.showToast({ title: '请输入有效数量', icon: 'none' });
          }
        }
      }
    });
  },

  // 添加饮水
  addWaterRecord(amount) {
    const waterRecords = wx.getStorageSync('water_records') || {};
    const today = this.getTodayKey();
    
    // 更新总量
    waterRecords[today] = (waterRecords[today] || 0) + amount;
    
    // 添加日志
    const now = new Date();
    const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    if (!waterRecords[today + '_logs']) {
      waterRecords[today + '_logs'] = [];
    }
    waterRecords[today + '_logs'].push({
      id: Date.now(),
      amount,
      time
    });
    
    wx.setStorageSync('water_records', waterRecords);
    
    // 动画反馈
    wx.vibrateShort();
    
    wx.showToast({
      title: `+${amount}ml`,
      icon: 'none',
      duration: 1000
    });
    
    this.loadData();
  },

  // 删除记录
  onDeleteRecord(e) {
    const id = e.currentTarget.dataset.id;
    const waterRecords = wx.getStorageSync('water_records') || {};
    const today = this.getTodayKey();
    
    const logs = waterRecords[today + '_logs'] || [];
    const index = logs.findIndex(l => l.id === id);
    
    if (index > -1) {
      const amount = logs[index].amount;
      logs.splice(index, 1);
      waterRecords[today] = Math.max(0, (waterRecords[today] || 0) - amount);
      waterRecords[today + '_logs'] = logs;
      wx.setStorageSync('water_records', waterRecords);
      this.loadData();
    }
  },

  // 切换提醒
  onToggleReminder(e) {
    this.setData({ reminderEnabled: e.detail.value });
    wx.setStorageSync('water_reminder', {
      enabled: e.detail.value,
      interval: this.data.reminderInterval
    });
  },

  // 提醒间隔变化
  onReminderChange(e) {
    this.setData({ reminderInterval: e.detail.value });
    wx.setStorageSync('water_reminder', {
      enabled: this.data.reminderEnabled,
      interval: e.detail.value
    });
  },

  // 返回
  onBack() {
    wx.navigateBack();
  }
});
