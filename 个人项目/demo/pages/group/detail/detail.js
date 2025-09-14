// pages/group/detail/detail.js
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
      this.loadGroupData(this.data.group._id || this.data.group.id)
    }
    // 检查相册状态
    this.checkSharedAlbumStatus()
  },

  // 加载群组数据（云开发版本）
  loadGroupData: function (groupId) {
    app.showLoading('加载中...')
    
    // 调用云函数获取群组详情
    wx.cloud.callFunction({
      name: 'groupManager',
      data: {
        action: 'getDetail',
        groupId: groupId
      },
      success: (res) => {
        app.hideLoading()
        if (res.result.success) {
          const group = res.result.data
          
          // 更新本地存储
          let groups = wx.getStorageSync('groups') || []
          const groupIndex = groups.findIndex(g => g._id === groupId)
          if (groupIndex > -1) {
            groups[groupIndex] = group
          } else {
            groups.push(group)
          }
          wx.setStorageSync('groups', groups)
          
          this.setData({
            group: group
          })
          this.checkUserStatus()
          this.loadFilteredMembers()
          this.checkSharedAlbumStatus()
        } else {
          app.showToast('加载群组失败: ' + res.result.message)
          // 降级到本地存储
          this.loadGroupDataFromLocal(groupId)
        }
      },
      fail: (error) => {
        app.hideLoading()
        console.error('云函数调用失败:', error)
        app.showToast('网络错误，使用本地数据')
        // 降级到本地存储
        this.loadGroupDataFromLocal(groupId)
      }
    })
  },

  // 从本地存储加载群组（降级方案）
  loadGroupDataFromLocal: function (groupId) {
    const groups = wx.getStorageSync('groups') || []
    const group = groups.find(g => g._id === groupId || g.id === groupId)
    
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
    
    if (!userInfo || !group) {
      this.setData({
        isMember: false,
        isCreator: false
      })
      return
    }
    
    // 检查用户是否已经是群组成员（通过ID或昵称检查）
    const isMember = group.members && group.members.some(member => 
      member.userId === userInfo._openid || member.nickName === userInfo.nickName
    )
    const isCreator = group.creatorId === userInfo._openid
    
    this.setData({
      isMember: isMember,
      isCreator: isCreator
    })
  },


  // 加载筛选后的成员
  loadFilteredMembers: function () {
    if (this.data.group && this.data.group.members && Array.isArray(this.data.group.members)) {
      this.setData({
        filteredMembers: this.data.group.members
      })
    } else {
      this.setData({
        filteredMembers: []
      })
    }
  },

  // 检查共享相册状态
  checkSharedAlbumStatus: function () {
    if (!this.data.group || (!this.data.group._id && !this.data.group.id)) {
      return
    }
    
    const albums = wx.getStorageSync('albums') || []
    const groupId = this.data.group._id || this.data.group.id
    const hasSharedAlbum = albums.some(album => 
      album.groupId === groupId && album.type === 'shared'
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
    const isAlreadyMember = group.members && Array.isArray(group.members) && group.members.some(member => 
      member.userId === userInfo._openid || member.nickName === userInfo.nickName
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
      userId: userInfo._openid,
      nickName: userInfo.nickName,
      avatarUrl: userInfo.avatarUrl || '/images/avatar.png',
      role: 'member',
      joinTime: new Date()
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
      m.userId === userInfo._openid || m.nickName === userInfo.nickName
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
    const groupId = this.data.group._id || this.data.group.id
    wx.navigateTo({
      url: `/pages/group/create/create?id=${groupId}`
    })
  },

  // 编辑群组信息
  editGroupInfo: function () {
    const groupId = this.data.group._id || this.data.group.id
    wx.navigateTo({
      url: `/pages/group/create/create?id=${groupId}`
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
    const groupId = this.data.group._id || this.data.group.id
    wx.navigateTo({
      url: `/pages/tools/wheel/wheel?groupId=${groupId}`
    })
  },

  // 打开价格投票
  openPriceVote: function () {
    const groupId = this.data.group._id || this.data.group.id
    wx.navigateTo({
      url: `/pages/tools/price/price?groupId=${groupId}`
    })
  },

  // 打开共同相册
  openSharedAlbum: function () {
    // 检查是否已经存在该群组的共享相册
    const albums = wx.getStorageSync('albums') || []
    const groupId = this.data.group._id || this.data.group.id
    const existingAlbum = albums.find(album => 
      album.groupId === groupId && album.type === 'shared'
    )
    
    if (existingAlbum) {
      // 如果存在共享相册，直接进入详情页面
      wx.navigateTo({
        url: `/pages/album/detail/detail?id=${existingAlbum._id || existingAlbum.id}`
      })
    } else {
      // 如果不存在，进入创建页面
      wx.navigateTo({
        url: `/pages/album/create/create?groupId=${groupId}&groupName=${encodeURIComponent(this.data.group.name)}`
      })
    }
  },

  // 打开地图打卡
  openMapCheckin: function () {
    wx.navigateTo({
      url: '/pages/checkin/index/checkin'
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

  // 阻止事件冒泡
  stopPropagation: function (e) {
    // 微信小程序中阻止事件冒泡的方式
    if (e.stopPropagation) {
      e.stopPropagation()
    }
    return false
  },

  // 成员搜索
  onMemberSearch: function (e) {
    const keyword = e.detail.value
    this.setData({
      memberSearchKeyword: keyword
    })
    
    // 筛选成员
    const filtered = this.data.group.members && Array.isArray(this.data.group.members) 
      ? this.data.group.members.filter(member => 
          member.nickName.toLowerCase().includes(keyword.toLowerCase())
        )
      : []
    
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
    
    app.showToast(`已将 ${member.nickName} 的角色更改为 ${this.getRoleText(newRole)}`, 'success')
  },

  // 移除成员
  removeMember: function (e) {
    const member = e.currentTarget.dataset.member
    
    wx.showModal({
      title: '确认移除',
      content: `确定要移除成员 ${member.nickName} 吗？`,
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
      m.userId === member.userId || m.nickName === member.nickName
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
      
      app.showToast(`已移除成员 ${member.nickName}`, 'success')
      
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

  // 执行解散群组（云开发版本）
  performDeleteGroup: function () {
    app.showLoading('解散群组中...')
    
    wx.cloud.callFunction({
      name: 'groupManager',
      data: {
        action: 'delete',
        groupId: this.data.group._id || this.data.group.id
      },
      success: (res) => {
        app.hideLoading()
        if (res.result.success) {
          // 从本地存储中移除群组
          let groups = wx.getStorageSync('groups') || []
          groups = groups.filter(g => (g._id !== this.data.group._id && g.id !== this.data.group.id))
          wx.setStorageSync('groups', groups)
          
          app.showToast('群组已解散', 'success')
          
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          app.showToast('解散群组失败: ' + res.result.message)
        }
      },
      fail: (error) => {
        app.hideLoading()
        console.error('解散群组失败:', error)
        app.showToast('解散群组失败，请重试')
      }
    })
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
    const groupId = group._id || group.id
    return {
      title: `邀请你加入旅游群：${group.name}`,
      path: `/pages/group/detail/detail?id=${groupId}`,
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