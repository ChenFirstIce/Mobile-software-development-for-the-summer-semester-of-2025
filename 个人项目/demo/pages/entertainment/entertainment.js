// pages/entertainment/entertainment.js
const app = getApp()

Page({
  data: {
    // 功能卡片
    features: [
      {
        id: 'wheel',
        name: '随机轮盘',
        icon: '🎲',
        desc: '创建转盘，随机选择目的地或活动',
        color: '#FF6B6B',
        path: '/pages/entertainment/wheel'
      },
      {
        id: 'vote',
        name: '价格投票',
        icon: '💰',
        desc: '匿名投票，预测最低价和最高价',
        color: '#4ECDC4',
        path: '/pages/entertainment/vote'
      },
      {
        id: 'game',
        name: '旅行小游戏',
        icon: '🎮',
        desc: '有趣的旅行相关小游戏',
        color: '#45B7D1',
        path: '/pages/entertainment/game'
      },
      {
        id: 'share',
        name: '结果分享',
        icon: '📤',
        desc: '分享你的娱乐结果到朋友圈',
        color: '#96CEB4',
        path: '/pages/entertainment/share'
      }
    ],
    
    // 最近活动
    recentActivities: [],
    
    // 快速创建
    quickCreate: {
      wheel: {
        name: '',
        options: [''],
        showModal: false
      },
      vote: {
        title: '',
        description: '',
        showModal: false
      }
    }
  },

  onLoad: function (options) {
    this.loadRecentActivities()
  },

  onShow: function () {
    // 页面显示时刷新数据
    this.loadRecentActivities()
  },

  // 加载最近活动
  loadRecentActivities: function () {
    const activities = wx.getStorageSync('entertainmentActivities') || []
    this.setData({
      recentActivities: activities.slice(0, 5) // 只显示最近5条
    })
  },

  // 添加活动记录
  addActivity: function (type, content, result = null) {
    const userInfo = app.globalData.userInfo
    if (!userInfo) return
    
    const activity = {
      id: Date.now(),
      type: type,
      content: content,
      result: result,
      time: new Date().toISOString(),
      userName: userInfo.nickName || '未知用户'
    }
    
    let activities = wx.getStorageSync('entertainmentActivities') || []
    activities.unshift(activity)
    
    // 只保留最近50条记录
    if (activities.length > 50) {
      activities = activities.slice(0, 50)
    }
    
    wx.setStorageSync('entertainmentActivities', activities)
    
    // 更新页面显示
    this.loadRecentActivities()
  },

  // 打开功能页面
  openFeature: function (e) {
    const feature = e.currentTarget.dataset.feature
    
    // 检查功能是否可用
    if (feature.id === 'wheel') {
      this.showWheelModal()
    } else if (feature.id === 'vote') {
      this.showVoteModal()
    } else if (feature.id === 'game') {
      this.openGame()
    } else if (feature.id === 'share') {
      this.openShare()
    }
  },

  // 显示轮盘创建弹窗
  showWheelModal: function () {
    this.setData({
      'quickCreate.wheel.showModal': true
    })
  },

  // 隐藏轮盘创建弹窗
  hideWheelModal: function () {
    this.setData({
      'quickCreate.wheel.showModal': false,
      'quickCreate.wheel.name': '',
      'quickCreate.wheel.options': ['']
    })
  },

  // 轮盘名称输入
  onWheelNameInput: function (e) {
    this.setData({
      'quickCreate.wheel.name': e.detail.value
    })
  },

  // 轮盘选项输入
  onWheelOptionInput: function (e) {
    const index = e.currentTarget.dataset.index
    const value = e.detail.value
    const options = [...this.data.quickCreate.wheel.options]
    options[index] = value
    this.setData({
      'quickCreate.wheel.options': options
    })
  },

  // 添加轮盘选项
  addWheelOption: function () {
    const options = [...this.data.quickCreate.wheel.options, '']
    this.setData({
      'quickCreate.wheel.options': options
    })
  },

  // 删除轮盘选项
  removeWheelOption: function (e) {
    const index = e.currentTarget.dataset.index
    const options = [...this.data.quickCreate.wheel.options]
    if (options.length > 1) {
      options.splice(index, 1)
      this.setData({
        'quickCreate.wheel.options': options
      })
    }
  },

  // 创建轮盘
  createWheel: function () {
    const { name, options } = this.data.quickCreate.wheel
    
    if (!name.trim()) {
      app.showToast('请输入轮盘名称', 'none')
      return
    }
    
    const validOptions = options.filter(opt => opt.trim() !== '')
    if (validOptions.length < 2) {
      app.showToast('至少需要2个选项', 'none')
      return
    }
    
    // 创建轮盘数据
    const wheelData = {
      id: Date.now().toString(),
      name: name,
      options: validOptions,
      createTime: new Date().toISOString(),
      creator: app.globalData.userInfo ? app.globalData.userInfo.nickName : '未知用户'
    }
    
    // 保存到本地存储
    let wheels = wx.getStorageSync('wheels') || []
    wheels.unshift(wheelData)
    wx.setStorageSync('wheels', wheels)
    
    // 添加活动记录
    this.addActivity('wheel', `创建了轮盘：${name}`, `包含${validOptions.length}个选项`)
    
    // 隐藏弹窗
    this.hideWheelModal()
    
    // 跳转到轮盘页面
    wx.navigateTo({
      url: `/pages/entertainment/wheel?id=${wheelData.id}`
    })
  },

  // 显示投票创建弹窗
  showVoteModal: function () {
    this.setData({
      'quickCreate.vote.showModal': true
    })
  },

  // 隐藏投票创建弹窗
  hideVoteModal: function () {
    this.setData({
      'quickCreate.vote.showModal': false,
      'quickCreate.vote.title': '',
      'quickCreate.vote.description': ''
    })
  },

  // 投票标题输入
  onVoteTitleInput: function (e) {
    this.setData({
      'quickCreate.vote.title': e.detail.value
    })
  },

  // 投票描述输入
  onVoteDescriptionInput: function (e) {
    this.setData({
      'quickCreate.vote.description': e.detail.value
    })
  },

  // 创建投票
  createVote: function () {
    const { title, description } = this.data.quickCreate.vote
    
    if (!title.trim()) {
      app.showToast('请输入投票标题', 'none')
      return
    }
    
    // 创建投票数据
    const voteData = {
      id: Date.now().toString(),
      title: title,
      description: description,
      createTime: new Date().toISOString(),
      creator: app.globalData.userInfo ? app.globalData.userInfo.nickName : '未知用户',
      participants: [],
      minPrices: [],
      maxPrices: [],
      status: 'active'
    }
    
    // 保存到本地存储
    let votes = wx.getStorageSync('votes') || []
    votes.unshift(voteData)
    wx.setStorageSync('votes', votes)
    
    // 添加活动记录
    this.addActivity('vote', `创建了投票：${title}`, description)
    
    // 隐藏弹窗
    this.hideVoteModal()
    
    // 跳转到投票页面
    wx.navigateTo({
      url: `/pages/entertainment/vote?id=${voteData.id}`
    })
  },

  // 打开游戏
  openGame: function () {
    app.showToast('游戏功能开发中', 'none')
    
    // 模拟游戏活动
    setTimeout(() => {
      this.addActivity('game', '玩了旅行小游戏', '获得了100积分')
    }, 1000)
  },

  // 打开分享
  openShare: function () {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    
    app.showToast('分享功能已启用', 'success')
  },

  // 查看活动详情
  viewActivity: function (e) {
    const activity = e.currentTarget.dataset.activity
    
    if (activity.type === 'wheel') {
      // 跳转到轮盘页面
      wx.navigateTo({
        url: `/pages/entertainment/wheel`
      })
    } else if (activity.type === 'vote') {
      // 跳转到投票页面
      wx.navigateTo({
        url: `/pages/entertainment/vote`
      })
    } else {
      app.showToast('功能开发中', 'none')
    }
  },

  // 查看所有活动
  viewAllActivities: function () {
    // 这里可以跳转到一个活动历史页面
    app.showToast('活动历史功能开发中', 'none')
  },

  // 阻止事件冒泡
  stopPropagation: function () {
    // 空函数，用于阻止事件冒泡
  },

  // 分享小程序
  onShareAppMessage: function () {
    return {
      title: '旅冰GO，让旅行更有趣',
      path: '/pages/entertainment/entertainment'
    }
  },

  onShareTimeline: function () {
    return {
      title: '旅冰GO，让旅行更有趣'
    }
  }
})