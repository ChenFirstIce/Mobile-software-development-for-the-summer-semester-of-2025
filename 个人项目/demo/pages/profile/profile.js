// pages/profile/profile.js
const app = getApp()

Page({
  data: {
    userInfo: {},
    updateLogs: []
  },

  onLoad: function (options) {
    this.getUserInfo()
  },

  onShow: function () {
    this.getUserInfo()
  },

  // 获取用户信息
  getUserInfo: function () {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      })
    } else {
      // 如果没有用户信息，尝试获取
      this.getWechatUserInfo()
    }
  },

  // 获取微信用户信息
  getWechatUserInfo: function () {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo
        app.globalData.userInfo = userInfo
        this.setData({
          userInfo: userInfo
        })
        // 保存到本地存储
        wx.setStorageSync('userInfo', userInfo)
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err)
        app.showToast('获取用户信息失败')
      }
    })
  },

  // 编辑昵称
  editNickname: function () {
    wx.showModal({
      title: '编辑昵称',
      content: '请输入新的昵称',
      editable: true,
      placeholderText: this.data.userInfo.nickName || '请输入昵称',
      success: (res) => {
        if (res.confirm && res.content) {
          const newNickname = res.content.trim()
          if (newNickname) {
            const userInfo = { ...this.data.userInfo, nickName: newNickname }
            this.setData({ userInfo })
            app.globalData.userInfo = userInfo
            wx.setStorageSync('userInfo', userInfo)
            app.showToast('昵称更新成功')
          }
        }
      }
    })
  },

  // 更换头像
  changeAvatar: function () {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        // 这里可以调用云函数上传头像
        // 暂时直接更新本地显示
        const userInfo = { ...this.data.userInfo, avatarUrl: tempFilePath }
        this.setData({ userInfo })
        app.globalData.userInfo = userInfo
        wx.setStorageSync('userInfo', userInfo)
        app.showToast('头像更新成功')
      },
      fail: (err) => {
        console.error('选择图片失败:', err)
        app.showToast('选择图片失败')
      }
    })
  },

  // 退出登录
  logout: function () {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除用户信息
          app.globalData.userInfo = null
          wx.removeStorageSync('userInfo')
          wx.removeStorageSync('recentActivities')
          
          // 返回首页
          wx.switchTab({
            url: '/pages/index/index'
          })
          
          app.showToast('已退出登录')
        }
      }
    })
  },

  // 查看更新日志详情
  viewUpdateLog: function (e) {
    const index = e.currentTarget.dataset.index
    const log = this.data.updateLogs[index]
    
    wx.showModal({
      title: `${log.version} - ${log.date}`,
      content: log.changes.join('\n'),
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 联系客服
  contactService: function () {
    wx.showModal({
      title: '联系客服',
      content: '如有问题请联系客服微信：travel_assistant',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 关于我们
  aboutUs: function () {
    wx.showModal({
      title: '关于我们',
      content: '旅冰GO v1.0.0\n\n让每一次旅行都充满乐趣！',
      showCancel: false,
      confirmText: '知道了'
    })
  }
})
