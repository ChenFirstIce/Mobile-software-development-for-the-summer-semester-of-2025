// pages/tools/price.js
const app = getApp()

Page({
  data: {
    groupId: '',
    groupInfo: null,
    members: [],
    priceItems: [],
    isAnonymous: false,
    showInputModal: false,
    showResultModal: false,
    showMembersModal: false,
    inputMinPrice: '',
    inputMaxPrice: '',
    chartData: [],
    chartLabels: [],
    chartMinPrices: [],
    chartMaxPrices: [],
    maxMinPrice: 1,
    maxMaxPrice: 1,
    currentUser: null,
    isMemberCompleted: {}
  },

  onLoad: function (options) {
    if (options.groupId) {
      this.setData({
        groupId: options.groupId
      })
      this.loadGroupInfo()
    }
  },

  onShow: function () {
    this.loadPriceData()
    this.setData({
      currentUser: app.globalData.userInfo
    })
  },

  // 加载群组信息
  loadGroupInfo: function () {
    const groups = wx.getStorageSync('groups') || []
    const group = groups.find(g => g.id === this.data.groupId)
    
    if (group) {
      this.setData({
        groupInfo: group,
        members: group.members || []
      })
    }
  },

  // 加载价格数据
  loadPriceData: function () {
    const priceData = wx.getStorageSync(`price_${this.data.groupId}`) || {
      items: [],
      results: [],
      isAnonymous: false
    }
    
    this.setData({
      priceItems: priceData.items || [],
      isAnonymous: priceData.isAnonymous || false
    })
    
    this.updateChartData()
    this.updateMemberStatus()
  },

  // 保存价格数据
  savePriceData: function () {
    const priceData = {
      items: this.data.priceItems,
      results: wx.getStorageSync(`price_${this.data.groupId}`)?.results || [],
      isAnonymous: this.data.isAnonymous
    }
    wx.setStorageSync(`price_${this.data.groupId}`, priceData)
  },

  // 切换匿名模式
  toggleAnonymous: function () {
    this.setData({
      isAnonymous: !this.data.isAnonymous
    })
    this.savePriceData()
  },

  // 显示未完成成员头像
  showIncompleteMembers: function () {
    const incompleteMembers = this.data.members.filter(member => {
      return !this.data.priceItems.some(item => item.userId === member.id)
    })
    
    if (incompleteMembers.length > 0) {
      this.setData({
        incompleteMembers: incompleteMembers,
        showMembersModal: true
      })
    } else {
      app.showToast('所有成员已完成输入')
    }
  },

  // 隐藏成员弹窗
  hideMembersModal: function () {
    this.setData({
      showMembersModal: false
    })
  },

  // 显示输入弹窗
  showInputModal: function () {
    this.setData({
      showInputModal: true,
      inputMinPrice: '',
      inputMaxPrice: ''
    })
  },

  // 隐藏输入弹窗
  hideInputModal: function () {
    this.setData({
      showInputModal: false,
      inputMinPrice: '',
      inputMaxPrice: ''
    })
  },

  // 最低价格输入
  onMinPriceInput: function (e) {
    this.setData({
      inputMinPrice: e.detail.value
    })
  },

  // 最高价格输入
  onMaxPriceInput: function (e) {
    this.setData({
      inputMaxPrice: e.detail.value
    })
  },

  // 确认输入
  confirmInput: function () {
    const minPrice = parseFloat(this.data.inputMinPrice)
    const maxPrice = parseFloat(this.data.inputMaxPrice)
    
    if (isNaN(minPrice) || isNaN(maxPrice)) {
      app.showToast('请输入有效的价格')
      return
    }
    
    if (minPrice >= maxPrice) {
      app.showToast('最低价必须小于最高价')
      return
    }

    const currentUser = app.globalData.userInfo
    if (!currentUser) {
      app.showToast('请先登录')
      return
    }

    // 检查是否已经输入过
    const existingIndex = this.data.priceItems.findIndex(item => item.userId === currentUser.id)
    
    const newItem = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.nickName,
      userAvatar: currentUser.avatarUrl,
      minPrice: minPrice,
      maxPrice: maxPrice,
      timestamp: new Date().toISOString()
    }

    let priceItems = [...this.data.priceItems]
    
    if (existingIndex >= 0) {
      // 更新现有项
      priceItems[existingIndex] = newItem
    } else {
      // 添加新项
      priceItems.push(newItem)
    }

    this.setData({
      priceItems: priceItems
    })

    this.savePriceData()
    this.updateChartData()
    this.updateMemberStatus()
    this.hideInputModal()
    app.showToast('价格输入成功')
  },

  // 更新图表数据
  updateChartData: function () {
    const items = this.data.priceItems
    const labels = []
    const minPrices = []
    const maxPrices = []
    
    items.forEach((item, index) => {
      if (this.data.isAnonymous) {
        labels.push(`用户${index + 1}`)
      } else {
        labels.push(item.userName)
      }
      minPrices.push(item.minPrice)
      maxPrices.push(item.maxPrice)
    })
    
    // 计算最大值用于图表比例
    const maxMinPrice = minPrices.length > 0 ? Math.max(...minPrices) : 1
    const maxMaxPrice = maxPrices.length > 0 ? Math.max(...maxPrices) : 1
    
    this.setData({
      chartLabels: labels,
      chartMinPrices: minPrices,
      chartMaxPrices: maxPrices,
      maxMinPrice: maxMinPrice,
      maxMaxPrice: maxMaxPrice
    })
  },

  // 显示结果
  showResults: function () {
    if (this.data.priceItems.length === 0) {
      app.showToast('暂无价格数据')
      return
    }

    const minPrices = this.data.priceItems.map(item => item.minPrice)
    const maxPrices = this.data.priceItems.map(item => item.maxPrice)
    
    const minStats = {
      highest: Math.max(...minPrices),
      lowest: Math.min(...minPrices),
      average: (minPrices.reduce((a, b) => a + b, 0) / minPrices.length).toFixed(2)
    }
    
    const maxStats = {
      highest: Math.max(...maxPrices),
      lowest: Math.min(...maxPrices),
      average: (maxPrices.reduce((a, b) => a + b, 0) / maxPrices.length).toFixed(2)
    }

    this.setData({
      minStats: minStats,
      maxStats: maxStats,
      showResultModal: true
    })

    // 记录结果
    const result = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      participantCount: this.data.priceItems.length,
      minStats: minStats,
      maxStats: maxStats
    }

    const priceData = wx.getStorageSync(`price_${this.data.groupId}`) || { items: [], results: [], isAnonymous: false }
    priceData.results.push(result)
    wx.setStorageSync(`price_${this.data.groupId}`, priceData)
  },

  // 隐藏结果弹窗
  hideResultModal: function () {
    this.setData({
      showResultModal: false
    })
  },

  // 重置价格投票
  resetPriceVote: function () {
    wx.showModal({
      title: '确认重置',
      content: '确定要清空所有价格数据吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            priceItems: [],
            chartLabels: [],
            chartMinPrices: [],
            chartMaxPrices: []
          })
          this.savePriceData()
          app.showToast('价格投票已重置')
        }
      }
    })
  },

  // 历史功能已移除

  // 返回上一页
  goBack: function () {
    wx.navigateBack()
  },

  // 更新成员完成状态
  updateMemberStatus: function () {
    const isMemberCompleted = {}
    this.data.members.forEach(member => {
      isMemberCompleted[member.id] = this.data.priceItems.some(item => item.userId === member.id)
    })
    this.setData({
      isMemberCompleted: isMemberCompleted
    })
  },

  // 阻止事件冒泡
  stopPropagation: function () {
    // 空函数，用于阻止事件冒泡
  }
})
