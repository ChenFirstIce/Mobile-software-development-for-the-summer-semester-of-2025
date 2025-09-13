// app.js
App({
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    currentLocation: null,
    mapType: 'basic', 
    checkinPoints: [],
    albums: [],
    groups: [],
    tencentMapKey: 'GATBZ-WPSKB-TWMUT-JE336-7DZM2-QJFH7' // 请替换为您的腾讯地图API密钥
  },

  onLaunch: function () {
    // 初始化云开发
    this.initCloud()
    
    // 初始化全局数据
    this.initGlobalData()
    
    // 检查登录状态，如果未登录则跳转到个人页面
    this.checkLoginAndRedirect()
  },

  // 初始化云开发
  initCloud: function() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }
    
    wx.cloud.init({
      env: 'cloud1-3gfit3n1e60214ef', // 云开发环境ID
      traceUser: true, 
    })
    
    console.log('云开发初始化成功')
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



  // 微信登录（云开发版本）
  wxLogin: function() {
    return new Promise((resolve, reject) => {
      // 先获取用户信息，再进行登录
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (profileRes) => {
          const userInfo = profileRes.userInfo
          console.log('获取用户信息成功:', userInfo)
          
          // 调用 wx.login 获取 code
          wx.login({
            success: (loginRes) => {
              console.log('wx.login 成功，code:', loginRes.code)
              if (loginRes.code) {
                // 调用云函数进行登录，同时传递用户信息
                wx.cloud.callFunction({
                  name: 'userLogin',
                  data: {
                    code: loginRes.code,
                    userInfo: userInfo
                  },
                  success: (res) => {
                    console.log('云函数调用成功:', res)
                    if (res.result.success) {
                      const userData = res.result.data
                      
                      // 保存到本地存储
                      wx.setStorageSync('userToken', userData._id)
                      wx.setStorageSync('userInfo', userData)
                      
                      // 更新全局数据
                      this.globalData.userInfo = userData
                      this.globalData.isLoggedIn = true
                      
                      console.log('登录成功:', userData)
                      resolve(userData)
                    } else {
                      reject(new Error(res.result.message || '登录失败'))
                    }
                  },
                  fail: (error) => {
                    console.error('云函数调用失败:', error)
                    reject(error)
                  }
                })
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
          reject(new Error('需要授权才能登录'))
        }
      })
    })
  },

  // 获取用户信息（云开发版本）
  getUserProfile: function() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          const userInfo = res.userInfo
          console.log('获取用户信息成功:', userInfo)
          
          // 调用云函数更新用户信息
          wx.cloud.callFunction({
            name: 'updateUserInfo',
            data: {
              userInfo: userInfo
            },
            success: (res) => {
              console.log('更新用户信息成功:', res)
              if (res.result.success) {
                const updatedUserInfo = res.result.data
                
                // 更新本地存储
                wx.setStorageSync('userInfo', updatedUserInfo)
                
                // 更新全局数据
                this.globalData.userInfo = updatedUserInfo
                
                resolve(updatedUserInfo)
              } else {
                reject(new Error(res.result.message || '更新用户信息失败'))
              }
            },
            fail: (error) => {
              console.error('更新用户信息失败:', error)
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
