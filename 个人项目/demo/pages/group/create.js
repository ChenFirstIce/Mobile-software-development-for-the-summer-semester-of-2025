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
    app.showLoading('加载群组信息...')
    
    // 先尝试从云函数获取最新数据
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
          this.setGroupData(group)
        } else {
          // 降级到本地存储
          this.loadGroupDataFromLocal(groupId)
        }
      },
      fail: (error) => {
        app.hideLoading()
        console.error('加载群组数据失败:', error)
        // 降级到本地存储
        this.loadGroupDataFromLocal(groupId)
      }
    })
  },

  // 从本地存储加载群组数据（降级方案）
  loadGroupDataFromLocal: function (groupId) {
    const groups = wx.getStorageSync('groups') || []
    const group = groups.find(g => g._id === groupId || g.id === groupId)
    
    if (group) {
      this.setGroupData(group)
    } else {
      app.showToast('群组不存在', 'error')
      wx.navigateBack()
    }
  },

  // 设置群组数据到页面
  setGroupData: function (group) {
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
    const groupData = {
      name: this.data.groupName,
      description: this.data.groupDesc,
      maxMembers: this.data.maxMembers,
      features: this.data.features,
      coverImage: this.data.coverImage,
      tags: this.data.selectedTags,
      status: 'active'
    }

    // 直接调用云函数保存群组
    this.saveGroupToStorage(groupData)
  },

  // 执行更新群组
  performUpdateGroup: function () {
    const groupData = {
      name: this.data.groupName,
      description: this.data.groupDesc,
      maxMembers: this.data.maxMembers,
      features: this.data.features,
      coverImage: this.data.coverImage,
      tags: this.data.selectedTags
    }

    // 调用云函数更新群组
    this.saveGroupToStorage(groupData)
  },

  // 保存群组到本地存储（云开发版本）
  saveGroupToStorage: function (groupData) {
    app.showLoading('保存中...')
    
    const action = this.data.isEdit ? 'update' : 'create'
    const cloudData = {
      action: action,
      groupData: groupData
    }
    
    if (this.data.isEdit) {
      cloudData.groupId = this.data.groupId
    }
    
    // 调用云函数保存群组
    wx.cloud.callFunction({
      name: 'groupManager',
      data: cloudData,
      success: (res) => {
        app.hideLoading()
        if (res.result.success) {
          const savedGroup = res.result.data
          
          // 更新本地存储
          let groups = wx.getStorageSync('groups') || []
          
          if (this.data.isEdit) {
            // 编辑模式：更新现有群组
            const index = groups.findIndex(g => g._id === this.data.groupId)
            if (index > -1) {
              groups[index] = savedGroup
            }
          } else {
            // 创建模式：添加新群组
            groups.unshift(savedGroup)
          }
          
          wx.setStorageSync('groups', groups)
          
          // 更新全局数据
          if (app.globalData.groups) {
            if (this.data.isEdit) {
              const index = app.globalData.groups.findIndex(g => g._id === this.data.groupId)
              if (index > -1) {
                app.globalData.groups[index] = savedGroup
              }
            } else {
              app.globalData.groups.unshift(savedGroup)
            }
          }
          
          // 显示成功提示
          app.showToast(this.data.isEdit ? '群组修改成功' : '群组创建成功')
          
          // 返回上一页
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          app.showToast('保存失败: ' + res.result.message)
        }
      },
      fail: (error) => {
        app.hideLoading()
        console.error('保存群组失败:', error)
        app.showToast('保存失败，请重试')
      }
    })
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