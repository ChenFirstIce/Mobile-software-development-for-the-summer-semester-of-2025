const app = getApp()

Page({
  data: {
    groupId: '',
    inputContent: '',
    historyItems: []
  },

  onLoad: function (options) {
    if (options.groupId) {
      this.setData({
        groupId: options.groupId
      })
      this.loadHistoryItems()
      this.loadUserInput()
    }
  },

  // 加载历史项目
  loadHistoryItems: function () {
    const wheelData = wx.getStorageSync(`wheel_${this.data.groupId}`) || []
    this.setData({
      historyItems: wheelData
    })
  },

  // 加载当前用户已输入的内容
  loadUserInput: function () {
    const currentUser = app.globalData.userInfo
    if (!currentUser) return
    
    const wheelData = wx.getStorageSync(`wheel_${this.data.groupId}`) || []
    const userItem = wheelData.find(item => item.userId === currentUser.id)
    
    if (userItem) {
      this.setData({
        inputContent: userItem.content
      })
    }
  },

  // 输入内容变化
  onInputChange: function (e) {
    this.setData({
      inputContent: e.detail.value
    })
  },

  // 确认输入
  confirmInput: function () {
    const content = this.data.inputContent.trim()
    if (!content) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      })
      return
    }
    
    const currentUser = app.globalData.userInfo
    if (!currentUser) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    
    // 保存输入内容
    let wheelData = wx.getStorageSync(`wheel_${this.data.groupId}`) || []
    
    // 检查是否已存在当前用户的输入
    const userIndex = wheelData.findIndex(item => item.userId === currentUser.id)
    
    const newItem = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.nickName || '未知用户',
      userAvatar: currentUser.avatarUrl,
      content: content,
      timestamp: new Date().toISOString()
    }
    
    if (userIndex >= 0) {
      // 更新现有内容
      wheelData[userIndex] = newItem
    } else {
      // 添加新内容
      wheelData.push(newItem)
    }
    
    wx.setStorageSync(`wheel_${this.data.groupId}`, wheelData)
    
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    })
    
    // 返回上一页
    setTimeout(() => {
      wx.navigateBack()
    }, 1000)
  },

  // 返回上一页
  navigateBack: function () {
    wx.navigateBack()
  }
})