// app.js
App({
  onLaunch: function () {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-3gfit3n1e60214ef', // 请替换为您的云开发环境ID
        traceUser: true,
      })
    }

    // 检查登录状态
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus: function() {
    const token = wx.getStorageSync('userToken')
    if (token) {
      // 验证token有效性
      this.validateToken(token)
    } else {
      // 引导用户登录
      this.showLoginGuide()
    }
  },

  // 验证token
  validateToken: function(token) {
    // 这里应该调用后端API验证token
    // 暂时模拟验证成功
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
      this.globalData.isLoggedIn = true
    } else {
      this.showLoginGuide()
    }
  },

  // 显示登录引导
  showLoginGuide: function() {
    // 可以在这里显示登录引导页面
    console.log('需要登录')
  },

  // 微信登录
  wxLogin: function() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            // 发送 res.code 到后台换取 openId, sessionKey, unionId
            this.getUserProfile(res.code)
              .then(resolve)
              .catch(reject)
          } else {
            reject(new Error('登录失败'))
          }
        },
        fail: reject
      })
    })
  },

  // 获取用户信息
  getUserProfile: function(code) {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          const userInfo = res.userInfo
          
          // 调用云函数进行登录
          wx.cloud.callFunction({
            name: 'login',
            data: {
              userInfo: userInfo
            },
            success: (result) => {
              if (result.result.success) {
                const { openid, unionid, user } = result.result
                
                // 构建完整的用户信息
                const fullUserInfo = {
                  ...userInfo,
                  id: user._id,
                  openId: openid,
                  unionId: unionid,
                  ...user
                }
                
                // 保存到本地存储
                wx.setStorageSync('userToken', openid)
                wx.setStorageSync('userInfo', fullUserInfo)
                
                // 更新全局数据
                this.globalData.userInfo = fullUserInfo
                this.globalData.isLoggedIn = true
                
                resolve(fullUserInfo)
              } else {
                reject(new Error(result.result.error || '登录失败'))
              }
            },
            fail: (error) => {
              console.error('云函数调用失败:', error)
              reject(error)
            }
          })
        },
        fail: reject
      })
    })
  },

  // 获取好友列表
  getFriendList: function() {
    return new Promise((resolve, reject) => {
      // 注意：微信小程序无法直接获取好友列表
      // 这里需要通过后端API获取
      // 或者使用微信开放平台的接口
      
      // 模拟好友数据
      const friends = []
      
      resolve(friends)
    })
  },

  globalData: {
    userInfo: null,
    isLoggedIn: false,
    currentLocation: null,
    mapType: 'basic', 
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
