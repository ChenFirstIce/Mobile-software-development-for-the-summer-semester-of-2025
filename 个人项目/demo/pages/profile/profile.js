// pages/profile/profile.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    showLoginModal: false
  },

  onLoad: function (options) {
    this.checkLoginStatus()
  },

  onShow: function () {
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus: function () {
    const userInfo = wx.getStorageSync('userInfo')
    const isLoggedIn = wx.getStorageSync('userToken') ? true : false
    
    this.setData({
      userInfo: userInfo,
      isLoggedIn: isLoggedIn
    })
  },

  // 显示登录弹窗
  showLoginModal: function () {
    this.setData({
      showLoginModal: true
    })
  },

  // 隐藏登录弹窗
  hideLoginModal: function () {
    this.setData({
      showLoginModal: false
    })
  },

  // 微信授权登录
  wxLogin: function () {
    wx.showLoading({
      title: '登录中...'
    })

    app.wxLogin()
      .then((userInfo) => {
        wx.hideLoading()
        this.setData({
          userInfo: userInfo,
          isLoggedIn: true,
          showLoginModal: false
        })
        app.showToast('登录成功')
        
        // 登录成功后跳转到首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }, 1500)
      })
      .catch((error) => {
        wx.hideLoading()
        console.error('登录失败:', error)
        app.showToast('登录失败，请重试')
      })
  },

  // 退出登录
  logout: function () {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储
          wx.removeStorageSync('userToken')
          wx.removeStorageSync('userInfo')
          
          // 更新全局数据
          app.globalData.userInfo = null
          app.globalData.isLoggedIn = false
          
          // 更新页面数据
          this.setData({
            userInfo: null,
            isLoggedIn: false
          })
          
          app.showToast('已退出登录')
        }
      }
    })
  },

  // 编辑个人信息
  editProfile: function () {
    if (!this.data.isLoggedIn) {
      this.showLoginModal()
      return
    }
    
    wx.navigateTo({
      url: '/pages/profile/edit'
    })
  },

  // 查看设置
  goToSettings: function () {
    wx.navigateTo({
      url: '/pages/profile/settings'
    })
  },

  // 关于我们
  goToAbout: function () {
    wx.navigateTo({
      url: '/pages/profile/about'
    })
  },

  // 帮助中心
  goToHelp: function () {
    wx.navigateTo({
      url: '/pages/profile/help'
    })
  },

  // 意见反馈
  goToFeedback: function () {
    wx.navigateTo({
      url: '/pages/profile/feedback'
    })
  },

  // 阻止事件冒泡
  stopPropagation: function () {
    // 空函数，用于阻止事件冒泡
  }
})
