// pages/profile/profile.js
Page({
  data: {
    userInfo: {
      nickname: '健康用户',
      avatar: '👤'
    },
    targets: { calories: 2000, weight: 65, water: 2000, sleep: 8 },
    body: { height: 170, age: 25 }
  },

  onLoad() {
    this.loadData();
  },

  loadData() {
    const profile = wx.getStorageSync('user_profile') || {};
    this.setData({
      userInfo: profile.userInfo || this.data.userInfo,
      targets: profile.targets || this.data.targets,
      body: profile.body || this.data.body
    });
  },

  saveData() {
    const profile = wx.getStorageSync('user_profile') || {};
    wx.setStorageSync('user_profile', {
      ...profile,
      userInfo: this.data.userInfo,
      targets: this.data.targets,
      body: this.data.body
    });
  },

  // 编辑头像
  onEditAvatar() {
    const avatars = ['👤', '🧑', '👨', '👩', '🧒', '👴', '👵', '🦸', '🧙', '🧚', '🦊', '🐱', '🐶', '🐰', '🐼', '🦁', '🐯', '🐨'];
    
    wx.showActionSheet({
      itemList: avatars,
      success: (res) => {
        const selected = avatars[res.tapIndex];
        this.setData({ ['userInfo.avatar']: selected });
        this.saveData();
        wx.showToast({ title: '头像已更新', icon: 'success' });
      }
    });
  },

  // 编辑昵称
  onEditNickname() {
    wx.showModal({
      title: '设置昵称',
      editable: true,
      placeholderText: '请输入昵称',
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          this.setData({ ['userInfo.nickname']: res.content.trim() });
          this.saveData();
          wx.showToast({ title: '昵称已更新', icon: 'success' });
        }
      }
    });
  },

  onEditTarget(e) {
    const type = e.currentTarget.dataset.type;
    const labels = { calories: '每日热量目标(千卡)', weight: '目标体重(kg)', water: '每日饮水目标(ml)', sleep: '每日睡眠目标(小时)' };
    const current = this.data.targets[type];
    
    wx.showModal({
      title: '设置' + labels[type],
      editable: true,
      placeholderText: '当前: ' + current,
      success: (res) => {
        if (res.confirm && res.content) {
          const value = parseFloat(res.content);
          if (value > 0) {
            this.setData({ ['targets.' + type]: value });
            this.saveData();
            wx.showToast({ title: '已更新', icon: 'success' });
          }
        }
      }
    });
  },

  onEditBody(e) {
    const type = e.currentTarget.dataset.type;
    const labels = { height: '身高(cm)', age: '年龄(岁)' };
    const current = this.data.body[type];
    
    wx.showModal({
      title: '设置' + labels[type],
      editable: true,
      placeholderText: '当前: ' + current,
      success: (res) => {
        if (res.confirm && res.content) {
          const value = parseFloat(res.content);
          if (value > 0) {
            this.setData({ ['body.' + type]: value });
            this.saveData();
            wx.showToast({ title: '已更新', icon: 'success' });
          }
        }
      }
    });
  },

  onBack() { wx.navigateBack(); }
});
