// pages/weight-add/weight-add.js

Page({
  data: {
    weight: 65,
    timeType: 'morning',
    note: '',
    lastRecord: null,
    compareDiff: 0
  },

  onLoad() {
    this.loadLastRecord();
  },

  // 加载上次记录
  loadLastRecord() {
    const records = wx.getStorageSync('weight_records') || [];
    if (records.length > 0) {
      const last = records[records.length - 1];
      this.setData({
        weight: last.weight,
        lastRecord: last,
        compareDiff: 0
      });
    }
  },

  // 体重变化
  onWeightChange(e) {
    const weight = parseFloat(e.detail.value).toFixed(1);
    this.setData({ weight });
    this.updateCompareDiff();
  },

  // 更新对比差值
  updateCompareDiff() {
    if (this.data.lastRecord) {
      const diff = (parseFloat(this.data.weight) - this.data.lastRecord.weight).toFixed(1);
      this.setData({ compareDiff: parseFloat(diff) });
    }
  },

  // 选择时间类型
  onSelectTime(e) {
    this.setData({ timeType: e.currentTarget.dataset.type });
  },

  // 备注输入
  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  // 保存
  onSave() {
    const record = {
      id: Date.now(),
      date: this.formatDate(new Date()),
      timeType: this.data.timeType,
      weight: parseFloat(this.data.weight),
      note: this.data.note,
      createTime: Date.now()
    };
    
    try {
      const records = wx.getStorageSync('weight_records') || [];
      records.push(record);
      wx.setStorageSync('weight_records', records);
      
      wx.showToast({
        title: '记录成功',
        icon: 'success',
        duration: 1500
      });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  // 格式化日期
  formatDate(date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  },

  // 返回
  onBack() {
    wx.navigateBack();
  }
});
