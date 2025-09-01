// app.js
App({
  onLaunch: function () {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'your-env-id', // 请替换为您的云开发环境ID
        traceUser: true,
      })
    }

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: res => {
              this.globalData.userInfo = res.userInfo
            }
          })
        }
      }
    })
  },

  globalData: {
    userInfo: null,
    currentLocation: null,
    mapType: 'basic', // basic 或 special
    checkinPoints: [],
    albums: [],
    groups: []
  },

  // 获取当前位置
  getCurrentLocation: function() {
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'gcj02',
        success: (res) => {
          this.globalData.currentLocation = {
            latitude: res.latitude,
            longitude: res.longitude
          }
          resolve(res)
        },
        fail: reject
      })
    })
  },

  // 显示提示信息
  showToast: function(title, icon = 'none') {
    wx.showToast({
      title: title,
      icon: icon,
      duration: 2000
    })
  },

  // 显示加载中
  showLoading: function(title = '加载中...') {
    wx.showLoading({
      title: title,
      mask: true
    })
  },

  // 隐藏加载中
  hideLoading: function() {
    wx.hideLoading()
  }
})
