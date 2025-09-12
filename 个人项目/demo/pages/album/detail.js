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
    // 检查登录状态
    if (!app.globalData.isLoggedIn || !app.globalData.userInfo) {
      console.log('用户未登录，跳转到登录页面')
      app.showToast('请先登录')
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }
    
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
    // 页面显示时刷新数据（避免重复加载）
    if ((this.data.album._id || this.data.album.id) && this.data.photos.length === 0) {
      this.loadPhotos(this.data.album._id || this.data.album.id)
    }
  },

  // 加载相册数据
  loadAlbumData: function (albumId) {
    console.log('加载相册数据，相册ID:', albumId)
    const albums = wx.getStorageSync('albums') || []
    console.log('本地存储中的相册数量:', albums.length)
    
    // 尝试多种ID匹配方式
    let album = albums.find(a => a.id === albumId) || 
                albums.find(a => a._id === albumId) ||
                albums.find(a => a.id === albumId.toString()) ||
                albums.find(a => a._id === albumId.toString())
    
    console.log('找到的相册:', album)
    
    if (album) {
      // 确保相册有正确的ID格式
      if (!album._id && album.id) {
        album._id = album.id
      }
      
      // 检查编辑权限
      const canEdit = this.checkEditPermission(album)
      
      this.setData({
        album: album,
        canEdit: canEdit
      })
    } else {
      console.error('相册不存在，相册ID:', albumId)
      app.showToast('相册不存在')
      wx.navigateBack()
    }
  },

  // 检查编辑权限
  checkEditPermission: function (album) {
    const currentUserId = app.globalData.userInfo?._openid
    console.log('==================')
    
    if (!currentUserId) {
      console.log('用户未登录，无编辑权限')
      return false
    }
    
    // 个人相册：创建者可以编辑
    if (album.type === 'personal' || !album.type) {
      const canEdit = album.creatorId === currentUserId
      console.log('个人相册编辑权限:', canEdit)
      return canEdit
    }
    
    // 创建者可以编辑（所有类型相册）
    if (album.creatorId === currentUserId) {
      console.log('创建者编辑权限: true')
      return true
    }
    
    // 共有相册且用户有编辑权限
    if (album.type === 'shared' && album.permissions && album.permissions.edit) {
      // 检查用户是否在群组中
      if (album.groupId) {
        const groups = wx.getStorageSync('groups') || []
        const group = groups.find(g => g.id === album.groupId)
        if (group && group.members && group.members.includes(currentUserId)) {
          console.log('群组成员编辑权限: true')
          return true
        }
      }
    }
    
    console.log('无编辑权限')
    return false
  },

  // 加载照片数据（云开发版本）
  loadPhotos: function (albumId) {
    console.log('开始从云存储加载照片，相册ID:', albumId)
    app.showLoading('加载照片中...')
    
    // 先尝试从云存储获取
    wx.cloud.callFunction({
      name: 'photoManager',
      data: {
        action: 'getList',
        albumId: albumId
      },
      success: (res) => {
        console.log('云函数调用成功:', res)
        
        if (res.result && res.result.success) {
          const cloudPhotos = res.result.data || []
          console.log('从云存储获取到照片数量:', cloudPhotos.length)
          
          // 更新本地存储
          let allPhotos = wx.getStorageSync('photos') || []
          // 移除该相册的旧照片
          allPhotos = allPhotos.filter(photo => photo.albumId !== albumId)
          // 添加新照片
          allPhotos = allPhotos.concat(cloudPhotos)
          wx.setStorageSync('photos', allPhotos)
          
          this.setData({
            photos: cloudPhotos
          })
          
          // 更新相册照片数量
          this.updateAlbumPhotoCount(albumId, cloudPhotos.length)
          app.hideLoading()
          
          if (cloudPhotos.length > 0) {
            app.showToast(`已加载 ${cloudPhotos.length} 张照片`)
          } else {
            app.showToast('相册暂无照片')
          }
        } else {
          console.log('云函数返回失败:', res.result?.message)
          app.hideLoading()
          app.showToast('云存储加载失败，使用本地数据')
          // 降级到本地存储
          this.loadPhotosFromLocal(albumId)
        }
      },
      fail: (error) => {
        console.error('云函数调用失败:', error)
        app.hideLoading()
        app.showToast('网络错误，使用本地数据')
        // 降级到本地存储
        this.loadPhotosFromLocal(albumId)
      }
    })
  },

  // 从本地存储加载照片（降级方案）
  loadPhotosFromLocal: function (albumId) {
    console.log('从本地存储加载照片，相册ID:', albumId)
    const allPhotos = wx.getStorageSync('photos') || []
    console.log('本地存储中的照片总数:', allPhotos.length)
    
    // 尝试多种ID匹配方式
    const photos = allPhotos.filter(photo => 
      photo.albumId === albumId || 
      photo.albumId === albumId.toString() ||
      photo.albumId === this.data.album?.id ||
      photo.albumId === this.data.album?._id
    )
    console.log('匹配相册ID的照片数量:', photos.length)
    
    // 如果没有照片，创建一些测试数据用于调试
    if (photos.length === 0 && albumId) {
      console.log('没有找到照片，创建测试数据')
      this.createTestPhotos(albumId)
      return
    }
    
    this.setData({
      photos: photos
    })
    
    // 更新相册照片数量
    this.updateAlbumPhotoCount(albumId, photos.length)
  },

  // 创建测试照片数据
  createTestPhotos: function (albumId) {
    const testPhotos = [
      {
        id: 'test1_' + Date.now(),
        albumId: albumId,
        url: '/images/default-avatar.png',
        name: '测试照片1',
        description: '这是一张测试照片',
        uploadTime: '2024-01-01 12:00:00',
        createTime: new Date()
      },
      {
        id: 'test2_' + Date.now(),
        albumId: albumId,
        url: '/images/search.png',
        name: '测试照片2',
        description: '这是另一张测试照片',
        uploadTime: '2024-01-01 12:01:00',
        createTime: new Date()
      }
    ]
    
    // 保存到本地存储
    let allPhotos = wx.getStorageSync('photos') || []
    allPhotos = allPhotos.concat(testPhotos)
    wx.setStorageSync('photos', allPhotos)
    
    this.setData({
      photos: testPhotos
    })
    
    this.updateAlbumPhotoCount(albumId, testPhotos.length)
    console.log('创建了测试照片数据')
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
    // 检查是否有编辑权限
    if (!this.data.canEdit) {
      app.showToast('无编辑权限')
      return
    }
    
    wx.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        console.log('选择了照片:', res.tempFilePaths.length, '张')
        this.uploadPhotos(res.tempFilePaths)
      },
      fail: (error) => {
        console.error('选择照片失败:', error)
        app.showToast('选择照片失败')
      }
    })
  },

  // 上传照片（云开发版本）
  uploadPhotos: function (tempFilePaths) {
    app.showLoading('正在上传照片...')
    
    // 检查上传权限
    this.checkUploadPermission().then((hasPermission) => {
      if (!hasPermission) {
        app.hideLoading()
        app.showToast('无上传权限')
        return
      }
      
      // 逐个上传照片到云存储
      this.uploadPhotosToCloud(tempFilePaths, 0)
    }).catch((error) => {
      app.hideLoading()
      console.error('权限检查失败:', error)
      app.showToast('权限检查失败')
    })
  },

  // 检查上传权限
  checkUploadPermission: function () {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'albumManager',
        data: {
          action: 'checkPermission',
          albumId: this.data.album._id
        },
        success: (res) => {
          if (res.result.success) {
            resolve(res.result.data.canUpload)
          } else {
            reject(new Error(res.result.message))
          }
        },
        fail: reject
      })
    })
  },

  // 上传照片到云存储
  uploadPhotosToCloud: function (tempFilePaths, index) {
    if (index >= tempFilePaths.length) {
      app.hideLoading()
      app.showToast(`成功上传 ${tempFilePaths.length} 张照片`)
      return
    }
    
    const filePath = tempFilePaths[index]
    const albumId = this.data.album._id || this.data.album.id
    const fileName = `photos/${albumId}/${Date.now()}_${index}.jpg`
    
    console.log('上传照片，相册ID:', albumId, '文件名:', fileName)
    
    // 上传到云存储
    wx.cloud.uploadFile({
      cloudPath: fileName,
      filePath: filePath,
      success: (uploadRes) => {
        console.log('照片上传成功:', uploadRes)
        
        // 调用云函数保存照片信息
        const photoData = {
          albumId: albumId,
          groupId: this.data.album.groupId,
          fileId: uploadRes.fileID,
          name: `照片${index + 1}`,
          description: '',
          location: {
            latitude: 0,
            longitude: 0,
            address: ''
          },
          size: 0,
          width: 0,
          height: 0
        }
        
        wx.cloud.callFunction({
          name: 'photoManager',
          data: {
            action: 'upload',
            photoData: photoData
          },
          success: (res) => {
            if (res.result.success) {
              const photo = res.result.data
              
              // 更新本地存储
              let allPhotos = wx.getStorageSync('photos') || []
              allPhotos.push(photo)
              wx.setStorageSync('photos', allPhotos)
              
              // 更新页面数据
              this.setData({
                photos: [...this.data.photos, photo]
              })
              
              // 更新相册照片数量
              this.updateAlbumPhotoCount(this.data.album._id, this.data.photos.length)
              
              // 继续上传下一张照片
              this.uploadPhotosToCloud(tempFilePaths, index + 1)
            } else {
              app.hideLoading()
              app.showToast('保存照片信息失败: ' + res.result.message)
            }
          },
          fail: (error) => {
            app.hideLoading()
            console.error('保存照片信息失败:', error)
            app.showToast('保存照片信息失败')
          }
        })
      },
      fail: (error) => {
        app.hideLoading()
        console.error('照片上传失败:', error)
        app.showToast('照片上传失败')
      }
    })
  },

  // 编辑相册
  editAlbum: function () {
    wx.navigateTo({
      url: `/pages/album/create?id=${this.data.album._id || this.data.album.id}`
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
    console.log('开始删除照片，照片ID:', photoId)
    
    if (!photoId) {
      app.showToast('照片ID无效，无法删除')
      return
    }
    
    app.showLoading('删除中...')
    
    // 先尝试从云存储删除
    wx.cloud.callFunction({
      name: 'photoManager',
      data: {
        action: 'delete',
        photoId: photoId
      },
      success: (res) => {
        console.log('云函数删除照片结果:', res)
        
        if (res.result && res.result.success) {
          // 云删除成功，更新本地存储
          this.deletePhotoFromLocal(photoId)
          app.hideLoading()
          app.showToast('照片已删除')
        } else {
          console.log('云删除失败，尝试本地删除:', res.result?.message)
          // 云删除失败，尝试本地删除
          this.deletePhotoFromLocal(photoId)
          app.hideLoading()
          app.showToast('照片已删除（本地）')
        }
      },
      fail: (error) => {
        console.error('云函数调用失败:', error)
        // 云函数调用失败，尝试本地删除
        this.deletePhotoFromLocal(photoId)
        app.hideLoading()
        app.showToast('照片已删除（本地）')
      }
    })
  },

  // 从本地删除照片
  deletePhotoFromLocal: function (photoId) {
    console.log('从本地删除照片，照片ID:', photoId)
    
    // 从本地存储中删除
    let allPhotos = wx.getStorageSync('photos') || []
    allPhotos = allPhotos.filter(photo => photo.id !== photoId && photo._id !== photoId)
    wx.setStorageSync('photos', allPhotos)
    
    // 更新页面数据
    const photos = this.data.photos.filter(photo => photo.id !== photoId && photo._id !== photoId)
    this.setData({
      photos: photos
    })
    
    // 更新相册照片数量
    this.updateAlbumPhotoCount(this.data.album._id || this.data.album.id, photos.length)
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
      const allIds = this.data.photos.map(photo => photo._id || photo.id)
      console.log('全选照片IDs:', allIds)
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
    console.log('开始批量删除照片，照片IDs:', selectedIds)
    app.showLoading('删除中...')
    
    // 先尝试从云存储批量删除
    wx.cloud.callFunction({
      name: 'photoManager',
      data: {
        action: 'batchDelete',
        photoData: {
          photoIds: selectedIds
        }
      },
      success: (res) => {
        console.log('云函数批量删除照片结果:', res)
        
        if (res.result && res.result.success) {
          // 云删除成功，更新本地存储
          this.batchDeleteFromLocal(selectedIds)
          app.hideLoading()
          app.showToast(`已删除 ${selectedIds.length} 张照片`)
        } else {
          console.log('云批量删除失败，尝试本地删除:', res.result?.message)
          // 云删除失败，尝试本地删除
          this.batchDeleteFromLocal(selectedIds)
          app.hideLoading()
          app.showToast(`已删除 ${selectedIds.length} 张照片（本地）`)
        }
      },
      fail: (error) => {
        console.error('云函数调用失败:', error)
        // 云函数调用失败，尝试本地删除
        this.batchDeleteFromLocal(selectedIds)
        app.hideLoading()
        app.showToast(`已删除 ${selectedIds.length} 张照片（本地）`)
      }
    })
  },

  // 从本地批量删除照片
  batchDeleteFromLocal: function (selectedIds) {
    console.log('从本地批量删除照片，照片IDs:', selectedIds)
    
    // 从本地存储中删除
    let allPhotos = wx.getStorageSync('photos') || []
    allPhotos = allPhotos.filter(photo => !selectedIds.includes(photo.id) && !selectedIds.includes(photo._id))
    wx.setStorageSync('photos', allPhotos)
    
    // 更新页面数据
    const photos = this.data.photos.filter(photo => !selectedIds.includes(photo.id) && !selectedIds.includes(photo._id))
    this.setData({
      photos: photos,
      selectedPhotos: [],
      isAllSelected: false,
      isBatchMode: false
    })
    
    // 更新相册照片数量
    this.updateAlbumPhotoCount(this.data.album._id || this.data.album.id, photos.length)
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
      path: `/pages/album/detail?id=${this.data.album._id || this.data.album.id}`,
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