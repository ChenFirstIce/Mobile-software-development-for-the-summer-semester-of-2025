// pages/tools/wheel.js
const app = getApp()

Page({
  data: {
    groupId: '',
    groupInfo: null,
    members: [],
    wheelItems: [],
    isSpinning: false,
    selectedItem: null,
    showInputModal: false,
    showResultModal: false,
    showMembersModal: false,
    inputContent: '',
    isMemberCompleted: {},
    // lucky-canvas 配置
    blocks: [{ padding: '10px', background: '#4CAF50' }],
    prizes: [],
    buttons: [
      { radius: '40%', background: '#4CAF50' },
      { radius: '35%', background: '#66BB6A' },
      {
        radius: '30%', 
        background: '#45a049',
        pointer: true,
        fonts: [{ text: '开始\n转动', top: '-20px' }] 
      },
    ]
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
    this.loadWheelData()
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

  // 加载转盘数据
  loadWheelData: function () {
    const wheelData = wx.getStorageSync(`wheel_${this.data.groupId}`) || {
      items: [],
      results: []
    }
    
    this.setData({
      wheelItems: wheelData.items || []
    })
    this.updateMemberStatus()
    this.updatePrizes()
  },

  // 保存转盘数据
  saveWheelData: function () {
    const wheelData = {
      items: this.data.wheelItems,
      results: wx.getStorageSync(`wheel_${this.data.groupId}`)?.results || []
    }
    wx.setStorageSync(`wheel_${this.data.groupId}`, wheelData)
  },

  // 显示未完成成员头像
  showIncompleteMembers: function () {
    const incompleteMembers = this.data.members.filter(member => {
      return !this.data.wheelItems.some(item => item.userId === member.id)
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
      inputContent: ''
    })
  },

  // 隐藏输入弹窗
  hideInputModal: function () {
    this.setData({
      showInputModal: false,
      inputContent: ''
    })
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
      app.showToast('请输入内容')
      return
    }

    const currentUser = app.globalData.userInfo
    if (!currentUser) {
      app.showToast('请先登录')
      return
    }

    // 检查是否已经输入过
    const existingIndex = this.data.wheelItems.findIndex(item => item.userId === currentUser.id)
    
    const newItem = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.nickName,
      userAvatar: currentUser.avatarUrl,
      content: content,
      timestamp: new Date().toISOString()
    }

    let wheelItems = [...this.data.wheelItems]
    
    if (existingIndex >= 0) {
      // 更新现有项
      wheelItems[existingIndex] = newItem
    } else {
      // 添加新项
      wheelItems.push(newItem)
    }

    this.setData({
      wheelItems: wheelItems
    })

    this.saveWheelData()
    this.updateMemberStatus()
    this.updatePrizes()
    this.hideInputModal()
    app.showToast('输入成功')
  },

  // 开始转动
  startSpin: function () {
    if (this.data.wheelItems.length === 0) {
      app.showToast('请先输入内容')
      return
    }

    if (this.data.isSpinning) {
      return
    }

    this.setData({
      isSpinning: true
    })

    // 获取抽奖组件实例
    const child = this.selectComponent('#myLucky')
    // 调用play方法开始旋转
    child.lucky.play()
    
    // 根据权重随机选择结果
    const totalWeight = this.data.wheelItems.reduce((sum, item) => sum + this.calculateWeight(item.content), 0)
    let randomWeight = Math.random() * totalWeight
    let selectedIndex = 0
    
    for (let i = 0; i < this.data.wheelItems.length; i++) {
      const item = this.data.wheelItems[i]
      randomWeight -= this.calculateWeight(item.content)
      if (randomWeight <= 0) {
        selectedIndex = i
        break
      }
    }
    
    
    // 用定时器模拟请求接口
    setTimeout(() => {
      // 3s 后得到中奖索引
      // 调用stop方法然后缓慢停止
      child.lucky.stop(selectedIndex)
    }, 3000)
  },

  // 转盘结束回调
  onSpinEnd: function (event) {
    this.setData({
      isSpinning: false
    })
    
    // 获取中奖结果 - 根据lucky-canvas文档调整
    
    let selectedIndex = 0
    if (event.detail && typeof event.detail === 'object') {
      // 如果event.detail是对象，尝试获取index
      selectedIndex = event.detail.index || event.detail.prizeIndex || 0
    } else if (typeof event.detail === 'number') {
      // 如果event.detail直接是数字
      selectedIndex = event.detail
    }
    
    const selectedItem = this.data.wheelItems[selectedIndex]
    
    // 检查selectedItem是否存在
    if (!selectedItem) {
      return
    }
    
    this.setData({
      selectedItem: selectedItem
    })
    
    this.showResult(selectedItem)
  },

  // 显示结果
  showResult: function (item) {
    if (!item) {
      return
    }

    this.setData({
      showResultModal: true
    })

    // 记录结果
    const result = {
      id: Date.now().toString(),
      itemId: item.id || Date.now().toString(),
      content: item.content || '未知内容',
      userName: item.userName || '未知用户',
      timestamp: new Date().toISOString()
    }

    const wheelData = wx.getStorageSync(`wheel_${this.data.groupId}`) || { items: [], results: [] }
    wheelData.results.push(result)
    wx.setStorageSync(`wheel_${this.data.groupId}`, wheelData)
  },

  // 隐藏结果弹窗
  hideResultModal: function () {
    this.setData({
      showResultModal: false,
      selectedItem: null
    })
  },

  // 重置转盘
  resetWheel: function () {
    wx.showModal({
      title: '确认重置',
      content: '确定要清空所有输入内容吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            wheelItems: [],
            prizes: [],
            selectedItem: null
          })
          this.saveWheelData()
          app.showToast('转盘已重置')
        }
      }
    })
  },

  // 更新成员完成状态
  updateMemberStatus: function () {
    const isMemberCompleted = {}
    this.data.members.forEach(member => {
      isMemberCompleted[member.id] = this.data.wheelItems.some(item => item.userId === member.id)
    })
    this.setData({
      isMemberCompleted: isMemberCompleted
    })
  },

  // 更新转盘奖品配置
  updatePrizes: function () {
    if (this.data.wheelItems.length === 0) {
      this.setData({
        prizes: []
      })
      return
    }

    const prizes = this.data.wheelItems.map((item, index) => {
      const randomColor = this.getRandColor()
      
      return {
        background: randomColor,
        fonts: [{ 
          text: item.content
        }]
      }
    })
    
    this.setData({
      prizes: prizes
    }, () => {
      // 强制更新lucky-canvas组件
      const child = this.selectComponent('#myLucky')
      if (child && child.lucky) {
        child.lucky.init()
      }
    })
  },

  // 计算内容权重
  calculateWeight: function (content) {
    let weight = content.length
    // 特殊字符增加权重
    const specialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g
    const specialCount = (content.match(specialChars) || []).length
    weight += specialCount * 2
    
    // 数字增加权重
    const numberCount = (content.match(/\d/g) || []).length
    weight += numberCount * 1.5
    
    // 中文字符增加权重
    const chineseCount = (content.match(/[\u4e00-\u9fa5]/g) || []).length
    weight += chineseCount * 1.2
    
    return weight
  },

  // 生成随机颜色
  getRandColor: function() {
    let rgb = []
    let isWhite = true
    
    // 循环直到生成非白色颜色
    while (isWhite) {
      rgb = []
      for(let i = 0; i < 3; i++){
        let color = Math.floor(Math.random() * 256).toString(16)
        color = color.length == 1 ? '0' + color : color
        rgb.push(color)
      }
      
      // 检查是否为白色或接近白色
      const r = parseInt(rgb[0], 16)
      const g = parseInt(rgb[1], 16)
      const b = parseInt(rgb[2], 16)
      
      // 如果RGB值都大于200，认为是白色或接近白色
      if (r > 200 && g > 200 && b > 200) {
        isWhite = true
      } else {
        isWhite = false
      }
    }
    
    return '#' + rgb.join('')
  },

  // 根据背景颜色计算对比度高的文字颜色
  getContrastColor: function(backgroundColor) {
    // 移除#号并转换为RGB
    const hex = backgroundColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    // 计算亮度
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    
    // 根据亮度返回黑色或白色
    return brightness > 128 ? '#000000' : '#FFFFFF'
  },


  // 历史功能已移除
})
