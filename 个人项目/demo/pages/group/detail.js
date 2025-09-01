// pages/group/detail.js
const app = getApp()

Page({
  data: {
    // 群组信息
    group: null,
    
    // 用户状态
    isMember: false,
    isCreator: false,
    
    // 最近活动
    recentActivities: [],
    
    // 弹窗控制
    showJoinModal: false,
    showMemberModal: false,
    
    // 加入群组
    inputInviteCode: '',
    canJoin: false,
    
    // 成员管理
    memberSearchKeyword: '',
    filteredMembers: []
  },

  onLoad: function (options) {
    if (options.id) {
      this.loadGroupData(options.id)
    }
  },

  onShow: function () {
    // 页面显示时刷新数据
    if (this.data.group) {
      this.loadGroupData(this.data.group.id)
    }
  },

  // 加载群组数据
  loadGroupData: function (groupId) {
    const groups = wx.getStorageSync('groups') || []
    const group = groups.find(g => g.id === groupId)
    
    if (group) {
      this.setData({
        group: group
      })
      this.checkUserStatus()
      this.loadRecentActivities()
      this.loadFilteredMembers()
    } else {
      app.showToast('群组不存在', 'error')
      wx.navigateBack()
    }
  },

  // 检查用户状态
  checkUserStatus: function () {
    const group = this.data.group
    const userInfo = app.globalData.userInfo
    
    if (!userInfo) {
      this.setData({
        isMember: false,
        isCreator: false
      })
      return
    }
    
    const isMember = group.members.some(member => member.id === userInfo.nickName)
    const isCreator = group.creator === userInfo.nickName
    
    this.setData({
      isMember: isMember,
      isCreator: isCreator
    })
  },

  // 加载最近活动
  loadRecentActivities: function () {
    // 模拟活动数据
    const activities = [
      {
        id: 1,
        type: 'join',
        content: '加入了群组',
        time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        userName: '张三'
      },
      {
        id: 2,
        type: 'photo',
        content: '上传了一张照片到共同相册',
        time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        userName: '李四'
      },
      {
        id: 3,
        type: 'checkin',
        content: '在地图上打卡了',
        time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        userName: '王五'
      }
    ]
    
    this.setData({
      recentActivities: activities
    })
  },

  // 加载筛选后的成员
  loadFilteredMembers: function () {
    this.setData({
      filteredMembers: this.data.group.members
    })
  },

  // 加入群组
  joinGroup: function () {
    if (this.data.group.verificationType === 'code') {
      this.setData({
        showJoinModal: true
      })
    } else {
      this.confirmJoin()
    }
  },

  // 隐藏加入弹窗
  hideJoinModal: function () {
    this.setData({
      showJoinModal: false,
      inputInviteCode: ''
    })
  },

  // 邀请码输入
  onInviteCodeInput: function (e) {
    const code = e.detail.value
    this.setData({
      inputInviteCode: code,
      canJoin: code.trim() !== ''
    })
  },

  // 确认加入
  confirmJoin: function () {
    const group = this.data.group
    
    if (group.verificationType === 'code') {
      if (this.data.inputInviteCode !== group.inviteCode) {
        app.showToast('邀请码错误', 'error')
        return
      }
    }
    
    if (group.verificationType === 'approval') {
      app.showToast('申请已发送，等待群主审批', 'success')
      this.hideJoinModal()
      return
    }
    
    // 执行加入
    this.performJoin()
  },

  // 执行加入群组
  performJoin: function () {
    const group = this.data.group
    const userInfo = app.globalData.userInfo
    
    if (!userInfo) {
      app.showToast('请先登录', 'none')
      return
    }
    
    if (group.memberCount >= group.maxMembers) {
      app.showToast('群组已满员', 'error')
      return
    }
    
    // 添加新成员
    const newMember = {
      id: userInfo.nickName,
      name: userInfo.nickName,
      avatar: userInfo.avatarUrl || '/images/default-avatar.png',
      role: 'member',
      joinTime: new Date().toISOString()
    }
    
    group.members.push(newMember)
    group.memberCount += 1
    
    // 更新本地存储
    this.updateGroupInStorage(group)
    
    // 更新页面状态
    this.setData({
      group: group,
      isMember: true,
      isCreator: false
    })
    
    this.hideJoinModal()
    app.showToast('成功加入群组！', 'success')
    
    // 添加活动记录
    this.addActivity('join', `${userInfo.nickName} 加入了群组`)
  },

  // 退出群组
  leaveGroup: function () {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出这个群组吗？',
      success: (res) => {
        if (res.confirm) {
          this.performLeave()
        }
      }
    })
  },

  // 执行退出群组
  performLeave: function () {
    const group = this.data.group
    const userInfo = app.globalData.userInfo
    
    if (!userInfo) return
    
    // 移除成员
    const memberIndex = group.members.findIndex(m => m.id === userInfo.nickName)
    if (memberIndex > -1) {
      group.members.splice(memberIndex, 1)
      group.memberCount -= 1
      
      // 更新本地存储
      this.updateGroupInStorage(group)
      
      // 更新页面状态
      this.setData({
        group: group,
        isMember: false,
        isCreator: false
      })
      
      app.showToast('已退出群组', 'success')
      
      // 添加活动记录
      this.addActivity('leave', `${userInfo.nickName} 退出了群组`)
    }
  },

  // 编辑群组
  editGroup: function () {
    wx.navigateTo({
      url: `/pages/group/create?id=${this.data.group.id}`
    })
  },

  // 分享群组
  shareGroup: function () {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 打开随机转盘
  openRandomWheel: function () {
    app.showToast('随机转盘功能开发中', 'none')
  },

  // 打开价格投票
  openPriceVote: function () {
    app.showToast('价格投票功能开发中', 'none')
  },

  // 打开共同相册
  openSharedAlbum: function () {
    app.showToast('共同相册功能开发中', 'none')
  },

  // 打开地图打卡
  openMapCheckin: function () {
    wx.navigateTo({
      url: '/pages/checkin/checkin'
    })
  },

  // 查看所有活动
  viewAllActivities: function () {
    app.showToast('活动历史功能开发中', 'none')
  },

  // 编辑群组信息
  editGroupInfo: function () {
    this.editGroup()
  },

  // 成员管理
  manageMembers: function () {
    this.setData({
      showMemberModal: true
    })
  },

  // 隐藏成员管理弹窗
  hideMemberModal: function () {
    this.setData({
      showMemberModal: false,
      memberSearchKeyword: ''
    })
  },

  // 成员搜索
  onMemberSearch: function (e) {
    const keyword = e.detail.value
    this.setData({
      memberSearchKeyword: keyword
    })
    
    // 筛选成员
    const filtered = this.data.group.members.filter(member => 
      member.name.toLowerCase().includes(keyword.toLowerCase())
    )
    
    this.setData({
      filteredMembers: filtered
    })
  },

  // 更改成员角色
  changeRole: function (e) {
    const member = e.currentTarget.dataset.member
    const roles = ['member', 'admin']
    const currentIndex = roles.indexOf(member.role)
    const newRole = roles[(currentIndex + 1) % roles.length]
    
    member.role = newRole
    
    // 更新本地存储
    this.updateGroupInStorage(this.data.group)
    
    // 更新筛选后的成员列表
    this.loadFilteredMembers()
    
    app.showToast(`已将 ${member.name} 的角色更改为 ${this.getRoleText(newRole)}`, 'success')
  },

  // 移除成员
  removeMember: function (e) {
    const member = e.currentTarget.dataset.member
    
    wx.showModal({
      title: '确认移除',
      content: `确定要移除成员 ${member.name} 吗？`,
      success: (res) => {
        if (res.confirm) {
          this.performRemoveMember(member)
        }
      }
    })
  },

  // 执行移除成员
  performRemoveMember: function (member) {
    const group = this.data.group
    const memberIndex = group.members.findIndex(m => m.id === member.id)
    
    if (memberIndex > -1) {
      group.members.splice(memberIndex, 1)
      group.memberCount -= 1
      
      // 更新本地存储
      this.updateGroupInStorage(group)
      
      // 更新页面状态
      this.setData({
        group: group
      })
      
      // 更新筛选后的成员列表
      this.loadFilteredMembers()
      
      app.showToast(`已移除成员 ${member.name}`, 'success')
      
      // 添加活动记录
      this.addActivity('remove', `群主移除了成员 ${member.name}`)
    }
  },

  // 群组邀请设置
  groupInvite: function () {
    app.showToast('邀请设置功能开发中', 'none')
  },

  // 解散群组
  deleteGroup: function () {
    wx.showModal({
      title: '确认解散',
      content: '解散群组后，所有成员将被移除，且无法恢复。确定要解散吗？',
      success: (res) => {
        if (res.confirm) {
          this.performDeleteGroup()
        }
      }
    })
  },

  // 执行解散群组
  performDeleteGroup: function () {
    const groups = wx.getStorageSync('groups') || []
    const groupIndex = groups.findIndex(g => g.id === this.data.group.id)
    
    if (groupIndex > -1) {
      groups.splice(groupIndex, 1)
      wx.setStorageSync('groups', groups)
      
      app.showToast('群组已解散', 'success')
      
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  // 更新本地存储中的群组
  updateGroupInStorage: function (updatedGroup) {
    const groups = wx.getStorageSync('groups') || []
    const groupIndex = groups.findIndex(g => g.id === updatedGroup.id)
    
    if (groupIndex > -1) {
      groups[groupIndex] = updatedGroup
      wx.setStorageSync('groups', groups)
      
      // 更新全局数据
      if (app.globalData.groups) {
        const globalIndex = app.globalData.groups.findIndex(g => g.id === updatedGroup.id)
        if (globalIndex > -1) {
          app.globalData.groups[globalIndex] = updatedGroup
        }
      }
    }
  },

  // 添加活动记录
  addActivity: function (type, content) {
    const userInfo = app.globalData.userInfo
    if (!userInfo) return
    
    const activity = {
      id: Date.now(),
      type: type,
      content: content,
      time: new Date().toISOString(),
      userName: userInfo.nickName
    }
    
    const activities = [activity, ...this.data.recentActivities]
    this.setData({
      recentActivities: activities.slice(0, 10) // 只保留最近10条
    })
  },

  // 获取角色文本
  getRoleText: function (role) {
    const roleMap = {
      'creator': '群主',
      'admin': '管理员',
      'member': '成员'
    }
    return roleMap[role] || '成员'
  },

  // 获取活动图标
  getActivityIcon: function (type) {
    const iconMap = {
      'join': '➕',
      'leave': '➖',
      'photo': '📸',
      'checkin': '📍',
      'remove': '❌'
    }
    return iconMap[type] || '📝'
  },

  // 格式化时间
  formatTime: function (timeString) {
    const date = new Date(timeString)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60 * 1000) {
      return '刚刚'
    } else if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))}分钟前`
    } else if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }
  },

  // 阻止事件冒泡
  stopPropagation: function () {
    // 空函数，用于阻止事件冒泡
  },

  // 分享小程序
  onShareAppMessage: function () {
    const group = this.data.group
    return {
      title: `邀请你加入旅游群：${group.name}`,
      path: `/pages/group/detail?id=${group.id}`,
      imageUrl: group.coverImage || '/images/default-group.png'
    }
  },

  onShareTimeline: function () {
    const group = this.data.group
    return {
      title: `邀请你加入旅游群：${group.name}`,
      imageUrl: group.coverImage || '/images/default-group.png'
    }
  }
})