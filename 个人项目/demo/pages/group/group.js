// pages/group/group.js
const app = getApp()
const util = require('../../utils/util')

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
    expandedSections: {
      my: true,
      joined: true
    }
  },

  onLoad: function (options) {
    util.checkLoginAndRedirect(this, this.onLoggedIn)
  },

  onShow: function () {
    util.checkLoginAndRedirect(this, this.onLoggedIn)
  },

  // 登录成功后的回调
  onLoggedIn: function () {
    this.loadGroups()
  },

  // 加载群组数据（云开发版本）
  loadGroups: function () {
    app.showLoading('加载中...')
    
    // 调用云函数获取群组列表
    wx.cloud.callFunction({
      name: 'groupManager',
      data: {
        action: 'getList'
      },
      success: (res) => {
        app.hideLoading()
        if (res.result.success) {
          const groups = res.result.data
          
          // 更新本地存储
          wx.setStorageSync('groups', groups)
          
          this.setData({
            groups: groups
          })
          this.filterGroups()
        } else {
          app.showToast('加载群组失败: ' + res.result.message)
          // 降级到本地存储
          this.loadGroupsFromLocal()
        }
      },
      fail: (error) => {
        app.hideLoading()
        console.error('云函数调用失败:', error)
        app.showToast('网络错误，使用本地数据')
        // 降级到本地存储
        this.loadGroupsFromLocal()
      }
    })
  },

  // 从本地存储加载群组（降级方案）
  loadGroupsFromLocal: function () {
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
    const currentUserId = currentUser ? currentUser._openid : null
    const currentUserName = currentUser ? currentUser.nickName : ''
    
    if (this.data.currentType === 'my') {
      filtered = filtered.filter(group => group.creatorId === currentUserId)
    }else {
      // 全部：显示用户创建或加入的群组
      filtered = filtered.filter(group => 
        group.creatorId === currentUserId || 
        (group.members && Array.isArray(group.members) && group.members.some(member => 
          member.userId === currentUserId || member.nickName === currentUserName
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
      group.creatorId !== currentUserId && // 排除我创建的群组
      group.members && 
      group.members.some(member => 
        member.userId === currentUserId || member.nickName === currentUserName
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


  // 执行删除群组（云开发版本）
  performDeleteGroup: function (groupId) {
    app.showLoading('删除中...')
    
    wx.cloud.callFunction({
      name: 'groupManager',
      data: {
        action: 'delete',
        groupId: groupId
      },
      success: (res) => {
        app.hideLoading()
        if (res.result.success) {
          // 从本地数据中移除
          let groups = this.data.groups
          groups = groups.filter(group => group._id !== groupId && group.id !== groupId)
          
          // 更新本地存储
          wx.setStorageSync('groups', groups)
          
          // 更新页面数据
          this.setData({
            groups: groups
          })
          this.filterGroups()
          
          app.showToast('群组已删除')
        } else {
          app.showToast('删除失败: ' + res.result.message)
        }
      },
      fail: (error) => {
        app.hideLoading()
        console.error('删除群组失败:', error)
        app.showToast('删除失败，请重试')
      }
    })
  },

  // 显示加入群组弹窗
  showJoinModal: function () {
    this.setData({
      showJoinModal: true,
      roomCode: ''
    })
  },

  // 隐藏加入群组弹窗
  hideJoinModal: function () {
    this.setData({
      showJoinModal: false
    })
  },

  // 阻止事件冒泡
  stopPropagation: function () {
    // 阻止事件冒泡，防止点击弹窗内容时关闭弹窗
  },

  // 房间号输入
  onRoomCodeInput: function (e) {
    this.setData({
      roomCode: e.detail.value
    })
  },

  // 加入群组
  joinGroup: function () {
    const { roomCode } = this.data
    
    if (!roomCode || roomCode.length !== 6) {
      app.showToast('请输入6位房间号')
      return
    }

    app.showLoading('搜索群组中...')
    
    // 先搜索群组
    wx.cloud.callFunction({
      name: 'groupManager',
      data: {
        action: 'searchByRoomCode',
        roomCode: roomCode
      },
      success: (res) => {
        app.hideLoading()
        console.log('云函数返回结果:', res)
        
        if (res.result && res.result.success) {
          const groupInfo = res.result.data
          
          // 检查是否已经是成员
          if (groupInfo.isAlreadyMember) {
            app.showToast('您已经是该群组成员')
            return
          }
          
          // 直接执行加入群组
          this.performJoinGroupByRoomCode(roomCode)
        } else {
          const errorMsg = res.result ? res.result.message : '未知错误'
          console.error('搜索群组失败:', errorMsg)
          app.showToast('搜索失败: ' + errorMsg)
        }
      },
      fail: (error) => {
        app.hideLoading()
        console.error('云函数调用失败:', error)
        app.showToast('网络错误，请检查云函数是否已部署')
      }
    })
  },

  // 通过房间号执行加入群组（云开发版本）
  performJoinGroupByRoomCode: function (roomCode) {
    app.showLoading('加入群组中...')
    
    wx.cloud.callFunction({
      name: 'groupManager',
      data: {
        action: 'joinByRoomCode',
        roomCode: roomCode
      },
      success: (res) => {
        app.hideLoading()
        if (res.result.success) {
          // 隐藏弹窗
          this.hideJoinModal()
          
          app.showToast('成功加入群组')
          
          // 重新加载群组列表
          this.loadGroups()
          
          // 跳转到群组详情页
          wx.navigateTo({
            url: `/pages/group/detail?id=${res.result.data.groupId}`
          })
        } else {
          app.showToast(res.result.message)
        }
      },
      fail: (error) => {
        app.hideLoading()
        console.error('加入群组失败:', error)
        app.showToast('加入群组失败，请重试')
      }
    })
  },

  // 执行加入群组（本地版本，保留作为备用）
  performJoinGroup: function (group) {
    let groups = this.data.groups
    const groupIndex = groups.findIndex(g => g._id === group._id || g.id === group.id)
    
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

  // 导航到工具页面
  navigateToTools: function () {
    // 获取当前选中的群组
    const currentGroup = this.data.groups.find(group => group._id || group.id)
    if (currentGroup) {
      wx.navigateTo({
        url: `/pages/tools/tools?groupId=${currentGroup._id || currentGroup.id}`
      })
    } else {
      wx.navigateTo({
        url: '/pages/tools/tools'
      })
    }
  }

})
