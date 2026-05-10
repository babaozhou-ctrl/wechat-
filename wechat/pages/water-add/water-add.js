// pages/water-add/water-add.js
Page({
  data: {
    amount: '',
    target: 2000,
    todayTotal: 0,
    todayPercent: 0
  },

  onLoad() {
    this.calculateTodayStats();
  },

  calculateTodayStats() {
    const now = new Date();
    const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const records = wx.getStorageSync('water_records') || {};
    const logs = records[today + '_logs'] || [];
    const total = logs.reduce((sum, log) => sum + log.amount, 0);
    const target = wx.getStorageSync('water_target') || 2000;
    
    this.setData({
      todayTotal: total,
      target: target,
      todayPercent: Math.min((total / target) * 100, 100)
    });
  },

  onQuickAdd(e) {
    const amount = e.currentTarget.dataset.amount;
    this.setData({ amount: amount.toString() });
  },

  onInput(e) {
    this.setData({ amount: e.detail.value });
  },

  onSave() {
    const amount = parseInt(this.data.amount);
    if (!amount || amount <= 0) {
      wx.showToast({ title: '请输入有效数量', icon: 'none' });
      return;
    }

    const now = new Date();
    const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    const records = wx.getStorageSync('water_records') || {};
    records[today] = (records[today] || 0) + amount;
    if (!records[today + '_logs']) records[today + '_logs'] = [];
    records[today + '_logs'].push({ id: Date.now(), amount, time });
    wx.setStorageSync('water_records', records);

    wx.showToast({
      title: '保存成功',
      icon: 'success',
      duration: 1500,
      success: () => {
        setTimeout(() => wx.navigateBack(), 1500);
      }
    });
  },

  onBack() {
    wx.navigateBack();
  }
});
