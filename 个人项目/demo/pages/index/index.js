// pages/index/index.js
const app = getApp()

Page({
  data: {
    userInfo: {},
    recentActivities: []
  },

  onLoad: function (options) {
    this.checkLoginAndRedirect()
  },

  onShow: function () {
    // 页面显示时检查登录状态
    this.checkLoginAndRedirect()
  },

  // 检查登录状态并重定向
  checkLoginAndRedirect: function () {
    const isLoggedIn = wx.getStorageSync('userToken') ? true : false
    
    if (!isLoggedIn) {
      // 未登录，跳转到登录页面
      wx.redirectTo({
        url: '/pages/profile/profile'
      })
      return
    }
    
    // 已登录，加载数据
    this.getUserInfo()
    this.loadRecentActivities()
  },

  onShow: function () {
    // 页面显示时刷新数据
    this.loadRecentActivities()
  },

  // 获取用户信息
  getUserInfo: function () {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      })
    } else {
      // 监听用户信息获取
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo
        })
      }
    }
  },

  // 加载最近活动
  loadRecentActivities: function () {
    // 从本地存储或云数据库获取最近活动
    const activities = wx.getStorageSync('recentActivities') || []
    this.setData({
      recentActivities: activities.slice(0, 5) // 只显示最近5条
    })
  },

  // 导航到相册页面
  navigateToAlbum: function () {
    wx.switchTab({
      url: '/pages/album/album'
    })
  },

  // 导航到地图页面
  navigateToMap: function () {
    wx.switchTab({
      url: '/pages/map/map'
    })
  },

  // 导航到酒店比价页面
  navigateToHotel: function () {
    wx.navigateTo({
      url: '/pages/hotel/hotel'
    })
  },

  // 导航到旅游群页面
  navigateToGroup: function () {
    wx.switchTab({
      url: '/pages/group/group'
    })
  },


  // 导航到个人设置页面
  navigateToProfile: function () {
    wx.navigateTo({
      url: '/pages/profile/profile'
    })
  },

  // 快速打卡
  quickCheckin: function () {
    wx.navigateTo({
      url: '/pages/checkin/checkin'
    })
  },

  // 快速拍照
  quickPhoto: function () {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        // 保存到相册或创建新相册
        this.saveQuickPhoto(tempFilePath)
      },
      fail: (err) => {
        console.error('拍照失败:', err)
        app.showToast('拍照失败')
      }
    })
  },

  // 保存快速拍照
  saveQuickPhoto: function (filePath) {
    // 保存到本地存储
    app.showToast('照片已保存')
    
    // 添加到最近活动
    this.addRecentActivity({
      id: Date.now(),
      icon: '📸',
      title: '拍照记录',
      time: this.formatTime(new Date())
    })
  },

  // 快速路线规划
  quickRoute: function () {
    wx.navigateTo({
      url: '/pages/map/map?action=route'
    })
  },

  // 查看活动详情
  viewActivity: function (e) {
    const activityId = e.currentTarget.dataset.id
    // 根据活动类型跳转到相应页面
    console.log('查看活动:', activityId)
  },

  // 添加最近活动
  addRecentActivity: function (activity) {
    let activities = wx.getStorageSync('recentActivities') || []
    activities.unshift(activity)
    
    // 限制数量，只保留最近20条
    if (activities.length > 20) {
      activities = activities.slice(0, 20)
    }
    
    wx.setStorageSync('recentActivities', activities)
    this.loadRecentActivities()
  },

  // 格式化时间
  formatTime: function (date) {
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) { // 1分钟内
      return '刚刚'
    } else if (diff < 3600000) { // 1小时内
      return Math.floor(diff / 60000) + '分钟前'
    } else if (diff < 86400000) { // 1天内
      return Math.floor(diff / 3600000) + '小时前'
    } else if (diff < 2592000000) { // 30天内
      return Math.floor(diff / 86400000) + '天前'
    } else {
      return date.toLocaleDateString()
    }
  }
})
