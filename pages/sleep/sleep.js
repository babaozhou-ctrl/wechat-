// pages/sleep/sleep.js
Page({
  data: { todaySleep: 0, targetSleep: 8, progress: 0, sleepTime: '22:00', wakeTime: '06:00' },
  
  onLoad() { this.loadData(); },
  onShow() { this.loadData(); },
  
  getTodayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  },
  
  loadData() {
    const records = wx.getStorageSync('sleep_records') || {};
    const today = this.getTodayKey();
    const sleep = records[today] || 0;
    this.setData({ todaySleep: sleep.toFixed(1), progress: Math.min((sleep / this.data.targetSleep) * 100, 100) });
  },
  
  onSleepTimeChange(e) { this.setData({ sleepTime: e.detail.value }); },
  onWakeTimeChange(e) { this.setData({ wakeTime: e.detail.value }); },
  
  onSave() {
    const [sleepH, sleepM] = this.data.sleepTime.split(':').map(Number);
    const [wakeH, wakeM] = this.data.wakeTime.split(':').map(Number);
    let duration = wakeH + wakeM / 60 - (sleepH + sleepM / 60);
    if (duration < 0) duration += 24;
    
    const records = wx.getStorageSync('sleep_records') || {};
    records[this.getTodayKey()] = duration;
    wx.setStorageSync('sleep_records', records);
    
    wx.showToast({
      title: '保存成功',
      icon: 'success',
      duration: 1500,
      success: () => {
        setTimeout(() => wx.navigateBack(), 1500);
      }
    });
  },
  
  onBack() { wx.navigateBack(); }
});
