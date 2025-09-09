// pages/group/group.js
const app = getApp()

Page({
  data: {
    groups: [],
    filteredGroups: [],
    myGroups: [],
    joinedGroups: [],
    currentType: 'all',
    searchKeyword: '',
    showJoinModal: false,
    roomCode: '',
    verifyCode: '',
    expandedSections: {
      my: true,
      joined: true
    }
  },

  onLoad: function (options) {
    this.checkLoginAndRedirect()
  },

  onShow: function () {
    this.checkLoginAndRedirect()
  },

  // 检查登录状态并重定向
  checkLoginAndRedirect: function () {
    const isLoggedIn = wx.getStorageSync('userToken') ? true : false
    
    if (!isLoggedIn) {
      // 未登录，跳转到登录页面
      wx.switchTab({
        url: '/pages/profile/profile'
      })
      return
    }
    
    // 已登录，加载数据
    this.loadGroups()
  },

  // 加载群组数据
  loadGroups: function () {
    const groups = wx.getStorageSync('groups') || []
    this.setData({
      groups: groups
    })
    this.filterGroups()
  },

  // 过滤群组并分组
  filterGroups: function () {
    let filtered = this.data.groups

    // 按类型过滤 - 只显示用户创建或加入的群组
    const currentUser = app.globalData.userInfo
    const currentUserId = currentUser ? currentUser.id : null
    const currentUserName = currentUser ? currentUser.nickName : ''
    
    if (this.data.currentType === 'my') {
      filtered = filtered.filter(group => group.creatorId === currentUserId)
    }else {
      // 全部：显示用户创建或加入的群组
      filtered = filtered.filter(group => 
        group.creatorId === currentUserId || 
        (group.members && group.members.some(member => 
          member.id === currentUserId || member.name === currentUserName
        ))
      )
    }

    // 按关键词搜索
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase()
      filtered = filtered.filter(group => 
        group.name.toLowerCase().includes(keyword) ||
        (group.description && group.description.toLowerCase().includes(keyword))
      )
    }

    // 分组群组
    const myGroups = filtered.filter(group => group.creatorId === currentUserId)
    const joinedGroups = filtered.filter(group => 
      group.members && 
      group.members.some(member => 
        member.id === currentUserId || member.name === currentUserName
      )
    )

    this.setData({
      filteredGroups: filtered,
      myGroups: myGroups,
      joinedGroups: joinedGroups
    })
  },

  // 搜索输入
  onSearchInput: function (e) {
    this.setData({
      searchKeyword: e.detail.value
    })
    this.filterGroups()
  },

  // 切换群组类型
  switchType: function (e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      currentType: type
    })
    this.filterGroups()
  },

  // 切换分组展开状态
  toggleSection: function (e) {
    const section = e.currentTarget.dataset.section
    const expandedSections = { ...this.data.expandedSections }
    expandedSections[section] = !expandedSections[section]
    
    this.setData({
      expandedSections: expandedSections
    })
  },

  // 创建群组
  createGroup: function () {
    wx.navigateTo({
      url: '/pages/group/create'
    })
  },

  // 打开群组
  openGroup: function (e) {
    const groupId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/group/detail?id=${groupId}`
    })
  },

  // 编辑群组
  editGroup: function (e) {
    const groupId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/group/create?id=${groupId}`
    })
  },

  // 删除群组
  deleteGroup: function (e) {
    const groupId = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个群组吗？删除后无法恢复。',
      success: (res) => {
        if (res.confirm) {
          this.performDeleteGroup(groupId)
        }
      }
    })
  },

  // 导航到小工具页面
  navigateToTools: function () {
    wx.navigateTo({
      url: '/pages/tools/tools'
    })
  },

  // 执行删除群组
  performDeleteGroup: function (groupId) {
    let groups = this.data.groups
    groups = groups.filter(group => group.id !== groupId)
    
    // 更新本地存储
    wx.setStorageSync('groups', groups)
    
    // 更新页面数据
    this.setData({
      groups: groups
    })
    this.filterGroups()
    
    app.showToast('群组已删除')
  },

  // 显示加入群组弹窗
  showJoinModal: function () {
    this.setData({
      showJoinModal: true,
      roomCode: '',
      verifyCode: ''
    })
  },

  // 隐藏加入群组弹窗
  hideJoinModal: function () {
    this.setData({
      showJoinModal: false
    })
  },

  // 房间号输入
  onRoomCodeInput: function (e) {
    this.setData({
      roomCode: e.detail.value
    })
  },

  // 加入群组
  joinGroup: function () {
    const { roomCode, verifyCode } = this.data
    
    if (!roomCode || roomCode.length !== 6) {
      app.showToast('请输入6位房间号')
      return
    }

    // 查找群组
    const group = this.data.groups.find(g => g.roomCode === roomCode)
    
    if (!group) {
      app.showToast('房间号不存在')
      return
    }

    // 检查验证码
    if (group.verifyCode && group.verifyCode !== verifyCode) {
      app.showToast('验证码错误')
      return
    }

    // 检查是否已加入
    const currentUser = app.globalData.userInfo
    if (!currentUser) {
      app.showToast('请先登录')
      return
    }
    
    // 检查用户是否已经是群组成员（通过ID或昵称检查）
    const isAlreadyMember = group.members && group.members.some(member => 
      member.id === currentUser.id || member.name === currentUser.nickName
    )
    
    if (isAlreadyMember) {
      app.showToast('您已经是该群组成员')
      return
    }

    // 检查群组人数
    if (group.memberCount >= group.maxMembers) {
      app.showToast('群组人数已满')
      return
    }

    // 加入群组
    this.performJoinGroup(group)
  },

  // 执行加入群组
  performJoinGroup: function (group) {
    let groups = this.data.groups
    const groupIndex = groups.findIndex(g => g.id === group.id)
    
    if (groupIndex > -1) {
      // 添加成员
      const currentUser = app.globalData.userInfo
      if (!currentUser) {
        app.showToast('请先登录')
        return
      }
      
      if (!groups[groupIndex].members) {
        groups[groupIndex].members = []
      }
      
      // 创建成员对象
      const memberInfo = {
        id: currentUser.id,
        name: currentUser.nickName,
        avatar: currentUser.avatarUrl || '/images/default-avatar.png',
        role: 'member',
        joinTime: new Date().toISOString()
      }
      
      groups[groupIndex].members.push(memberInfo)
      groups[groupIndex].memberCount = groups[groupIndex].members.length
      
      // 更新本地存储
      wx.setStorageSync('groups', groups)
      
      // 更新页面数据
      this.setData({
        groups: groups
      })
      this.filterGroups()
      
      // 隐藏弹窗
      this.hideJoinModal()
      
      app.showToast('成功加入群组')
      
      // 跳转到群组详情页
      wx.navigateTo({
        url: `/pages/group/detail?id=${group.id}`
      })
    }
  },


  // 下拉刷新
  onPullDownRefresh: function () {
    this.loadGroups()
    wx.stopPullDownRefresh()
  }
})
