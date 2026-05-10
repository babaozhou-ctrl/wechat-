// pages/steps/steps.js
Page({
  data: { todaySteps: 0, targetSteps: 10000, progress: 0, inputSteps: '', records: [] },
  
  onLoad() { this.loadData(); },
  onShow() { this.loadData(); },
  
  getTodayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  },
  
  loadData() {
    const records = wx.getStorageSync('step_records') || {};
    const today = this.getTodayKey();
    const steps = records[today] || 0;
    const logs = records[today + '_logs'] || [];
    this.setData({ todaySteps: steps.toLocaleString(), progress: Math.min((steps / this.data.targetSteps) * 100, 100), records: logs });
  },
  
  onInput(e) { this.setData({ inputSteps: e.detail.value }); },
  
  onAdd() {
    const steps = parseInt(this.data.inputSteps);
    if (!steps || steps <= 0) { wx.showToast({ title: '请输入有效步数', icon: 'none' }); return; }
    const now = new Date();
    const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const records = wx.getStorageSync('step_records') || {};
    records[today] = (records[today] || 0) + steps;
    if (!records[today + '_logs']) records[today + '_logs'] = [];
    records[today + '_logs'].push({ id: Date.now(), steps, time: `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}` });
    wx.setStorageSync('step_records', records);
    wx.showToast({ title: '添加成功', icon: 'success' });
    this.setData({ inputSteps: '' });
    this.loadData();
  },
  
  onBack() { wx.navigateBack(); }
});
