// 语音播报工具类
// 微信小程序环境兼容

class VoicePlayer {
  constructor() {
    this.audioContext = null;
    this.isInitialized = false;
    this.isSpeaking = false;
  }

  // 初始化语音上下文
  init() {
    if (this.isInitialized) return;
    
    try {
      this.audioContext = wx.createInnerAudioContext();
      this.audioContext.onError((err) => {
        console.warn('语音播放失败:', err);
        this.isSpeaking = false;
      });
      this.audioContext.onEnded(() => {
        this.isSpeaking = false;
      });
      this.isInitialized = true;
    } catch (e) {
      console.error('初始化语音失败:', e);
    }
  }

  // 播报文字
  speak(text) {
    if (!text) return;
    
    this.init();
    
    // 显示文字提示
    wx.showToast({
      title: text,
      icon: 'none',
      duration: 1500
    });
    
    // 震动反馈
    this.vibrateByContent(text);
    
    // 尝试使用微信的语音合成（如果有后端支持）
    this.playWithAudio(text);
  }

  // 根据内容震动
  vibrateByContent(text) {
    if (text.includes('开始')) {
      wx.vibrateLong();
    } else if (text.includes('暂停')) {
      wx.vibrateShort();
    } else if (text.includes('继续') || text.includes('加油')) {
      wx.vibrateShort();
      setTimeout(() => wx.vibrateShort(), 150);
    } else if (text.includes('完成') || text.includes('结束')) {
      wx.vibrateLong();
      setTimeout(() => wx.vibrateLong(), 300);
    } else if (text.includes('公里')) {
      wx.vibrateShort();
    }
  }

  // 尝试播放语音（需要后端提供语音文件URL）
  playWithAudio(text) {
    // 这里可以接入腾讯云语音合成API
    // 示例：使用在线TTS服务
    // const url = `https://api.tts.com/speak?text=${encodeURIComponent(text)}`;
    // this.audioContext.src = url;
    // this.audioContext.play();
    
    // 暂时标记为已完成
    this.isSpeaking = false;
  }

  // 停止播报
  stop() {
    if (this.audioContext) {
      this.audioContext.stop();
    }
    this.isSpeaking = false;
  }
}

// 导出类
module.exports = VoicePlayer;