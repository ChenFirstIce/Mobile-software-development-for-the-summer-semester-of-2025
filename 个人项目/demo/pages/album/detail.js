// pages/album/detail.js
const app = getApp()

Page({
  data: {
    album: {},
    photos: [],
    viewMode: 'grid', // grid 或 list
    isBatchMode: false,
    selectedPhotos: [],
    isAllSelected: false,
    showPhotoModal: false,
    selectedPhoto: {},
    canEdit: false
  },

  onLoad: function (options) {
    if (options.id) {
      this.loadAlbumData(options.id)
      this.loadPhotos(options.id)
      
      // 如果是从快速拍照跳转过来的，自动打开拍照功能
      if (options.fromQuickPhoto === 'true') {
        setTimeout(() => {
          this.addPhotos()
        }, 500) // 延迟500ms确保页面加载完成
      }
    }
  },

  onShow: function () {
    // 页面显示时刷新数据
    if (this.data.album.id) {
      this.loadPhotos(this.data.album.id)
    }
  },

  // 加载相册数据
  loadAlbumData: function (albumId) {
    const albums = wx.getStorageSync('albums') || []
    const album = albums.find(a => a.id === albumId)
    
    if (album) {
      // 检查编辑权限
      const canEdit = this.checkEditPermission(album)
      
      this.setData({
        album: album,
        canEdit: canEdit
      })
    } else {
      app.showToast('相册不存在')
      wx.navigateBack()
    }
  },

  // 检查编辑权限
  checkEditPermission: function (album) {
    const currentUserId = app.globalData.userInfo?.id
    
    if (!currentUserId) return false
    
    // 创建者可以编辑
    if (album.creatorId === currentUserId) return true
    
    // 共有相册且用户有编辑权限
    if (album.type === 'shared' && album.permissions && album.permissions.edit) {
      // 检查用户是否在群组中
      if (album.groupId) {
        const groups = wx.getStorageSync('groups') || []
        const group = groups.find(g => g.id === album.groupId)
        if (group && group.members && group.members.includes(currentUserId)) {
          return true
        }
      }
    }
    
    return false
  },

  // 加载照片数据
  loadPhotos: function (albumId) {
    const allPhotos = wx.getStorageSync('photos') || []
    const photos = allPhotos.filter(photo => photo.albumId === albumId)
    
    this.setData({
      photos: photos
    })
    
    // 更新相册照片数量
    this.updateAlbumPhotoCount(albumId, photos.length)
  },

  // 更新相册照片数量
  updateAlbumPhotoCount: function (albumId, count) {
    let albums = wx.getStorageSync('albums') || []
    const albumIndex = albums.findIndex(a => a.id === albumId)
    
    if (albumIndex > -1) {
      albums[albumIndex].photoCount = count
      wx.setStorageSync('albums', albums)
      
      this.setData({
        'album.photoCount': count
      })
    }
  },

  // 切换视图模式
  switchViewMode: function (e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({
      viewMode: mode
    })
  },

  // 添加照片
  addPhotos: function () {
    wx.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.uploadPhotos(res.tempFilePaths)
      }
    })
  },

  // 上传照片
  uploadPhotos: function (tempFilePaths) {
    app.showLoading('正在上传照片...')
    
    const photos = tempFilePaths.map((filePath, index) => {
      return {
        id: Date.now() + index,
        albumId: this.data.album.id,
        url: filePath,
        name: `照片${index + 1}`,
        description: '',
        location: '',
        uploadTime: new Date().toLocaleString(),
        size: 0, // 实际项目中应该获取文件大小
        type: 'image'
      }
    })
    
    // 保存照片到本地存储
    let allPhotos = wx.getStorageSync('photos') || []
    allPhotos = allPhotos.concat(photos)
    wx.setStorageSync('photos', allPhotos)
    
    // 更新页面数据
    this.setData({
      photos: [...this.data.photos, ...photos]
    })
    
    // 更新相册照片数量
    this.updateAlbumPhotoCount(this.data.album.id, this.data.photos.length)
    
    app.hideLoading()
    app.showToast(`成功上传 ${photos.length} 张照片`)
  },

  // 编辑相册
  editAlbum: function () {
    wx.navigateTo({
      url: `/pages/album/create?id=${this.data.album.id}`
    })
  },

  // 查看照片
  viewPhoto: function (e) {
    if (this.data.isBatchMode) {
      this.togglePhotoSelection(e.currentTarget.dataset.id)
      return
    }
    
    const photoId = e.currentTarget.dataset.id
    const photo = this.data.photos.find(p => p.id === photoId)
    
    if (photo) {
      this.setData({
        selectedPhoto: photo,
        showPhotoModal: true
      })
    }
  },

  // 删除照片
  deletePhoto: function (e) {
    const photoId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张照片吗？',
      confirmText: '删除',
      confirmColor: '#f44336',
      success: (res) => {
        if (res.confirm) {
          this.performDeletePhoto(photoId)
        }
      }
    })
  },

  // 执行删除照片
  performDeletePhoto: function (photoId) {
    let allPhotos = wx.getStorageSync('photos') || []
    allPhotos = allPhotos.filter(photo => photo.id !== photoId)
    wx.setStorageSync('photos', allPhotos)
    
    // 更新页面数据
    const photos = this.data.photos.filter(photo => photo.id !== photoId)
    this.setData({
      photos: photos
    })
    
    // 更新相册照片数量
    this.updateAlbumPhotoCount(this.data.album.id, photos.length)
    
    app.showToast('照片已删除')
  },

  // 下载照片
  downloadPhoto: function (e) {
    const photoId = e.currentTarget.dataset.id
    const photo = this.data.photos.find(p => p.id === photoId)
    
    if (photo) {
      wx.saveImageToPhotosAlbum({
        filePath: photo.url,
        success: () => {
          app.showToast('照片已保存到相册')
        },
        fail: () => {
          app.showToast('保存失败，请检查权限')
        }
      })
    }
  },

  // 切换批量操作模式
  toggleBatchMode: function () {
    this.setData({
      isBatchMode: !this.data.isBatchMode,
      selectedPhotos: [],
      isAllSelected: false
    })
  },

  // 退出批量操作模式
  exitBatchMode: function () {
    this.setData({
      isBatchMode: false,
      selectedPhotos: [],
      isAllSelected: false
    })
  },

  // 切换照片选择状态
  togglePhotoSelection: function (photoId) {
    let selectedPhotos = this.data.selectedPhotos
    const index = selectedPhotos.indexOf(photoId)
    
    if (index > -1) {
      selectedPhotos.splice(index, 1)
    } else {
      selectedPhotos.push(photoId)
    }
    
    this.setData({
      selectedPhotos: selectedPhotos,
      isAllSelected: selectedPhotos.length === this.data.photos.length
    })
  },

  // 全选/取消全选
  selectAll: function () {
    if (this.data.isAllSelected) {
      this.setData({
        selectedPhotos: [],
        isAllSelected: false
      })
    } else {
      const allIds = this.data.photos.map(photo => photo.id)
      this.setData({
        selectedPhotos: allIds,
        isAllSelected: true
      })
    }
  },

  // 批量删除
  batchDelete: function () {
    if (this.data.selectedPhotos.length === 0) {
      app.showToast('请选择要删除的照片')
      return
    }

    wx.showModal({
      title: '批量删除',
      content: `确定要删除选中的 ${this.data.selectedPhotos.length} 张照片吗？`,
      confirmText: '删除',
      confirmColor: '#f44336',
      success: (res) => {
        if (res.confirm) {
          this.performBatchDelete()
        }
      }
    })
  },

  // 执行批量删除
  performBatchDelete: function () {
    const selectedIds = this.data.selectedPhotos
    
    // 从本地存储中删除
    let allPhotos = wx.getStorageSync('photos') || []
    allPhotos = allPhotos.filter(photo => !selectedIds.includes(photo.id))
    wx.setStorageSync('photos', allPhotos)
    
    // 更新页面数据
    const photos = this.data.photos.filter(photo => !selectedIds.includes(photo.id))
    this.setData({
      photos: photos,
      selectedPhotos: [],
      isAllSelected: false,
      isBatchMode: false
    })
    
    // 更新相册照片数量
    this.updateAlbumPhotoCount(this.data.album.id, photos.length)
    
    app.showToast(`已删除 ${selectedIds.length} 张照片`)
  },

  // 隐藏照片详情弹窗
  hidePhotoModal: function () {
    this.setData({
      showPhotoModal: false
    })
  },


  // 分享到微信
  onShareAppMessage: function () {
    return {
      title: `${this.data.album.name} - 相册分享`,
      path: `/pages/album/detail?id=${this.data.album.id}`,
      imageUrl: this.data.album.coverImage || '/images/default-album.png'
    }
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    return {
      title: `${this.data.album.name} - 相册分享`,
      imageUrl: this.data.album.coverImage || '/images/default-album.png'
    }
  }
})