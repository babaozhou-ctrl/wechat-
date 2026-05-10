// pages/sport-manage/sport-manage.js
Page({
  data: {
    sportTypes: [],
    iconList: ['🏃', '🚴', '🚶', '🏔️', '🏊', '🧘', '⚽', '🏀', '🎾', '🏋️', '⛹️', '🛹', '🛼', '🏄', '🏇', '⛷️', '🏂', '🎿', '🏌️', '🏓'],
    newSport: {
      name: '',
      icon: '🏃',
      calories: ''
    }
  },

  onLoad() {
    this.loadSportTypes();
  },

  loadSportTypes() {
    try {
      const customSports = wx.getStorageSync('custom_sports') || [];
      const defaultSports = [
        { key: 'running', name: '跑步', icon: '🏃', caloriesPerKm: 60, isDefault: true },
        { key: 'cycling', name: '骑行', icon: '🚴', caloriesPerKm: 40, isDefault: true },
        { key: 'walking', name: '健走', icon: '🚶', caloriesPerKm: 50, isDefault: true },
        { key: 'hiking', name: '徒步', icon: '🏔️', caloriesPerKm: 45, isDefault: true }
      ];
      
      const allSports = [...defaultSports, ...customSports];
      this.setData({ sportTypes: allSports });
      
      // 更新全局运动类型
      wx.setStorageSync('sport_types', allSports);
    } catch (e) {
      console.error('加载运动类型失败', e);
    }
  },

  onBack() {
    wx.navigateBack();
  },

  onNameInput(e) {
    this.setData({
      'newSport.name': e.detail.value
    });
  },

  onCaloriesInput(e) {
    this.setData({
      'newSport.calories': e.detail.value
    });
  },

  onIconSelect(e) {
    const icon = e.currentTarget.dataset.icon;
    this.setData({
      'newSport.icon': icon
    });
  },

  onAddSport() {
    const { newSport } = this.data;
    
    if (!newSport.name.trim()) {
      wx.showToast({ title: '请输入运动名称', icon: 'none' });
      return;
    }
    
    if (!newSport.calories || parseFloat(newSport.calories) <= 0) {
      wx.showToast({ title: '请输入正确的消耗值', icon: 'none' });
      return;
    }
    
    try {
      const customSports = wx.getStorageSync('custom_sports') || [];
      const key = 'custom_' + Date.now();
      
      customSports.push({
        key,
        name: newSport.name.trim(),
        icon: newSport.icon,
        caloriesPerKm: parseFloat(newSport.calories),
        isDefault: false
      });
      
      wx.setStorageSync('custom_sports', customSports);
      
      this.setData({
        newSport: { name: '', icon: '🏃', calories: '' }
      });
      
      this.loadSportTypes();
      
      // 显示成功提示并询问是否返回首页
      wx.showModal({
        title: '添加成功！',
        content: '是否返回首页使用新运动？',
        confirmText: '返回首页',
        cancelText: '继续添加',
        success: (res) => {
          if (res.confirm) {
            // 返回首页
            wx.switchTab({
              url: '/pages/index/index'
            });
          }
        }
      });
    } catch (e) {
      wx.showToast({ title: '添加失败', icon: 'none' });
    }
  },

  onEditSport(e) {
    const typeKey = e.currentTarget.dataset.type;
    const sport = this.data.sportTypes.find(s => s.key === typeKey);
    
    wx.showModal({
      title: '编辑运动',
      editable: true,
      placeholderText: '输入新名称',
      content: sport.name,
      success: (res) => {
        if (res.confirm && res.content.trim()) {
          this.updateSportName(typeKey, res.content.trim());
        }
      }
    });
  },

  updateSportName(key, newName) {
    try {
      const customSports = wx.getStorageSync('custom_sports') || [];
      const index = customSports.findIndex(s => s.key === key);
      
      if (index !== -1) {
        customSports[index].name = newName;
        wx.setStorageSync('custom_sports', customSports);
        this.loadSportTypes();
        wx.showToast({ title: '修改成功', icon: 'success' });
      }
    } catch (e) {
      wx.showToast({ title: '修改失败', icon: 'none' });
    }
  },

  onDeleteSport(e) {
    const typeKey = e.currentTarget.dataset.type;
    const sport = this.data.sportTypes.find(s => s.key === typeKey);
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除「${sport.name}」吗？`,
      success: (res) => {
        if (res.confirm) {
          try {
            const customSports = wx.getStorageSync('custom_sports') || [];
            const filtered = customSports.filter(s => s.key !== typeKey);
            wx.setStorageSync('custom_sports', filtered);
            this.loadSportTypes();
            wx.showToast({ title: '已删除', icon: 'success' });
          } catch (e) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  }
});
