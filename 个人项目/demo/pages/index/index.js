// pages/index/index.js
const app = getApp()
const util = require('../../utils/util')

Page({
  data: {
    userInfo: {},
    recentActivities: []
  },

  onLoad: function (options) {
    util.checkLoginAndRedirect(this, this.onLoggedIn)
  },

  onShow: function () {
    // 页面显示时检查登录状态
    util.checkLoginAndRedirect(this, this.onLoggedIn)
  },

  // 登录成功后的回调
  onLoggedIn: function () {
    this.getUserInfo()
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
    // 直接跳转到相册页面，让用户在相册中拍照
    this.navigateToDefaultAlbum()
  },

  // 快速路线规划
  quickRoute: function () {
    wx.navigateTo({
      url: '/pages/route/route'
    })
  },

  // 导航到默认相册
  navigateToDefaultAlbum: function () {
    // 检查是否存在默认相册
    let albums = wx.getStorageSync('albums') || []
    let defaultAlbum = albums.find(album => album.isDefault === true)
    
    if (!defaultAlbum) {
      // 如果没有默认相册，创建一个
      defaultAlbum = {
        id: 'default_' + Date.now(),
        name: '默认相册',
        description: '快速拍照的默认相册',
        isDefault: true,
        type: 'default',
        coverImage: '',
        photoCount: 0,
        photos: [],
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
      }
      
      // 保存到本地存储
      albums.unshift(defaultAlbum)
      wx.setStorageSync('albums', albums)
      
      app.showToast('已创建默认相册')
    }
    
    // 跳转到相册详情页面
    wx.navigateTo({
      url: `/pages/album/detail?id=${defaultAlbum.id}&fromQuickPhoto=true`
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
