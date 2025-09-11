// pages/group/detail.js
const app = getApp()

Page({
  data: {
    // 群组信息
    group: null,
    
    // 用户状态
    isMember: false,
    isCreator: false,
    
    // 相册状态
    hasSharedAlbum: false,
    
    // 弹窗控制
    showJoinModal: false,
    showMemberModal: false,
    
    // 加入群组
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
    // 检查相册状态
    this.checkSharedAlbumStatus()
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
      this.loadFilteredMembers()
      this.checkSharedAlbumStatus()
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
    
    // 检查用户是否已经是群组成员（通过ID或昵称检查）
    const isMember = group.members.some(member => 
      member.id === userInfo.id || member.name === userInfo.nickName
    )
    const isCreator = group.creator === userInfo.nickName || group.creatorId === userInfo.id
    
    this.setData({
      isMember: isMember,
      isCreator: isCreator
    })
  },


  // 加载筛选后的成员
  loadFilteredMembers: function () {
    this.setData({
      filteredMembers: this.data.group.members
    })
  },

  // 检查共享相册状态
  checkSharedAlbumStatus: function () {
    const albums = wx.getStorageSync('albums') || []
    const hasSharedAlbum = albums.some(album => 
      album.groupId === this.data.group.id && album.type === 'shared'
    )
    
    this.setData({
      hasSharedAlbum: hasSharedAlbum
    })
  },

  // 加入群组
  joinGroup: function () {
    this.confirmJoin()
  },

  // 隐藏加入弹窗
  hideJoinModal: function () {
    this.setData({
      showJoinModal: false,
    })
  },


  // 确认加入
  confirmJoin: function () {
    const group = this.data.group
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
    
    // 检查用户是否已经是群组成员
    const isAlreadyMember = group.members.some(member => 
      member.id === userInfo.id || member.name === userInfo.nickName
    )
    
    if (isAlreadyMember) {
      app.showToast('您已经是该群组成员', 'none')
      return
    }
    
    if (group.memberCount >= group.maxMembers) {
      app.showToast('群组已满员', 'error')
      return
    }
    
    // 添加新成员
    const newMember = {
      id: userInfo.id,
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
    const memberIndex = group.members.findIndex(m => 
      m.id === userInfo.id || m.name === userInfo.nickName
    )
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
    wx.navigateTo({
      url: `/pages/tools/wheel/wheel?groupId=${this.data.group.id}`
    })
  },

  // 打开价格投票
  openPriceVote: function () {
    wx.navigateTo({
      url: `/pages/tools/price/price?groupId=${this.data.group.id}`
    })
  },

  // 打开共同相册
  openSharedAlbum: function () {
    // 检查是否已经存在该群组的共享相册
    const albums = wx.getStorageSync('albums') || []
    const existingAlbum = albums.find(album => 
      album.groupId === this.data.group.id && album.type === 'shared'
    )
    
    if (existingAlbum) {
      // 如果存在共享相册，直接进入详情页面
      wx.navigateTo({
        url: `/pages/album/detail?id=${existingAlbum.id}`
      })
    } else {
      // 如果不存在，进入创建页面
      wx.navigateTo({
        url: `/pages/album/create?groupId=${this.data.group.id}&groupName=${encodeURIComponent(this.data.group.name)}`
      })
    }
  },

  // 打开地图打卡
  openMapCheckin: function () {
    wx.navigateTo({
      url: '/pages/checkin/checkin'
    })
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
    const memberIndex = group.members.findIndex(m => 
      m.id === member.id || m.name === member.name
    )
    
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
      
    }
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


  // 获取角色文本
  getRoleText: function (role) {
    const roleMap = {
      'creator': '群主',
      'admin': '管理员',
      'member': '成员'
    }
    return roleMap[role] || '成员'
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