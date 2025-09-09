const app = getApp()

Page({
  data: {
    groupId: '',
    groupInfo: null,
    members: [],
    incompleteMembers: [],
    filteredIncompleteMembers: [],
    showMoreBtn: false,
    completedCount: 0,
    
    wheelItems: [],
    rotation: 0,
    spinDuration: 0,
    isSpinning: false,
    selectedItem: null,
    
    showMembersModal: false,
    showResultModal: false
  },

  onLoad: function (options) {
    if (options.groupId) {
      this.setData({
        groupId: options.groupId
      })
      this.loadGroupData()
    }
  },

  // 加载群组数据
  loadGroupData: function () {
    // 从缓存获取群组信息
    const groups = wx.getStorageSync('groups') || []
    const group = groups.find(g => g.id === this.data.groupId)
    
    if (group) {
      this.setData({
        groupInfo: group,
        members: group.members || []
      })
      this.loadWheelItems()
    }
  },

  // 加载转盘项目
  loadWheelItems: function () {
    const wheelData = wx.getStorageSync(`wheel_${this.data.groupId}`)
    // 确保 wheelData 是数组
    const wheelItems = Array.isArray(wheelData) ? wheelData : []
    this.setData({
      wheelItems: wheelItems
    })
    this.updateMemberStatus()
    this.updateWheelColors()
  },

  // 更新成员状态
  updateMemberStatus: function () {
    // 确保 wheelItems 是数组
    const wheelItems = Array.isArray(this.data.wheelItems) ? this.data.wheelItems : []
    const wheelUserIds = wheelItems.map(item => item.userId)
    const incompleteMembers = this.data.members.filter(member => 
      !wheelUserIds.includes(member.id)
    )
    
    // 计算已完成人数
    const completedCount = this.data.members.length - incompleteMembers.length
    
    // 最多显示5个头像，超过则显示省略号
    const maxDisplay = 5
    const filteredIncompleteMembers = incompleteMembers.slice(0, maxDisplay)
    const showMoreBtn = incompleteMembers.length > maxDisplay
    
    this.setData({
      incompleteMembers,
      filteredIncompleteMembers,
      showMoreBtn,
      completedCount
    })
  },

  // 更新转盘颜色
  updateWheelColors: function () {
    // 确保 wheelItems 是数组
    const wheelItems = Array.isArray(this.data.wheelItems) ? this.data.wheelItems : []
    if (wheelItems.length === 0) return
    
    // 定义颜色数组
    const colors = [
      '#FFD700', '#FFA500', '#FF6347', '#40E0D0', 
      '#9370DB', '#3CB371', '#1E90FF', '#FF69B4'
    ]
    
    // 计算每个部分的角度
    const anglePerItem = 360 / wheelItems.length
    
    // 为每个项目分配颜色和角度
    const updatedItems = wheelItems.map((item, index) => {
      return {
        ...item,
        color: colors[index % colors.length],
        angle: anglePerItem,
        startAngle: index * anglePerItem
      }
    })
    
    this.setData({
      wheelItems: updatedItems
    })
  },

  // 显示所有未完成成员
  showAllIncompleteMembers: function () {
    this.setData({
      showMembersModal: true
    })
  },

  // 隐藏成员弹窗
  hideMembersModal: function () {
    this.setData({
      showMembersModal: false
    })
  },

  // 跳转到输入内容页面
  navigateToInput: function () {
    wx.navigateTo({
      url: `/pages/tools/wheel-input?groupId=${this.data.groupId}`
    })
  },

  // 开始转盘
  startSpin: function () {
    const wheelItems = Array.isArray(this.data.wheelItems) ? this.data.wheelItems : []
    if (this.data.isSpinning || wheelItems.length === 0) return
    
    this.setData({
      isSpinning: true,
      spinDuration: 5000 // 5秒动画
    })
    
    // 计算旋转角度 (3-5圈 + 随机角度)
    const baseRotation = 360 * (3 + Math.random() * 2)
    const randomRotation = Math.random() * 360
    const totalRotation = this.data.rotation + baseRotation + randomRotation
    
    this.setData({
      rotation: totalRotation
    })
    
    // 转盘停止后显示结果
    setTimeout(() => {
      this.determineWinner()
    }, 5000)
  },

  // 确定获胜者
  determineWinner: function () {
    const wheelItems = Array.isArray(this.data.wheelItems) ? this.data.wheelItems : []
    if (wheelItems.length === 0) return
    
    // 计算最终角度 (取模360度)
    const finalRotation = this.data.rotation % 360
    // 转换为0-360度
    const normalizedRotation = (finalRotation + 360) % 360
    
    // 计算每个部分的角度
    const anglePerItem = 360 / wheelItems.length
    
    // 确定指针指向的项目
    // 指针在顶部，所以从270度位置开始计算
    const pointerAngle = 270
    let adjustedAngle = (normalizedRotation - pointerAngle + 360) % 360
    let winnerIndex = Math.floor(adjustedAngle / anglePerItem)
    
    // 确保索引在有效范围内
    winnerIndex = winnerIndex % wheelItems.length
    
    this.setData({
      isSpinning: false,
      selectedItem: wheelItems[winnerIndex],
      showResultModal: true
    })
    
    // 保存结果
    this.saveResult(wheelItems[winnerIndex])
  },

  // 保存结果
  saveResult: function (item) {
    const results = wx.getStorageSync(`wheel_results_${this.data.groupId}`) || []
    results.push({
      itemId: item.id,
      content: item.content,
      userName: item.userName,
      timestamp: new Date().toISOString()
    })
    wx.setStorageSync(`wheel_results_${this.data.groupId}`, results)
  },

  // 隐藏结果弹窗
  hideResultModal: function () {
    this.setData({
      showResultModal: false,
      selectedItem: null
    })
  },

  // 阻止事件冒泡
  stopPropagation: function (e) {
    e.stopPropagation()
  },

  onShow: function () {
    // 页面显示时重新加载数据
    this.loadWheelItems()
  }
})