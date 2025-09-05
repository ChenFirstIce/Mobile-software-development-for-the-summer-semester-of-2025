// pages/album/create.js
const app = getApp()

Page({
  data: {
    isEdit: false,
    albumId: null,
    albumName: '',
    albumDesc: '',
    albumType: 'personal',
    coverImage: '',
    selectedTags: [],
    selectedGroup: null,
    selectedGroupId: null,
    allowView: true,
    allowEdit: true,
    allowUpload: true,
    showTagModal: false,
    showGroupModal: false,
    tagCategories: [
      {
        name: '旅行主题',
        tags: ['风景', '美食', '文化', '建筑', '自然', '城市', '乡村', '海滩', '山脉', '历史']
      },
      {
        name: '季节',
        tags: ['春天', '夏天', '秋天', '冬天', '雨季', '雪季']
      },
      {
        name: '活动',
        tags: ['徒步', '摄影', '购物', '美食', '娱乐', '运动', '休闲', '探险']
      }
    ],
    availableGroups: []
  },

  onLoad: function (options) {
    if (options.id) {
      this.setData({
        isEdit: true,
        albumId: options.id
      })
      this.loadAlbumData(options.id)
    }
    
    // 如果从群组页面传入参数，自动设置群组关联
    if (options.groupId) {
      this.setData({
        albumType: 'shared',
        selectedGroupId: options.groupId,
        selectedGroup: {
          id: options.groupId,
          name: decodeURIComponent(options.groupName || '群组相册')
        }
      })
    }
    
    this.loadAvailableGroups()
  },

  // 加载相册数据（编辑模式）
  loadAlbumData: function (albumId) {
    const albums = wx.getStorageSync('albums') || []
    const album = albums.find(a => a.id === albumId)
    
    if (album) {
      this.setData({
        albumName: album.name,
        albumDesc: album.description || '',
        albumType: album.type || 'personal',
        coverImage: album.coverImage || '',
        selectedTags: album.tags || [],
        selectedGroup: album.group || null,
        selectedGroupId: album.groupId || null,
        allowView: album.permissions ? album.permissions.view : true,
        allowEdit: album.permissions ? album.permissions.edit : true,
        allowUpload: album.permissions ? album.permissions.upload : true
      })
    }
  },

  // 加载可用群组
  loadAvailableGroups: function () {
    const groups = wx.getStorageSync('groups') || []
    const currentUserId = app.globalData.userInfo?.id
    const availableGroups = groups.filter(group => {
      // 检查是否是群主
      if (group.creatorId === currentUserId) return true
      // 检查是否是群成员
      if (group.members && group.members.some(member => member.id === currentUserId)) return true
      return false
    })
    
    this.setData({
      availableGroups: availableGroups
    })
  },

  // 相册名称输入
  onNameInput: function (e) {
    this.setData({
      albumName: e.detail.value
    })
  },

  // 相册描述输入
  onDescInput: function (e) {
    this.setData({
      albumDesc: e.detail.value
    })
  },

  // 选择相册类型
  selectType: function (e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      albumType: type
    })
  },

  // 选择群组
  selectGroup: function () {
    if (this.data.availableGroups.length === 0) {
      app.showToast('暂无可用的群组')
      return
    }
    
    this.setData({
      showGroupModal: true
    })
  },

  // 选择群组项目
  selectGroupItem: function (e) {
    const group = e.currentTarget.dataset.group
    this.setData({
      selectedGroup: group,
      selectedGroupId: group.id
    })
  },

  // 确认群组选择
  confirmGroup: function () {
    this.setData({
      showGroupModal: false
    })
  },

  // 隐藏群组选择器
  hideGroupSelector: function () {
    this.setData({
      showGroupModal: false
    })
  },

  // 切换权限
  togglePermission: function (e) {
    const type = e.currentTarget.dataset.type
    const currentValue = this.data[`allow${type.charAt(0).toUpperCase() + type.slice(1)}`]
    
    this.setData({
      [`allow${type.charAt(0).toUpperCase() + type.slice(1)}`]: !currentValue
    })
  },

  // 选择封面图片
  selectCover: function () {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          coverImage: res.tempFilePaths[0]
        })
      }
    })
  },

  // 更换封面图片
  changeCover: function () {
    this.selectCover()
  },

  // 删除封面图片
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
      showTagModal: false
    })
  },

  // 切换标签选择
  toggleTag: function (e) {
    const categoryName = e.currentTarget.dataset.category
    const tag = e.currentTarget.dataset.tag
    
    let selectedTags = [...this.data.selectedTags]
    const index = selectedTags.indexOf(tag)
    
    if (index > -1) {
      selectedTags.splice(index, 1)
    } else {
      if (selectedTags.length < 10) {
        selectedTags.push(tag)
      } else {
        app.showToast('最多只能选择10个标签')
        return
      }
    }
    
    this.setData({
      selectedTags: selectedTags
    })
  },

  // 确认标签选择
  confirmTags: function () {
    this.setData({
      showTagModal: false
    })
  },

  // 删除标签
  removeTag: function (e) {
    const index = e.currentTarget.dataset.index
    let selectedTags = [...this.data.selectedTags]
    selectedTags.splice(index, 1)
    
    this.setData({
      selectedTags: selectedTags
    })
  },

  // 保存相册
  saveAlbum: function () {
    if (!this.data.albumName.trim()) {
      app.showToast('请输入相册名称')
      return
    }

    if (this.data.albumType === 'shared' && !this.data.selectedGroup) {
      app.showToast('请选择关联群组')
      return
    }

    const albumData = {
      id: this.data.isEdit ? this.data.albumId : Date.now().toString(),
      name: this.data.albumName.trim(),
      description: this.data.albumDesc.trim(),
      type: this.data.albumType,
      coverImage: this.data.coverImage,
      tags: this.data.selectedTags,
      group: this.data.selectedGroup,
      groupId: this.data.selectedGroupId,
      permissions: {
        view: this.data.allowView,
        edit: this.data.allowEdit,
        upload: this.data.allowUpload
      },
      creatorId: app.globalData.userInfo?.id || 'unknown',
      creatorName: app.globalData.userInfo?.nickName || '未知用户',
      createTime: this.data.isEdit ? this.data.createTime : new Date().toLocaleString(),
      updateTime: new Date().toLocaleString(),
      photoCount: this.data.isEdit ? this.data.photoCount : 0,
      memberCount: this.data.isEdit ? this.data.memberCount : 1,
      status: 'active'
    }

    this.saveAlbumToStorage(albumData)
  },

  // 保存相册到存储
  saveAlbumToStorage: function (albumData) {
    let albums = wx.getStorageSync('albums') || []
    
    if (this.data.isEdit) {
      // 编辑模式：更新现有相册
      const index = albums.findIndex(a => a.id === this.data.albumId)
      if (index > -1) {
        albums[index] = { ...albums[index], ...albumData }
      }
    } else {
      // 创建模式：添加新相册
      albums.push(albumData)
    }
    
    // 保存到本地存储
    wx.setStorageSync('albums', albums)
    
    // 显示成功提示
    app.showToast(this.data.isEdit ? '相册修改成功' : '相册创建成功')
    
    // 返回上一页
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  },

  // 取消创建
  cancelCreate: function () {
    wx.navigateBack()
  },
})