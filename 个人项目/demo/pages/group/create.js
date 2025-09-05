// pages/group/create.js
const app = getApp()

Page({
  data: {
    // 编辑模式
    isEdit: false,
    groupId: null,
    
    // 基本信息
    groupName: '',
    groupDesc: '',
    
    // 群组设置
    maxMembers: 10,
    maxMembersOptions: [5, 10, 15, 20],
    
    // 功能设置
    features: {
      random: true,
      priceVote: true,
      sharedAlbum: true,
      mapCheckin: true
    },
    
    // 群组封面
    coverImage: '',
    
    // 标签设置
    selectedTags: [],
    popularTags: [
      '国内游', '出境游', '自驾游', '背包客', '摄影游',
      '美食游', '文化游', '户外游', '亲子游', '情侣游',
      '商务游', '学生游', '老年游', '深度游', '休闲游'
    ],
    
    // 弹窗控制
    showTagModal: false,
    customTag: '',
    
    // 表单验证
    canCreate: false
  },

  onLoad: function (options) {
    if (options.id) {
      this.setData({
        isEdit: true,
        groupId: options.id
      })
      this.loadGroupData(options.id)
    }
    this.checkFormStatus()
  },

  onShow: function () {
    // 页面显示时的处理
  },

  // 加载群组数据（编辑模式）
  loadGroupData: function (groupId) {
    const groups = wx.getStorageSync('groups') || []
    const group = groups.find(g => g.id === groupId)
    
    if (group) {
      this.setData({
        groupName: group.name,
        groupDesc: group.description || '',
        maxMembers: group.maxMembers || 10,
        features: group.features || {
          random: true,
          priceVote: true,
          sharedAlbum: true,
          mapCheckin: true
        },
        coverImage: group.coverImage || '',
        selectedTags: group.tags || []
      })
      this.checkFormStatus()
    }
  },

  // 检查表单状态
  checkFormStatus: function () {
    const canCreate = this.data.groupName.trim() !== ''
    this.setData({
      canCreate: canCreate
    })
  },

  // 群组名称输入
  onNameInput: function (e) {
    this.setData({
      groupName: e.detail.value
    })
    this.checkFormStatus()
  },

  // 群组描述输入
  onDescInput: function (e) {
    this.setData({
      groupDesc: e.detail.value
    })
  },


  // 选择最大成员数
  selectMaxMembers: function (e) {
    const count = parseInt(e.currentTarget.dataset.count)
    this.setData({
      maxMembers: count
    })
  },


  // 切换功能开关
  toggleFeature: function (e) {
    const feature = e.currentTarget.dataset.feature
    const checked = e.detail.value
    
    this.setData({
      [`features.${feature}`]: checked
    })
  },

  // 选择封面图片
  selectCover: function () {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        this.setData({
          coverImage: res.tempFilePaths[0]
        })
      }
    })
  },

  // 拍照
  takePhoto: function () {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera'],
      success: (res) => {
        this.setData({
          coverImage: res.tempFilePaths[0]
        })
      }
    })
  },

  // 删除封面
  removeCover: function () {
    this.setData({
      coverImage: ''
    })
  },

  // 显示标签选择器
  showTagSelector: function () {
    this.setData({
      showTagModal: true
    })
  },

  // 隐藏标签选择器
  hideTagSelector: function () {
    this.setData({
      showTagModal: false,
      customTag: ''
    })
  },

  // 切换标签选择
  toggleTag: function (e) {
    const tag = e.currentTarget.dataset.tag
    const selectedTags = [...this.data.selectedTags]
    const index = selectedTags.indexOf(tag)
    
    if (index > -1) {
      selectedTags.splice(index, 1)
    } else {
      if (selectedTags.length < 5) {
        selectedTags.push(tag)
      } else {
        app.showToast('最多只能选择5个标签', 'none')
        return
      }
    }
    
    this.setData({
      selectedTags: selectedTags
    })
  },

  // 自定义标签输入
  onCustomTagInput: function (e) {
    this.setData({
      customTag: e.detail.value
    })
  },

  // 添加自定义标签
  addCustomTag: function () {
    const customTag = this.data.customTag.trim()
    if (!customTag) {
      app.showToast('请输入标签内容', 'none')
      return
    }
    
    if (this.data.selectedTags.length >= 5) {
      app.showToast('最多只能添加5个标签', 'none')
      return
    }
    
    if (this.data.selectedTags.includes(customTag)) {
      app.showToast('标签已存在', 'none')
      return
    }
    
    const selectedTags = [...this.data.selectedTags, customTag]
    this.setData({
      selectedTags: selectedTags,
      customTag: ''
    })
    
    app.showToast('自定义标签已添加', 'success')
  },

  // 删除标签
  removeTag: function (e) {
    const index = e.currentTarget.dataset.index
    const selectedTags = [...this.data.selectedTags]
    selectedTags.splice(index, 1)
    
    this.setData({
      selectedTags: selectedTags
    })
  },

  // 确认标签选择
  confirmTags: function () {
    this.hideTagSelector()
  },

  // 创建/保存群组
  createGroup: function () {
    if (!this.data.canCreate) {
      app.showToast('请填写群组名称', 'none')
      return
    }


    const loadingText = this.data.isEdit ? '正在保存群组...' : '正在创建群组...'
    app.showLoading(loadingText)

    // 模拟创建/保存群组
    setTimeout(() => {
      if (this.data.isEdit) {
        this.performUpdateGroup()
      } else {
        this.performCreateGroup()
      }
    }, 1500)
  },

  // 执行创建群组
  performCreateGroup: function () {
    // 生成6位随机房间号
    const roomCode = this.generateRoomCode()
    
    const groupData = {
      id: Date.now().toString(),
      roomCode: roomCode, // 添加房间号
      name: this.data.groupName,
      description: this.data.groupDesc,
      maxMembers: this.data.maxMembers,
      features: this.data.features,
      coverImage: this.data.coverImage,
      tags: this.data.selectedTags,
      creator: app.globalData.userInfo ? app.globalData.userInfo.nickName : app.globalData.userInfo.nickName,
      createTime: new Date().toISOString(),
      status: 'active'
    }

    // 保存到本地存储
    this.saveGroupToStorage(groupData)
    
    app.hideLoading()
    app.showToast('群组创建成功！', 'success')
    
    // 自动加入群组
    this.autoJoinGroup(groupData)
    
    // 延迟跳转，让用户看到成功提示
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  },

  // 执行更新群组
  performUpdateGroup: function () {
    const groups = wx.getStorageSync('groups') || []
    const groupIndex = groups.findIndex(g => g.id === this.data.groupId)
    
    if (groupIndex > -1) {
      // 更新群组信息
      groups[groupIndex].name = this.data.groupName
      groups[groupIndex].description = this.data.groupDesc
      groups[groupIndex].maxMembers = this.data.maxMembers
      groups[groupIndex].features = this.data.features
      groups[groupIndex].coverImage = this.data.coverImage
      groups[groupIndex].tags = this.data.selectedTags
      groups[groupIndex].updateTime = new Date().toISOString()
      
      // 保存到本地存储
      wx.setStorageSync('groups', groups)
      
      app.hideLoading()
      app.showToast('群组信息已更新！', 'success')
      
      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } else {
      app.hideLoading()
      app.showToast('群组不存在', 'error')
    }
  },

  // 保存群组到本地存储
  saveGroupToStorage: function (groupData) {
    let groups = wx.getStorageSync('groups') || []
    groups.unshift(groupData)
    wx.setStorageSync('groups', groups)
    
    // 更新全局数据
    if (app.globalData.groups) {
      app.globalData.groups.unshift(groupData)
    }
  },

  // 自动加入群组
  autoJoinGroup: function (groupData) {
    const currentUser = app.globalData.userInfo
    if (currentUser) {
      // 将创建者添加到群组成员列表
      const memberInfo = {
        id: currentUser.id,
        name: currentUser.nickName,
        avatar: currentUser.avatarUrl || '/images/default-avatar.png',
        joinTime: new Date().toISOString(),
        role: 'creator'
      }
      
      // 更新群组成员信息
      let groups = wx.getStorageSync('groups') || []
      const groupIndex = groups.findIndex(g => g.id === groupData.id)
      if (groupIndex !== -1) {
        if (!groups[groupIndex].members) {
          groups[groupIndex].members = []
        }
        groups[groupIndex].members.push(memberInfo)
        groups[groupIndex].memberCount = groups[groupIndex].members.length
        groups[groupIndex].creatorId = currentUser.id // 添加创建者ID
        wx.setStorageSync('groups', groups)
      }
    }
  },

  // 生成6位随机房间号
  generateRoomCode: function () {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    // 检查是否重复
    const groups = wx.getStorageSync('groups') || []
    const isDuplicate = groups.some(group => group.roomCode === result)
    
    if (isDuplicate) {
      // 如果重复，递归生成新的
      return this.generateRoomCode()
    }
    
    return result
  },

  // 取消创建
  cancelCreate: function () {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消创建群组吗？已填写的内容将丢失。',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack()
        }
      }
    })
  },

  // 阻止事件冒泡
  stopPropagation: function () {
    // 空函数，用于阻止事件冒泡
  },

  // 分享小程序
  onShareAppMessage: function () {
    return {
      title: '创建旅游群，与朋友一起规划完美旅程',
      path: '/pages/group/create'
    }
  },

  onShareTimeline: function () {
    return {
      title: '创建旅游群，与朋友一起规划完美旅程'
    }
  }
})