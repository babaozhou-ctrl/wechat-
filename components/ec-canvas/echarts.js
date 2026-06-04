/**
 * ECharts 微信小程序精简版
 * 基于 ECharts 5.x 的小程序适配
 */
var echarts = {
  version: '5.0.0-mini',
  dependencies: {}
};

// 简单的二维数组转置
echarts.transpose = function(data) {
  if (!data || !data.length) return [];
  return data[0].map(function(_, i) {
    return data.map(function(row) {
      return row[i];
    });
  });
};

// 获取 canvas creator
echarts.setCanvasCreator = function(options) {
  echarts._canvasCreator = options.createCanvas;
};

// 创建一个图表实例（简化版）
echarts.init = function(canvas, option) {
  var chart = {
    canvas: canvas,
    option: option,
    setOption: function(opt) {
      this.option = opt;
      this._render();
    },
    _render: function() {
      // 简化的渲染逻辑
      var ctx = canvas.getContext('2d');
      var opt = this.option;
      if (!opt) return;
      
      // 绘制饼图
      if (opt.series) {
        opt.series.forEach(function(series) {
          if (series.type === 'pie' && series.data) {
            var total = series.data.reduce(function(sum, item) {
              return sum + (item.value || 0);
            }, 0);
            
            var centerX = series.center ? 
              (series.center[0].indexOf('%') > -1 ? 
                parseFloat(series.center[0]) / 100 * canvas.width / 2 : 
                series.center[0]) : 
              canvas.width / 4;
            var centerY = series.center ? 
              (series.center[1].indexOf('%') > -1 ? 
                parseFloat(series.center[1]) / 100 * canvas.height / 2 : 
                series.center[1]) : 
              canvas.height / 2;
            var radius = series.radius ? 
              (typeof series.radius === 'string' ? 
                parseFloat(series.radius) : 
                series.radius[0] || 100) : 
              100;
            
            var startAngle = -Math.PI / 2;
            var height = canvas.height * 0.3;
            
            series.data.forEach(function(item) {
              if (item.value === undefined || item.value === 0) return;
              
              var ratio = item.value / total;
              var endAngle = startAngle + ratio * Math.PI * 2;
              
              ctx.beginPath();
              ctx.moveTo(centerX, centerY);
              ctx.arc(centerX, centerY, radius, startAngle, endAngle);
              ctx.closePath();
              ctx.setFillStyle(item.itemStyle && item.itemStyle.color || '#5B8DEF');
              ctx.fill();
              
              // 绘制边框
              ctx.beginPath();
              ctx.arc(centerX, centerY, radius, startAngle, endAngle);
              ctx.stroke();
              
              startAngle = endAngle;
            });
            
            // 绘制中心文字
            ctx.setFillStyle('#333');
            ctx.setFont('bold 24px sans-serif');
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(total.toString(), centerX, centerY - 10);
            ctx.setFont('12px sans-serif');
            ctx.fillText('千卡', centerX, centerY + 15);
          }
        });
      }
    },
    dispose: function() {
      this.canvas = null;
      this.option = null;
    }
  };
  
  if (option) {
    chart.setOption(option);
  }
  
  return chart;
};

module.exports = echarts;
