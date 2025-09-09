// pages/tools/tools.js
const app = getApp()

Page({
  data: {
    currentGroup: null,
    tools: [
      {
        id: 'wheel',
        name: '随机轮盘',
        icon: '🎯',
        desc: '创建轮盘，随机选择目的地'
      },
      {
        id: 'vote',
        name: '价格投票',
        icon: '💰',
        desc: '匿名投票，了解大家心理价位'
      }
    ],
    // 轮盘相关数据
    wheels: [],
    currentWheel: null,
    // 投票相关数据
    votes: [],
    currentVote: null
  },

  onLoad: function (options) {
    // 获取当前群组信息
    if (options.groupId) {
      this.setData({
        currentGroup: { id: options.groupId }
      })
    }
    this.loadTools()
  },

  onShow: function () {
    this.loadTools()
  },

  // 加载工具数据
  loadTools: function () {
    // 从本地存储加载轮盘和投票数据
    const wheels = wx.getStorageSync('wheels') || []
    const votes = wx.getStorageSync('votes') || []
    
    this.setData({
      wheels: wheels,
      votes: votes
    })
  },

  // 选择工具
  selectTool: function (e) {
    const toolId = e.currentTarget.dataset.id
    if (toolId === 'wheel') {
      this.navigateToWheel()
    } else if (toolId === 'vote') {
      this.navigateToPrice()
    }
  },

  // 导航到随机转盘
  navigateToWheel: function () {
    if (this.data.currentGroup) {
      wx.navigateTo({
        url: `/pages/tools/wheel/wheel?groupId=${this.data.currentGroup.id}`
      })
    } else {
      // 如果没有指定群组，让用户选择
      this.selectGroupForTool('wheel')
    }
  },

  // 导航到心选价格
  navigateToPrice: function () {
    if (this.data.currentGroup) {
      wx.navigateTo({
        url: `/pages/tools/price/price?groupId=${this.data.currentGroup.id}`
      })
    } else {
      // 如果没有指定群组，让用户选择
      this.selectGroupForTool('price')
    }
  },

  // 为工具选择群组
  selectGroupForTool: function (toolType) {
    const groups = wx.getStorageSync('groups') || []
    const userGroups = groups.filter(group => 
      group.creatorId === app.globalData.userInfo?.id || 
      (group.members && group.members.includes(app.globalData.userInfo?.id))
    )
    
    if (userGroups.length === 0) {
      app.showToast('请先创建或加入群组')
      return
    }
    
    const groupNames = userGroups.map(group => group.name)
    wx.showActionSheet({
      itemList: groupNames,
      success: (res) => {
        const selectedGroup = userGroups[res.tapIndex]
        if (toolType === 'wheel') {
          wx.navigateTo({
            url: `/pages/tools/wheel/wheel?groupId=${selectedGroup.id}`
          })
        } else if (toolType === 'price') {
          wx.navigateTo({
            url: `/pages/tools/price/price?groupId=${selectedGroup.id}`
          })
        }
      }
    })
  },

})
