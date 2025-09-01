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
      this.showWheelOptions()
    } else if (toolId === 'vote') {
      this.showVoteOptions()
    }
  },

  // 显示轮盘选项
  showWheelOptions: function () {
    wx.showActionSheet({
      itemList: ['创建新轮盘', '查看现有轮盘'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.createWheel()
        } else if (res.tapIndex === 1) {
          this.showWheelList()
        }
      }
    })
  },

  // 创建轮盘
  createWheel: function () {
    wx.showModal({
      title: '创建轮盘',
      content: '请输入轮盘名称',
      editable: true,
      placeholderText: '例如：周末去哪玩',
      success: (res) => {
        if (res.confirm && res.content) {
          const wheelName = res.content.trim()
          if (wheelName) {
            this.createWheelWithOptions(wheelName)
          }
        }
      }
    })
  },

  // 创建轮盘并添加选项
  createWheelWithOptions: function (wheelName) {
    wx.showModal({
      title: '添加选项',
      content: '请输入轮盘选项，用逗号分隔',
      editable: true,
      placeholderText: '例如：看电影,逛街,爬山,宅家',
      success: (res) => {
        if (res.confirm && res.content) {
          const options = res.content.split(',').map(item => item.trim()).filter(item => item)
          if (options.length > 0) {
            const wheel = {
              id: Date.now().toString(),
              name: wheelName,
              options: options,
              creator: app.globalData.userInfo?.nickName || '未知用户',
              createTime: new Date().toLocaleString(),
              isActive: true
            }
            
            let wheels = wx.getStorageSync('wheels') || []
            wheels.push(wheel)
            wx.setStorageSync('wheels', wheels)
            
            this.setData({
              wheels: wheels,
              currentWheel: wheel
            })
            
            app.showToast('轮盘创建成功')
            this.showWheel(wheel)
          }
        }
      }
    })
  },

  // 显示轮盘列表
  showWheelList: function () {
    if (this.data.wheels.length === 0) {
      app.showToast('暂无轮盘')
      return
    }
    
    const wheelNames = this.data.wheels.map(wheel => wheel.name)
    wx.showActionSheet({
      itemList: wheelNames,
      success: (res) => {
        const selectedWheel = this.data.wheels[res.tapIndex]
        this.showWheel(selectedWheel)
      }
    })
  },

  // 显示轮盘
  showWheel: function (wheel) {
    this.setData({
      currentWheel: wheel
    })
    
    wx.showModal({
      title: wheel.name,
      content: `选项：${wheel.options.join('、')}\n\n点击确定开始转动轮盘！`,
      showCancel: false,
      confirmText: '开始转动',
      success: () => {
        this.spinWheel(wheel)
      }
    })
  },

  // 转动轮盘
  spinWheel: function (wheel) {
    app.showLoading('轮盘转动中...')
    
    // 模拟轮盘转动
    setTimeout(() => {
      app.hideLoading()
      
      const randomIndex = Math.floor(Math.random() * wheel.options.length)
      const result = wheel.options[randomIndex]
      
      wx.showModal({
        title: '🎉 结果揭晓',
        content: `轮盘结果：${result}`,
        showCancel: false,
        confirmText: '太棒了！',
        success: () => {
          // 可以在这里记录结果或分享
          this.recordWheelResult(wheel, result)
        }
      })
    }, 2000)
  },

  // 记录轮盘结果
  recordWheelResult: function (wheel, result) {
    const resultRecord = {
      wheelId: wheel.id,
      wheelName: wheel.name,
      result: result,
      time: new Date().toLocaleString(),
      user: app.globalData.userInfo?.nickName || '未知用户'
    }
    
    let results = wx.getStorageSync('wheelResults') || []
    results.push(resultRecord)
    wx.setStorageSync('wheelResults', results)
  },

  // 显示投票选项
  showVoteOptions: function () {
    wx.showActionSheet({
      itemList: ['创建新投票', '查看现有投票'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.createVote()
        } else if (res.tapIndex === 1) {
          this.showVoteList()
        }
      }
    })
  },

  // 创建投票
  createVote: function () {
    wx.showModal({
      title: '创建投票',
      content: '请输入投票事项名称',
      editable: true,
      placeholderText: '例如：酒店费用预算',
      success: (res) => {
        if (res.confirm && res.content) {
          const voteName = res.content.trim()
          if (voteName) {
            this.createVoteWithDetails(voteName)
          }
        }
      }
    })
  },

  // 创建投票并设置详情
  createVoteWithDetails: function (voteName) {
    wx.showModal({
      title: '设置投票详情',
      content: '请输入最低价和最高价（用逗号分隔）',
      editable: true,
      placeholderText: '例如：100,500',
      success: (res) => {
        if (res.confirm && res.content) {
          const prices = res.content.split(',').map(item => parseFloat(item.trim())).filter(item => !isNaN(item))
          if (prices.length === 2 && prices[0] < prices[1]) {
            const vote = {
              id: Date.now().toString(),
              name: voteName,
              minPrice: prices[0],
              maxPrice: prices[1],
              creator: app.globalData.userInfo?.nickName || '未知用户',
              createTime: new Date().toLocaleString(),
              isActive: true,
              participants: [],
              results: {
                minPrices: [],
                maxPrices: []
              }
            }
            
            let votes = wx.getStorageSync('votes') || []
            votes.push(vote)
            wx.setStorageSync('votes', votes)
            
            this.setData({
              votes: votes,
              currentVote: vote
            })
            
            app.showToast('投票创建成功')
            this.showVote(vote)
          } else {
            app.showToast('请输入有效的价格范围')
          }
        }
      }
    })
  },

  // 显示投票列表
  showVoteList: function () {
    if (this.data.votes.length === 0) {
      app.showToast('暂无投票')
      return
    }
    
    const voteNames = this.data.votes.map(vote => vote.name)
    wx.showActionSheet({
      itemList: voteNames,
      success: (res) => {
        const selectedVote = this.data.votes[res.tapIndex]
        this.showVote(selectedVote)
      }
    })
  },

  // 显示投票
  showVote: function (vote) {
    this.setData({
      currentVote: vote
    })
    
    // 检查是否已经参与过
    const hasParticipated = vote.participants.some(p => p.user === (app.globalData.userInfo?.nickName || '未知用户'))
    
    if (hasParticipated) {
      this.showVoteResults(vote)
    } else {
      this.participateVote(vote)
    }
  },

  // 参与投票
  participateVote: function (vote) {
    wx.showModal({
      title: '参与投票',
      content: `请为"${vote.name}"投票\n\n价格范围：${vote.minPrice} - ${vote.maxPrice}`,
      showCancel: false,
      confirmText: '开始投票',
      success: () => {
        this.inputVotePrices(vote)
      }
    })
  },

  // 输入投票价格
  inputVotePrices: function (vote) {
    wx.showModal({
      title: '输入您的心理价位',
      content: '请输入最低价和最高价（用逗号分隔）',
      editable: true,
      placeholderText: `${vote.minPrice},${vote.maxPrice}`,
      success: (res) => {
        if (res.confirm && res.content) {
          const prices = res.content.split(',').map(item => parseFloat(item.trim())).filter(item => !isNaN(item))
          if (prices.length === 2 && prices[0] >= vote.minPrice && prices[1] <= vote.maxPrice) {
            this.submitVote(vote, prices[0], prices[1])
          } else {
            app.showToast('价格超出范围，请重新输入')
            this.inputVotePrices(vote)
          }
        }
      }
    })
  },

  // 提交投票
  submitVote: function (vote, minPrice, maxPrice) {
    const participant = {
      user: app.globalData.userInfo?.nickName || '未知用户',
      minPrice: minPrice,
      maxPrice: maxPrice,
      time: new Date().toLocaleString()
    }
    
    // 更新投票数据
    let votes = this.data.votes
    const voteIndex = votes.findIndex(v => v.id === vote.id)
    
    if (voteIndex !== -1) {
      votes[voteIndex].participants.push(participant)
      votes[voteIndex].results.minPrices.push(minPrice)
      votes[voteIndex].results.maxPrices.push(maxPrice)
      
      wx.setStorageSync('votes', votes)
      this.setData({ votes })
      
      app.showToast('投票提交成功')
      
      // 检查是否所有人都已投票
      if (votes[voteIndex].participants.length >= 3) { // 假设群组有3人
        this.showVoteResults(votes[voteIndex])
      }
    }
  },

  // 显示投票结果
  showVoteResults: function (vote) {
    const minPrices = vote.results.minPrices
    const maxPrices = vote.results.maxPrices
    
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
    
    const resultText = `投票结果：${vote.name}\n\n最低价统计：\n最高：${minStats.highest}\n最低：${minStats.lowest}\n平均：${minStats.average}\n\n最高价统计：\n最高：${maxStats.highest}\n最低：${maxStats.lowest}\n平均：${maxStats.average}`
    
    wx.showModal({
      title: '投票结果',
      content: resultText,
      showCancel: false,
      confirmText: '查看详情',
      success: () => {
        this.showVoteDetails(vote)
      }
    })
  },

  // 显示投票详情
  showVoteDetails: function (vote) {
    let detailText = `投票详情：${vote.name}\n\n参与者：\n`
    
    vote.participants.forEach(p => {
      detailText += `${p.user}: 最低${p.minPrice}, 最高${p.maxPrice}\n`
    })
    
    wx.showModal({
      title: '详细结果',
      content: detailText,
      showCancel: false,
      confirmText: '知道了'
    })
  }
})
