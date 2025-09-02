// pages/tools/wheel.js
const app = getApp()

Page({
  data: {
    groupId: '',
    groupInfo: null,
    members: [],
    wheelItems: [],
    isSpinning: false,
    currentAngle: 0,
    selectedItem: null,
    showInputModal: false,
    showResultModal: false,
    showMembersModal: false,
    inputContent: '',
    isMemberCompleted: {},
    wheelColors: [
      '#4CAF50', '#45a049', '#66BB6A', '#81C784', 
      '#A5D6A7', '#C8E6C9', '#E8F5E8', '#2E7D32',
      '#388E3C', '#43A047', '#4CAF50', '#66BB6A'
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

    // 随机选择结果
    const randomIndex = Math.floor(Math.random() * this.data.wheelItems.length)
    const selectedItem = this.data.wheelItems[randomIndex]
    
    // 计算旋转角度
    const itemAngle = 360 / this.data.wheelItems.length
    const targetAngle = randomIndex * itemAngle + itemAngle / 2
    
    // 添加多圈旋转效果
    const totalRotation = 360 * 5 + targetAngle // 转5圈后停在目标位置
    
    this.setData({
      currentAngle: totalRotation,
      selectedItem: selectedItem
    })

    // 3秒后停止
    setTimeout(() => {
      this.setData({
        isSpinning: false
      })
      this.showResult(selectedItem)
    }, 3000)
  },

  // 显示结果
  showResult: function (item) {
    this.setData({
      showResultModal: true
    })

    // 记录结果
    const result = {
      id: Date.now().toString(),
      itemId: item.id,
      content: item.content,
      userName: item.userName,
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
            currentAngle: 0,
            selectedItem: null
          })
          this.saveWheelData()
          app.showToast('转盘已重置')
        }
      }
    })
  },

  // 返回上一页
  goBack: function () {
    wx.navigateBack()
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

  // 历史功能已移除
})
