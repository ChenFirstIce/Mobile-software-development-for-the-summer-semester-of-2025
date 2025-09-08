// app.js
App({
  onLaunch: function () {
    // 初始化全局数据
    this.initGlobalData()
    
    // 检查登录状态，如果未登录则跳转到个人页面
    this.checkLoginAndRedirect()
  },

  // 初始化全局数据
  initGlobalData: function() {
    const token = wx.getStorageSync('userToken')
    const userInfo = wx.getStorageSync('userInfo')
    
    if (token && userInfo) {
      this.globalData.userInfo = userInfo
      this.globalData.isLoggedIn = true
    } else {
      this.globalData.userInfo = null
      this.globalData.isLoggedIn = false
    }
  },

  // 检查登录状态
  checkLoginStatus: function() {
    const token = wx.getStorageSync('userToken')
    const userInfo = wx.getStorageSync('userInfo')
    
    if (token && userInfo) {
      this.globalData.userInfo = userInfo
      this.globalData.isLoggedIn = true
      return true
    } else {
      this.globalData.userInfo = null
      this.globalData.isLoggedIn = false
      return false
    }
  },

  // 检查登录状态并重定向
  checkLoginAndRedirect: function() {
    if (!this.checkLoginStatus()) {
      // 延迟跳转，确保页面加载完成
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/profile/profile'
        })
      }, 100)
    }
  },



  // 微信登录
  wxLogin: function() {
    return new Promise((resolve, reject) => {
      // 获取用户信息
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          const userInfo = res.userInfo
          console.log('获取用户信息成功:', userInfo)
          
          // 调用 wx.login 获取 code
          wx.login({
            success: (loginRes) => {
              console.log('wx.login 成功，code:', loginRes.code)
              if (loginRes.code) {
                try {
                  // 生成用户ID
                  const userId = 'user_' + Date.now()
                  
                  // 构建完整的用户信息
                  const fullUserInfo = {
                    ...userInfo,
                    id: userId,
                    openId: loginRes.code,
                    unionId: '',
                    createTime: new Date(),
                    updateTime: new Date(),
                    lastLoginTime: new Date()
                  }
                  
                  // 保存到本地存储
                  wx.setStorageSync('userToken', userId)
                  wx.setStorageSync('userInfo', fullUserInfo)
                  
                  // 更新全局数据
                  this.globalData.userInfo = fullUserInfo
                  this.globalData.isLoggedIn = true
                  
                  console.log('登录成功:', fullUserInfo)
                  resolve(fullUserInfo)
                  
                } catch (error) {
                  console.error('登录失败:', error)
                  reject(error)
                }
              } else {
                reject(new Error('获取登录凭证失败'))
              }
            },
            fail: (error) => {
              console.error('wx.login 失败:', error)
              reject(error)
            }
          })
        },
        fail: (error) => {
          console.error('获取用户信息失败:', error)
          reject(error)
        }
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
  },


})
