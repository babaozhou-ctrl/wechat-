// components/ec-canvas/ec-canvas.js
import * as echarts from './echarts.js';

Component({
  properties: {
    canvasId: {
      type: String,
      value: 'ec-canvas'
    },
    ec: {
      type: Object
    }
  },

  data: {
    isUseNewCanvas: true
  },

  lifetimes: {
    ready() {
      if (!this.data.ec) {
        console.warn('组件需绑定 ec 变量，例：<ec-canvas ec="{{ ec }}"></ec-canvas>');
        return;
      }

      if (!this.data.ec.onInit) {
        console.warn('需传入 onInit 函数');
        return;
      }

      this.init();
    }
  },

  methods: {
    init() {
      const query = wx.createSelectorQuery().in(this);
      query.select(`#${this.data.canvasId}`)
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0] || !res[0].node) {
            console.error('无法获取 canvas 节点');
            return;
          }

          const canvasNode = res[0].node;
          const canvasWidth = res[0].width;
          const canvasHeight = res[0].height;

          const ctx = canvasNode.getContext('2d');
          const dpr = wx.getSystemInfoSync().pixelRatio;

          canvasNode.width = canvasWidth * dpr;
          canvasNode.height = canvasHeight * dpr;
          ctx.scale(dpr, dpr);

          echarts.setCanvasCreator({
            createCanvas: () => {
              canvasNode.addEventListener || (canvasNode.attachEvent = () => {});
              return canvasNode;
            }
          });

          this.chart = this.data.ec.onInit(canvasNode, canvasWidth, canvasHeight, dpr);
        });
    }
  }
});
