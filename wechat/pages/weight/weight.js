// pages/weight/weight.js

Page({
  data: {
    currentWeight: '--',
    targetWeight: 65,
    weightChange: 0,
    weightChangeAbs: '--',
    bmi: '--',
    distanceToTarget: 0,
    distanceToTargetAbs: '--',
    height: 170,
    records: [],
    chartPoints: []
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  // 加载数据
  loadData() {
    const records = wx.getStorageSync('weight_records') || [];
    const height = wx.getStorageSync('user_height') || 170;
    
    this.setData({ height });
    
    if (records.length > 0) {
      const latest = records[records.length - 1];
      const currentWeight = latest.weight;
      
      // 计算BMI
      const heightM = height / 100;
      const bmi = (currentWeight / (heightM * heightM)).toFixed(1);
      
      // 计算与目标的距离
      const distanceToTarget = currentWeight - this.data.targetWeight;
      
      // 计算较上周的变化
      let weightChange = 0;
      if (records.length > 1) {
        const weekAgo = records[records.length - 7];
        if (weekAgo) {
          weightChange = currentWeight - weekAgo.weight;
        }
      }
      
      // 格式化记录列表
      const formattedRecords = records.slice(-10).reverse().map((r, i, arr) => {
        const date = new Date(r.date);
        let change = 0;
        if (i < arr.length - 1) {
          change = r.weight - arr[i + 1].weight;
        }
        return {
          ...r,
          day: date.getDate(),
          month: date.getMonth() + 1,
          change: change.toFixed(1),
          bmi: (r.weight / (heightM * heightM)).toFixed(1)
        };
      });
      
      // 生成图表数据
      const chartPoints = records.slice(-7).map((r, i) => {
        const minWeight = Math.min(...records.slice(-7).map(x => x.weight));
        const maxWeight = Math.max(...records.slice(-7).map(x => x.weight));
        const range = maxWeight - minWeight || 1;
        
        return {
          weight: r.weight,
          x: (i / Math.max(records.slice(-7).length - 1, 1)) * 100,
          y: ((r.weight - minWeight) / range) * 80 + 10
        };
      });
      
      this.setData({
        currentWeight: currentWeight.toFixed(1),
        bmi,
        distanceToTarget,
        distanceToTargetAbs: Math.abs(distanceToTarget).toFixed(1),
        weightChange,
        weightChangeAbs: Math.abs(weightChange).toFixed(1),
        records: formattedRecords,
        chartPoints
      });
    }
  },

  // 添加记录
  onAdd() {
    wx.navigateTo({
      url: '/pages/weight-add/weight-add'
    });
  },

  // 记录身高
  onRecordHeight() {
    wx.showModal({
      title: '记录身高',
      editable: true,
      placeholderText: '请输入身高(cm)',
      success: (res) => {
        if (res.confirm && res.content) {
          const height = parseFloat(res.content);
          if (height > 0 && height < 300) {
            wx.setStorageSync('user_height', height);
            this.setData({ height });
            wx.showToast({ title: '身高已更新', icon: 'success' });
            this.loadData();
          } else {
            wx.showToast({ title: '请输入有效身高', icon: 'none' });
          }
        }
      }
    });
  },

  // 返回
  onBack() {
    wx.navigateBack();
  }
});
