// pages/sport-record/sport-record.js
const db = require('../../utils/db.js');

Page({
  data: {
    // 运动类型
    sportType: 'running',
    sportName: '跑步',
    sportIcon: '🏃',
    
    // 位置信息
    location: {
      latitude: 31.230416,
      longitude: 121.473701
    },
    
    // 地图标记和轨迹
    markers: [],
    polyline: [],
    
    // GPS状态
    gpsStatus: 'searching',
    gpsText: 'GPS搜索中',
    
    // 运动数据
    totalDistance: '0.00',
    totalDuration: '00:00:00',
    currentSpeed: '0.0',
    totalCalories: '0',
    
    // 运动状态
    isRunning: false,
    isLocked: false,
    isRecording: false,
    
    // 地图大小配置
    mapSize: 'medium',
    mapHeight: 200,
    
    // 语音播报配置
    voiceEnabled: true,
    _lastVoiceDistance: 0,
    
    // 语音提示覆盖层
    voiceTip: '',
    showVoiceTip: false,
    
    // 显示配置
    displayConfig: {
      showDistance: true,
      showDuration: true,
      showSpeed: true,
      showCalories: true
    },
    
    // 内部数据
    _startTime: null,
    _timer: null,
    _locations: [],
    _lastLocation: null,
    _distance: 0,
    _isPaused: false,
    _pausedDuration: 0,
    _pauseStartTime: null,
    _caloriesPerKm: 60,
    _locationTimer: null
  },

  // 运动类型映射
  sportTypeMap: {
    running: { name: '跑步', icon: '🏃', caloriesPerKm: 60 },
    cycling: { name: '骑行', icon: '🚴', caloriesPerKm: 40 },
    walking: { name: '健走', icon: '🚶', caloriesPerKm: 50 },
    hiking: { name: '徒步', icon: '🏔️', caloriesPerKm: 45 }
  },

  onLoad(options) {
    console.log('运动记录页面加载', options);
    
    // 获取运动类型
    if (options.sportType) {
      this.setData({ sportType: options.sportType });
      this.loadSportTypeInfo(options.sportType);
    }
    
    // 加载显示配置
    this.loadDisplayConfig();
    
    // 加载语音设置
    this.loadVoiceConfig();
    
    // 加载地图大小配置
    this.loadMapSizeConfig();
    
    // 初始化位置
    this.initLocation();
  },

  onShow() {
    this.loadDisplayConfig();
    this.loadVoiceConfig();
  },

  onReady() {
    this.mapContext = wx.createMapContext('miniMap');
  },

  onUnload() {
    this.stopRecord();
  },

  loadSportTypeInfo(sportType) {
    try {
      const customSports = wx.getStorageSync('custom_sports') || [];
      const customSport = customSports.find(s => s.key === sportType);
      
      if (customSport) {
        this.setData({
          sportName: customSport.name,
          sportIcon: customSport.icon,
          _caloriesPerKm: customSport.caloriesPerKm || 60
        });
      } else {
        const sportInfo = this.sportTypeMap[sportType] || this.sportTypeMap.running;
        this.setData({
          sportName: sportInfo.name,
          sportIcon: sportInfo.icon,
          _caloriesPerKm: sportInfo.caloriesPerKm
        });
      }
    } catch (e) {
      console.error('加载运动类型信息失败', e);
    }
  },

  loadDisplayConfig() {
    try {
      const config = wx.getStorageSync('display_config');
      if (config) {
        this.setData({ displayConfig: config });
      }
    } catch (e) {
      console.error('加载配置失败', e);
    }
  },

  loadVoiceConfig() {
    try {
      const voiceEnabled = wx.getStorageSync('voice_enabled');
      if (voiceEnabled !== '') {
        this.setData({ voiceEnabled });
      } else {
        // 默认开启语音
        this.setData({ voiceEnabled: true });
        wx.setStorageSync('voice_enabled', true);
      }
    } catch (e) {
      console.error('加载语音配置失败', e);
    }
  },

  loadMapSizeConfig() {
    try {
      const mapSize = wx.getStorageSync('map_size') || 'medium';
      const heights = { small: 120, medium: 200, large: 280, fullscreen: 400 };
      this.setData({ mapSize, mapHeight: heights[mapSize] || 200 });
    } catch (e) {
      console.error('加载地图配置失败', e);
    }
  },

  onResizeMap() {
    const sizes = ['small', 'medium', 'large', 'fullscreen'];
    const heights = { small: 120, medium: 200, large: 280, fullscreen: 400 };
    const idx = sizes.indexOf(this.data.mapSize);
    const newSize = sizes[(idx + 1) % 4];
    
    this.setData({ mapSize: newSize, mapHeight: heights[newSize] });
    wx.setStorageSync('map_size', newSize);
    wx.vibrateShort();
  },

  onToggleVoice() {
    const voiceEnabled = !this.data.voiceEnabled;
    this.setData({ voiceEnabled });
    wx.setStorageSync('voice_enabled', voiceEnabled);
    
    // 显示提示
    this.showVoiceTip(voiceEnabled ? '🔔 语音提醒已开启' : '🔕 语音提醒已关闭');
  },

  // 显示语音提示覆盖层
  showVoiceTip(message) {
    this.setData({ voiceTip: message, showVoiceTip: true });
    
    // 震动反馈
    wx.vibrateShort();
    
    // 3秒后自动隐藏
    setTimeout(() => {
      this.setData({ showVoiceTip: false });
    }, 3000);
  },

  // 语音播报
  speakSportData(type, data) {
    if (!this.data.voiceEnabled) return;
    
    const messages = {
      start: '🏃 运动开始！',
      pause: '⏸️ 运动暂停',
      resume: '▶️ 继续加油！',
      finish: '✅ 完成！距离 ' + data.distance + ' 公里',
      everyKm: '📍 第 ' + data.km + ' 公里'
    };
    
    if (messages[type]) {
      this.showVoiceTip(messages[type]);
    }
  },

  initLocation() {
    wx.showLoading({ title: '定位中...' });
    
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.userLocation']) {
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => this.getLocation(),
            fail: () => {
              wx.hideLoading();
              this.setData({ gpsStatus: 'disconnected', gpsText: '请开启定位' });
              wx.showToast({ title: '请开启定位权限', icon: 'none' });
            }
          });
        } else {
          this.getLocation();
        }
      },
      fail: () => this.getLocation()
    });
  },

  getLocation() {
    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      success: (res) => {
        const location = { latitude: res.latitude, longitude: res.longitude };
        
        this.setData({
          location,
          markers: [{ id: 1, latitude: res.latitude, longitude: res.longitude, width: 20, height: 20 }],
          gpsStatus: 'connected',
          gpsText: 'GPS已连接',
          _lastLocation: location
        });
        
        wx.hideLoading();
        this.mapContext && this.mapContext.moveToLocation();
      },
      fail: (err) => {
        console.error('定位失败', err);
        wx.hideLoading();
        this.setData({ gpsStatus: 'disconnected', gpsText: '定位失败' });
        wx.showToast({ title: '定位失败，请检查权限', icon: 'none' });
      }
    });
  },

  onToggleRecord() {
    if (this.data.isRunning) {
      this.pauseRecord();
    } else {
      this.startRecord();
    }
  },

  startRecord() {
    const wasPaused = this.data._isPaused;
    
    this.setData({ isRunning: true, isRecording: true, _isPaused: false });
    
    if (this.data._pauseStartTime) {
      const pauseDuration = Date.now() - this.data._pauseStartTime;
      this.setData({ _pausedDuration: this.data._pausedDuration + pauseDuration, _pauseStartTime: null });
    } else if (!this.data._startTime) {
      this.setData({ _startTime: Date.now() });
    }
    
    this.data._timer = setInterval(() => this.updateData(), 1000);
    this.startLocationUpdate();
    
    wx.vibrateShort();
    this.speakSportData(wasPaused ? 'resume' : 'start');
  },

  pauseRecord() {
    this.setData({ isRunning: false, _isPaused: true, _pauseStartTime: Date.now() });
    
    if (this.data._timer) {
      clearInterval(this.data._timer);
      this.data._timer = null;
    }
    
    this.stopLocationUpdate();
    wx.vibrateShort();
    this.speakSportData('pause');
  },

  stopRecord() {
    this.pauseRecord();
    if (this.data._distance > 0) {
      this.saveRecord();
    }
  },

  updateData() {
    const now = Date.now();
    const elapsed = now - this.data._startTime - this.data._pausedDuration;
    const durationSeconds = Math.floor(elapsed / 1000);
    
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const seconds = durationSeconds % 60;
    const durationStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    let speed = '0.0';
    if (durationSeconds > 0 && this.data._distance > 0) {
      speed = Math.min((this.data._distance / durationSeconds) * 3600, 99.9).toFixed(1);
    }
    
    const calories = Math.round(this.data._distance * this.data._caloriesPerKm);
    
    this.setData({
      totalDuration: durationStr,
      totalDistance: this.data._distance.toFixed(2),
      currentSpeed: speed,
      totalCalories: calories.toString()
    });
    
    // 每公里语音播报
    const currentKm = Math.floor(this.data._distance);
    const lastVoiceKm = Math.floor(this.data._lastVoiceDistance);
    
    if (currentKm > lastVoiceKm && currentKm > 0) {
      this.speakSportData('everyKm', { km: currentKm });
      this.setData({ _lastVoiceDistance: this.data._distance });
    }
  },

  startLocationUpdate() {
    this.data._locationTimer = setInterval(() => this.getCurrentLocation(), 3000);
    this.getCurrentLocation();
  },

  getCurrentLocation() {
    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      success: (res) => {
        const newLocation = { latitude: res.latitude, longitude: res.longitude };
        
        if (this.data._lastLocation) {
          const distance = this.calculateDistance(
            this.data._lastLocation.latitude, this.data._lastLocation.longitude,
            res.latitude, res.longitude
          );
          
          if (distance > 0.003 && distance < 0.1) {
            this.setData({ _distance: this.data._distance + distance });
            this.updatePolyline(newLocation);
          }
        }
        
        this.setData({
          location: newLocation,
          markers: [{ id: 1, latitude: res.latitude, longitude: res.longitude, width: 20, height: 20 }],
          _lastLocation: newLocation,
          gpsStatus: 'connected'
        });
        
        this.mapContext && this.mapContext.moveToLocation();
      },
      fail: () => {
        this.setData({ gpsStatus: 'searching', gpsText: 'GPS信号弱' });
      }
    });
  },

  updatePolyline(newLocation) {
    const locations = this.data._locations;
    locations.push(newLocation);
    if (locations.length > 100) locations.shift();
    
    this.setData({ _locations: locations });
    
    if (locations.length >= 2) {
      this.setData({ polyline: [{ points: locations, color: '#07c160', width: 4 }] });
    }
  },

  stopLocationUpdate() {
    if (this.data._locationTimer) {
      clearInterval(this.data._locationTimer);
      this.data._locationTimer = null;
    }
  },

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
             Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
             Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },

  toRad(deg) {
    return deg * (Math.PI / 180);
  },

  // 保存运动记录到云数据库
  async saveRecord() {
    const record = {
      id: Date.now(),
      sportType: this.data.sportType,
      sportName: this.data.sportName,
      sportIcon: this.data.sportIcon,
      distance: parseFloat(this.data.totalDistance),
      duration: this.data.totalDuration,
      durationSeconds: Math.floor((Date.now() - this.data._startTime - this.data._pausedDuration) / 1000),
      calories: parseInt(this.data.totalCalories),
      speed: parseFloat(this.data.currentSpeed),
      createTime: this.data._startTime || Date.now(),
      date: this.formatDate(new Date())
    };
    
    try {
      // 保存到云数据库
      const result = await db.addRecord(db.COLLECTIONS.SPORT, record);
      
      if (result.success) {
        record.cloudId = result.id;
        console.log('运动记录已保存到云数据库');
      }
      
      // 同时保存到本地作为备份
      try {
        const records = wx.getStorageSync('sport_history') || [];
        records.unshift(record);
        if (records.length > 100) records.pop();
        wx.setStorageSync('sport_history', records);
      } catch (e) {
        console.error('本地备份失败', e);
      }
      
      this.speakSportData('finish', { distance: this.data.totalDistance });
      wx.showToast({ title: '记录已保存', icon: 'success' });
    } catch (e) {
      console.error('保存运动记录失败', e);
      // 即使云数据库失败，也保存到本地
      try {
        const records = wx.getStorageSync('sport_history') || [];
        records.unshift(record);
        if (records.length > 100) records.pop();
        wx.setStorageSync('sport_history', records);
        wx.showToast({ title: '记录已保存', icon: 'success' });
      } catch (localError) {
        console.error('本地保存也失败', localError);
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    }
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  onLock() {
    this.setData({ isLocked: !this.data.isLocked });
    wx.vibrateShort();
  },

  onUnlock() {
    this.setData({ isLocked: false });
    wx.vibrateShort();
  },

  onSettings() {
    wx.showActionSheet({
      itemList: ['结束运动', '调整设置', '放弃运动'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.finishSport();
        } else if (res.tapIndex === 1) {
          // 调整设置 - 显示显示配置面板
          this.showDisplayConfig();
        } else if (res.tapIndex === 2) {
          this.abandonSport();
        }
      }
    });
  },

  // 显示显示配置面板
  showDisplayConfig() {
    const items = [];
    const config = this.data.displayConfig;
    
    items.push(config.showDistance ? '✅ 距离' : '❌ 距离');
    items.push(config.showDuration ? '✅ 时长' : '❌ 时长');
    items.push(config.showSpeed ? '✅ 速度' : '❌ 速度');
    items.push(config.showCalories ? '✅ 卡路里' : '❌ 卡路里');
    
    wx.showActionSheet({
      itemList: items,
      itemColor: '#07c160',
      success: (res) => {
        const toggles = {
          0: 'showDistance',
          1: 'showDuration',
          2: 'showSpeed',
          3: 'showCalories'
        };
        
        const key = toggles[res.tapIndex];
        if (key) {
          const newConfig = { ...this.data.displayConfig };
          newConfig[key] = !newConfig[key];
          this.setData({ displayConfig: newConfig });
          wx.setStorageSync('display_config', newConfig);
          wx.showToast({ title: '已更新', icon: 'success' });
        }
      }
    });
  },

  finishSport() {
    wx.showModal({
      title: '确认结束',
      content: '是否保存本次运动记录？',
      confirmText: '保存',
      cancelText: '不保存',
      success: (res) => {
        if (res.confirm) this.stopRecord();
        else this.resetData();
        wx.navigateBack();
      }
    });
  },

  abandonSport() {
    wx.showModal({
      title: '确认放弃',
      content: '确定要放弃本次运动吗？',
      success: (res) => {
        if (res.confirm) {
          this.resetData();
          if (this.data._timer) clearInterval(this.data._timer);
          wx.navigateBack();
        }
      }
    });
  },

  resetData() {
    this.setData({
      isRunning: false, isLocked: false, isRecording: false,
      _distance: 0, _startTime: null, _pausedDuration: 0,
      _lastLocation: null, _locations: [], polyline: [], markers: [],
      totalDistance: '0.00', totalDuration: '00:00:00',
      totalCalories: '0', currentSpeed: '0.0'
    });
  }
});
