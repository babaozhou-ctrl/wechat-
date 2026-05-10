// pages/sport-target/sport-target.js
const app = getApp();

Page({
  data: {
    // 标签配置
    tabs: [
      { key: 'distance', label: '距离' },
      { key: 'duration', label: '时长' },
      { key: 'calories', label: '消耗' },
      { key: 'speed', label: '时速' }
    ],
    currentTab: 'distance',
    
    // 运动类型
    sportType: 'running',
    sportName: '跑步',
    sportIcon: '🏃',
    
    // 显示相关
    displayValue: '5.00',
    selectedValue: 5,
    currentUnit: 'km',
    currentLabel: '距离',
    
    // 快捷选项
    quickOptions: [],
    
    // 滑块范围
    minValue: 0,
    maxValue: 50,
    step: 0.5,
    
    // 历史数据
    historyMaxDistance: 0,
    
    // 显示配置
    displayConfig: {
      showDistance: true,
      showDuration: true,
      showSpeed: true,
      showCalories: true
    }
  },

  // 标签配置
  tabConfig: {
    distance: {
      unit: 'km',
      label: '距离',
      min: 0.5,
      max: 100,
      step: 0.5,
      quickOptions: [
        { label: '3', value: 3 },
        { label: '5', value: 5 },
        { label: '10', value: 10 },
        { label: '21.1', value: 21.1 },
        { label: '半马', value: 21.1 }
      ],
      format: (v) => v.toFixed(2)
    },
    duration: {
      unit: '分钟',
      label: '时长',
      min: 5,
      max: 300,
      step: 5,
      quickOptions: [
        { label: '15', value: 15 },
        { label: '30', value: 30 },
        { label: '45', value: 45 },
        { label: '60', value: 60 },
        { label: '90', value: 90 }
      ],
      format: (v) => Math.floor(v)
    },
    calories: {
      unit: 'kcal',
      label: '消耗',
      min: 50,
      max: 2000,
      step: 10,
      quickOptions: [
        { label: '100', value: 100 },
        { label: '200', value: 200 },
        { label: '300', value: 300 },
        { label: '500', value: 500 },
        { label: '800', value: 800 }
      ],
      format: (v) => Math.floor(v)
    },
    speed: {
      unit: 'km/h',
      label: '时速',
      min: 3,
      max: 25,
      step: 0.5,
      quickOptions: [
        { label: '6', value: 6 },
        { label: '8', value: 8 },
        { label: '10', value: 10 },
        { label: '12', value: 12 },
        { label: '15', value: 15 }
      ],
      format: (v) => v.toFixed(1)
    }
  },

  // 运动类型映射
  sportTypeMap: {
    running: { name: '跑步', icon: '🏃' },
    cycling: { name: '骑行', icon: '🚴' },
    walking: { name: '健走', icon: '🚶' },
    hiking: { name: '徒步', icon: '🏔️' }
  },

  onLoad(options) {
    // 获取运动类型
    if (options.sportType) {
      this.setData({ sportType: options.sportType });
      this.loadSportTypeInfo(options.sportType);
    }
    
    // 加载历史数据
    this.loadHistoryData();
    
    // 加载显示配置
    this.loadDisplayConfig();
    
    // 初始化显示
    this.updateDisplay('distance');
  },

  loadSportTypeInfo(sportType) {
    try {
      // 先尝试从自定义运动中加载
      const customSports = wx.getStorageSync('custom_sports') || [];
      const customSport = customSports.find(s => s.key === sportType);
      
      if (customSport) {
        this.setData({
          sportName: customSport.name,
          sportIcon: customSport.icon
        });
      } else {
        // 使用默认运动类型
        const sportInfo = this.sportTypeMap[sportType] || this.sportTypeMap.running;
        this.setData({
          sportName: sportInfo.name,
          sportIcon: sportInfo.icon
        });
      }
    } catch (e) {
      console.error('加载运动类型信息失败', e);
    }
  },

  // 加载历史数据
  loadHistoryData() {
    try {
      const history = wx.getStorageSync('sport_history') || [];
      if (history.length > 0) {
        const maxDistance = Math.max(...history.map(h => h.distance || 0));
        this.setData({ historyMaxDistance: maxDistance.toFixed(2) });
      }
    } catch (e) {
      console.error('加载历史数据失败', e);
    }
  },

  // 加载显示配置
  loadDisplayConfig() {
    try {
      const config = wx.getStorageSync('display_config');
      if (config) {
        this.setData({ displayConfig: config });
      }
    } catch (e) {
      console.error('加载显示配置失败', e);
    }
  },

  // 标签切换
  onTabChange(e) {
    const key = e.currentTarget.dataset.key;
    this.updateDisplay(key);
  },

  // 更新显示
  updateDisplay(key) {
    const config = this.tabConfig[key];
    const defaultValue = key === 'distance' ? 5 : 
                        key === 'duration' ? 30 : 
                        key === 'calories' ? 200 : 10;
    
    this.setData({
      currentTab: key,
      currentUnit: config.unit,
      currentLabel: config.label,
      minValue: config.min,
      maxValue: config.max,
      step: config.step,
      selectedValue: defaultValue,
      displayValue: config.format(defaultValue),
      quickOptions: config.quickOptions
    });
  },

  // 快捷选项选择
  onOptionSelect(e) {
    const value = parseFloat(e.currentTarget.dataset.value);
    const config = this.tabConfig[this.data.currentTab];
    
    this.setData({
      selectedValue: value,
      displayValue: config.format(value)
    });
  },

  // 滑块变化
  onSliderChange(e) {
    const value = e.detail.value;
    const config = this.tabConfig[this.data.currentTab];
    
    this.setData({
      selectedValue: value,
      displayValue: config.format(value)
    });
  },

  // 切换显示配置
  onToggleConfig(e) {
    const key = e.currentTarget.dataset.key;
    const config = this.data.displayConfig;
    
    // 确保至少选择一个
    const selectedCount = Object.values(config).filter(v => v).length;
    if (config[key] && selectedCount <= 1) {
      wx.showToast({ title: '至少选择一个数据项', icon: 'none' });
      return;
    }
    
    this.setData({
      [`displayConfig.${key}`]: !config[key]
    });
    
    // 保存配置
    try {
      wx.setStorageSync('display_config', this.data.displayConfig);
    } catch (e) {
      console.error('保存显示配置失败', e);
    }
  },

  // 取消
  onCancel() {
    wx.navigateBack();
  },

  // 确定 - 保存设置并跳转
  onConfirm() {
    this.saveTargetConfig();
    wx.navigateBack();
  },

  // 立即开始
  onStartNow() {
    this.saveTargetConfig();
    
    // 跳转到运动记录页
    wx.redirectTo({
      url: `/pages/sport-record/sport-record?sportType=${this.data.sportType}`
    });
  },

  // 保存目标配置
  saveTargetConfig() {
    const { currentTab, selectedValue, sportType, displayConfig } = this.data;
    
    // 保存目标设置
    const targetConfig = {
      type: currentTab,
      value: selectedValue,
      sportType: sportType,
      createTime: Date.now()
    };
    
    try {
      wx.setStorageSync('sport_target', targetConfig);
      // 同时保存显示配置
      wx.setStorageSync('display_config', displayConfig);
    } catch (e) {
      console.error('保存配置失败', e);
    }
  }
});