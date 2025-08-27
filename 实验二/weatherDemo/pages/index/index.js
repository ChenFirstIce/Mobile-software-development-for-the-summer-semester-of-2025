// pages/index/index.js
Page({
  data: {
    region: ['山东省', '青岛市', '黄岛区'], // 默认地区
    location: '山东省青岛市黄岛区', // 地理位置
    id: 101120206, // 城市ID
    now: '' // 当前天气信息
  },

  /*更改地区*/
  regionChange: function(e) {
    this.setData({
      region: e.detail.value // 更新地区数据
    });
    this.getWeather();
  },
  /*获取城市的ID */
  getLocationId: function() {
    let that = this;
    wx.request({
      url: 'https://kt759fhyb6.re.qweatherapi.com/geo/v2/city/lookup',
      data: {
        location: that.data.region, 
        key: 'b00289f9d1654b17a169c3f5d497ad16' 
      },

      success(res) {
        console.log(res.data.location[0].id)
        that.setData({
          id: res.data.location[0].id 
        });
      }
    });
  },

  // 获取当前天气信息
  getWeather: function() {
    let that = this;
    that.getLocationId();
    wx.request({
      url: 'https://kt759fhyb6.re.qweatherapi.com/v7/weather/now',
      data: {
        location: that.data.id, 
        key: 'b00289f9d1654b17a169c3f5d497ad16' 
      },
      success(res) {
        console.log(res.data.now)
        that.setData({
          now: res.data.now 
        });
      }
    });
  },

  // 页面加载时调用
  onLoad(options) {
      this.getWeather();

  },

  onReady() {}, // 页面初次渲染完成时调用

  onShow() {}, // 页面显示时调用

  onHide() {}, // 页面隐藏时调用

  onUnload() {}, // 页面卸载时调用

  onPullDownRefresh() {}, // 用户下拉动作时调用

  onReachBottom() {}, // 页面上拉触底事件的处理函数

  onShareAppMessage() {} // 用户点击右上角分享时调用
});