// pages/diet-add/diet-add.js
const db = require('../../utils/db.js');

Page({
  data: {
    meal: 'breakfast',
    date: '',
    mealNameMap: {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐',
      snack: '加餐'
    },
    searchKeyword: '',
    searchResults: [],
    
    // 快速添加食物列表（合并默认+用户自定义）
    quickFoods: [],
    
    // 默认食物列表
    defaultFoods: [
      { id: 1, name: '米饭', icon: '🍚', calories: 116, portion: 100, protein: 2.6, carbs: 25.9, fat: 0.3 },
      { id: 2, name: '鸡蛋', icon: '🥚', calories: 144, portion: 100, protein: 13.3, carbs: 1.5, fat: 9.5 },
      { id: 3, name: '牛奶', icon: '🥛', calories: 54, portion: 100, protein: 3, carbs: 3.4, fat: 3.2 },
      { id: 4, name: '苹果', icon: '🍎', calories: 52, portion: 100, protein: 0.3, carbs: 13.8, fat: 0.2 },
      { id: 5, name: '香蕉', icon: '🍌', calories: 93, portion: 100, protein: 1.4, carbs: 22.8, fat: 0.2 },
      { id: 6, name: '面包', icon: '🍞', calories: 265, portion: 100, protein: 8, carbs: 49, fat: 3.2 },
      { id: 7, name: '馒头', icon: '🍞', calories: 223, portion: 100, protein: 7, carbs: 47, fat: 1.1 },
      { id: 8, name: '面条', icon: '🍜', calories: 284, portion: 100, protein: 8, carbs: 59, fat: 0.5 },
      { id: 9, name: '饺子', icon: '🥟', calories: 242, portion: 100, protein: 12, carbs: 25, fat: 12 },
      { id: 10, name: '粥', icon: '🥣', calories: 46, portion: 100, protein: 1.1, carbs: 9.9, fat: 0.2 },
      { id: 11, name: '豆浆', icon: '🥛', calories: 33, portion: 100, protein: 2.9, carbs: 1.2, fat: 1.6 }
    ],
    
    // 用户自定义食物列表
    customFoods: [],
    
    // 自定义食物
    customFood: {
      name: '',
      calories: '',
      portion: '100',
      protein: '',
      carbs: '',
      fat: '',
      icon: '🍽️',
      customImage: '',
      remark: ''
    },
    
    iconList: ['🍽️', '🍚', '🥗', '🍜', '🍝', '🍕', '🍔', '🍟', '🌮', '🍗', '🥩', '🐟', '🥚', '🥛', '🍎', '🍌', '🍇', '🥕', '🌽', '🥦', '🍓', '🍊', '🍑', '🥭'],
    
    showCustomImage: false
  },

  // 本地存储 key
  STORAGE_KEY: 'user_custom_foods',

  onLoad(options) {
    if (options.meal) {
      this.setData({ meal: options.meal });
    }
    if (options.date) {
      this.setData({ date: options.date });
    }
    
    if (!this.data.date) {
      const now = new Date();
      this.setData({
        date: `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
      });
    }
    
    // 加载用户自定义食物
    this.loadCustomFoods();
  },

  // 加载用户自定义食物
  loadCustomFoods() {
    try {
      const customFoods = wx.getStorageSync(this.STORAGE_KEY) || [];
      this.setData({ customFoods });
      this.mergeFoods();
    } catch (e) {
      console.error('加载自定义食物失败', e);
      this.mergeFoods();
    }
  },

  // 合并默认食物和自定义食物
  mergeFoods() {
    const quickFoods = [...this.data.defaultFoods, ...this.data.customFoods];
    this.setData({ quickFoods });
  },

  // 保存自定义食物到本地存储
  saveCustomFoods() {
    try {
      wx.setStorageSync(this.STORAGE_KEY, this.data.customFoods);
    } catch (e) {
      console.error('保存自定义食物失败', e);
    }
  },

  // 搜索食物
  onSearch(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    
    if (keyword) {
      const results = this.data.quickFoods.filter(f => 
        f.name.includes(keyword)
      );
      this.setData({ searchResults: results });
    } else {
      this.setData({ searchResults: [] });
    }
  },

  // 选择食物
  onSelectFood(e) {
    const food = e.currentTarget.dataset.food;
    this.addFood(food, false);
  },

  // 添加食物
  async addFood(food, needRemark = true) {
    const record = {
      id: Date.now(),
      date: this.data.date,
      meal: this.data.meal,
      name: food.name,
      icon: food.icon || '🍽️',
      customImage: food.customImage || '',
      calories: parseFloat(food.calories) || 0,
      portion: parseFloat(food.portion) || 100,
      protein: parseFloat(food.protein) || 0,
      carbs: parseFloat(food.carbs) || 0,
      fat: parseFloat(food.fat) || 0,
      remark: food.remark || '',
      time: this.getCurrentTime()
    };
    
    if (needRemark && !record.remark) {
      wx.showModal({
        title: '添加备注（可选）',
        editable: true,
        placeholderText: '例如：少油、少盐、半份...',
        success: (res) => {
          if (res.confirm) {
            record.remark = res.content || '';
            this.doSaveFood(record);
          } else if (res.cancel) {
            this.doSaveFood(record);
          }
        }
      });
    } else {
      this.doSaveFood(record);
    }
  },

  // 执行保存食物
  async doSaveFood(record) {
    wx.showLoading({ title: '保存中...' });
    
    try {
      const result = await db.addRecord(db.COLLECTIONS.DIET, record);
      
      if (result.success) {
        this.saveToLocalStorage(record, result.id);
        
        wx.hideLoading();
        wx.showToast({
          title: '添加成功',
          icon: 'success',
          duration: 1500
        });
        
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        console.warn('云数据库保存失败，使用本地存储:', result.error);
        this.saveToLocalStorageOnly(record);
        
        wx.hideLoading();
        wx.showToast({
          title: '添加成功（本地）',
          icon: 'success',
          duration: 1500
        });
        
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } catch (e) {
      console.error('保存失败，使用本地存储:', e);
      this.saveToLocalStorageOnly(record);
      
      wx.hideLoading();
      wx.showToast({
        title: '添加成功（本地）',
        icon: 'success',
        duration: 1500
      });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 保存到本地存储
  saveToLocalStorage(record, cloudId) {
    try {
      const records = wx.getStorageSync('diet_records') || [];
      records.push({ ...record, cloudId: cloudId, savedAt: Date.now() });
      wx.setStorageSync('diet_records', records);
    } catch (e) {
      console.error('本地备份失败', e);
    }
  },

  saveToLocalStorageOnly(record) {
    try {
      const records = wx.getStorageSync('diet_records') || [];
      records.push({ ...record, cloudId: null, savedAt: Date.now(), offline: true });
      wx.setStorageSync('diet_records', records);
      console.log('已保存到本地存储');
    } catch (e) {
      console.error('本地存储保存失败', e);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  getCurrentTime() {
    const now = new Date();
    return `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
  },

  // 自定义输入处理
  onCustomNameInput(e) {
    this.setData({ 'customFood.name': e.detail.value });
  },

  onCustomCaloriesInput(e) {
    this.setData({ 'customFood.calories': e.detail.value });
  },

  onCustomPortionInput(e) {
    this.setData({ 'customFood.portion': e.detail.value });
  },

  onCustomProteinInput(e) {
    this.setData({ 'customFood.protein': e.detail.value });
  },

  onCustomCarbsInput(e) {
    this.setData({ 'customFood.carbs': e.detail.value });
  },

  onCustomFatInput(e) {
    this.setData({ 'customFood.fat': e.detail.value });
  },

  onCustomRemarkInput(e) {
    this.setData({ 'customFood.remark': e.detail.value });
  },

  // 选择图标
  onSelectIcon(e) {
    const icon = e.currentTarget.dataset.icon;
    this.setData({ 
      'customFood.icon': icon,
      'customFood.customImage': ''
    });
  },

  // 上传自定义图片
  onUploadCustomImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({
          'customFood.customImage': tempFilePath,
          'customFood.icon': '📷'
        });
        this.uploadImageToCloud(tempFilePath);
      },
      fail: (err) => {
        console.error('选择图片失败', err);
        wx.showToast({ title: '请允许相册权限', icon: 'none' });
      }
    });
  },

  async uploadImageToCloud(filePath) {
    try {
      wx.showLoading({ title: '上传中...' });
      const fileName = `diet_icons/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
      
      const result = await wx.cloud.uploadFile({
        cloudPath: fileName,
        filePath: filePath
      });
      
      wx.hideLoading();
      
      if (result.fileID) {
        this.setData({
          'customFood.customImage': result.fileID
        });
        wx.showToast({ title: '图片上传成功', icon: 'success' });
      }
    } catch (e) {
      wx.hideLoading();
      console.error('图片上传失败', e);
      wx.showToast({ title: '图片上传失败，将使用本地图片', icon: 'none' });
    }
  },

  // 添加自定义食物（保存到快速添加）
  onAddCustomFood() {
    const { name, calories, portion, remark } = this.data.customFood;
    
    if (!name.trim()) {
      wx.showToast({ title: '请输入食物名称', icon: 'none' });
      return;
    }
    
    if (!calories || parseFloat(calories) <= 0) {
      wx.showToast({ title: '请输入热量', icon: 'none' });
      return;
    }
    
    const portionRatio = parseFloat(portion) / 100;
    
    // 创建自定义食物对象
    const newCustomFood = {
      id: 'custom_' + Date.now(),
      name: name.trim(),
      icon: this.data.customFood.icon,
      customImage: this.data.customFood.customImage || '',
      calories: parseFloat(calories),
      portion: parseFloat(portion),
      protein: (parseFloat(this.data.customFood.protein) || 0) * portionRatio,
      carbs: (parseFloat(this.data.customFood.carbs) || 0) * portionRatio,
      fat: (parseFloat(this.data.customFood.fat) || 0) * portionRatio,
      remark: remark || '',
      isCustom: true, // 标记为自定义食物
      createdAt: Date.now()
    };
    
    // 添加到自定义食物列表
    const customFoods = [...this.data.customFoods, newCustomFood];
    this.setData({ customFoods });
    this.saveCustomFoods();
    this.mergeFoods();
    
    // 同时添加到饮食记录
    this.addFood(newCustomFood, false);
  },

  // 删除自定义食物
  onDeleteCustomFood(e) {
    const foodId = e.currentTarget.dataset.id;
    const foodName = e.currentTarget.dataset.name;
    
    wx.showModal({
      title: '删除食物',
      content: `确定要删除 "${foodName}" 吗？`,
      confirmColor: '#FF6B35',
      success: (res) => {
        if (res.confirm) {
          const customFoods = this.data.customFoods.filter(f => f.id !== foodId);
          this.setData({ customFoods });
          this.saveCustomFoods();
          this.mergeFoods();
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  },

  // 阻止删除按钮触发选择食物
  onPreventTap() {
    // 空函数，用于阻止事件冒泡
  },

  onSave() {
    const { name, calories } = this.data.customFood;
    
    if (name.trim() && calories && parseFloat(calories) > 0) {
      this.onAddCustomFood();
    } else {
      wx.showToast({
        title: '请先添加食物',
        icon: 'none',
        duration: 1500
      });
    }
  },

  onBack() {
    wx.navigateBack();
  }
});
