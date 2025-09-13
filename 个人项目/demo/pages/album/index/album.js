// pages/album/album.js
const app = getApp()

Page({
  data: {
    albums: [],
    filteredAlbums: [],
    currentType: 'all',
    searchKeyword: '',
    isBatchMode: false,
    selectedAlbums: [],
    isAllSelected: false
  },

  onLoad: function (options) {
    app.checkLoginAndRedirect()
    if (app.globalData.isLoggedIn) {
      this.onLoggedIn()
    }
  },

  onShow: function () {
    app.checkLoginAndRedirect()
    if (app.globalData.isLoggedIn) {
      this.onLoggedIn()
    }
  },

  // 登录成功后的回调
  onLoggedIn: function () {
    this.loadAlbums()
  },

  // 加载相册数据（云开发版本）
  loadAlbums: function () {
    console.log('开始从云存储加载相册...')
    app.showLoading('加载中...')
    
    // 先尝试从云存储获取
    wx.cloud.callFunction({
      name: 'albumManager',
      data: {
        action: 'getList'
      },
      success: (res) => {
        console.log('云函数调用成功:', res)
        
        if (res.result && res.result.success) {
          const cloudAlbums = res.result.data || []
          console.log('从云存储获取到相册数量:', cloudAlbums.length)
          
          // 更新本地存储
          wx.setStorageSync('albums', cloudAlbums)
          
          this.setData({
            albums: cloudAlbums
          })
          this.filterAlbums()
          
          app.hideLoading()
          app.showToast(`已加载 ${cloudAlbums.length} 个相册`)
        } else {
          console.log('云函数返回失败:', res.result?.message)
          app.hideLoading()
          app.showToast('云存储加载失败，使用本地数据')
          // 降级到本地存储
          this.loadAlbumsFromLocal()
        }
      },
      fail: (error) => {
        console.error('云函数调用失败:', error)
        app.hideLoading()
        app.showToast('网络错误，使用本地数据')
        // 降级到本地存储
        this.loadAlbumsFromLocal()
      }
    })
  },

  // 从本地存储加载相册（降级方案）
  loadAlbumsFromLocal: function () {
    console.log('从本地存储加载相册...')
    let albums = wx.getStorageSync('albums') || []
    console.log('本地存储中的相册数量:', albums.length)
    
    this.setData({
      albums: albums
    })
    this.filterAlbums()
    
    if (albums.length > 0) {
      app.showToast(`已加载 ${albums.length} 个本地相册`)
    } else {
      app.showToast('暂无相册数据')
    }
  },

  // 过滤相册
  filterAlbums: function () {
    let filtered = this.data.albums

    // 按类型过滤
    if (this.data.currentType !== 'all') {
      filtered = filtered.filter(album => album.type === this.data.currentType)
    }

    // 按关键词搜索
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase()
      filtered = filtered.filter(album => 
        album.name.toLowerCase().includes(keyword) ||
        (album.description && album.description.toLowerCase().includes(keyword))
      )
    }

    this.setData({
      filteredAlbums: filtered
    })
  },

  // 搜索输入
  onSearchInput: function (e) {
    const keyword = e.detail.value
    this.setData({
      searchKeyword: keyword
    })
    this.filterAlbums()
  },

  // 切换相册类型
  switchType: function (e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      currentType: type
    })
    this.filterAlbums()
  },

  // 创建相册
  createAlbum: function () {
    wx.navigateTo({
      url: '/pages/album/create/create'
    })
  },

  // 打开相册
  openAlbum: function (e) {
    if (this.data.isBatchMode) {
      this.toggleAlbumSelection(e.currentTarget.dataset.id)
      return
    }

    const albumId = e.currentTarget.dataset.id
    console.log('打开相册，ID:', albumId)
    
    // 确保使用正确的ID格式
    const album = this.data.albums.find(a => a.id === albumId || a._id === albumId)
    const actualId = album?._id || album?.id || albumId
    
    wx.navigateTo({
      url: `/pages/album/detail/detail?id=${actualId}`
    })
  },

  // 编辑相册
  editAlbum: function (e) {
    const albumId = e.currentTarget.dataset.id
    console.log('编辑相册，ID:', albumId)
    
    if (!albumId) {
      app.showToast('相册ID不存在')
      return
    }
    
    // 确保使用正确的ID格式
    const album = this.data.albums.find(a => a.id === albumId || a._id === albumId)
    const actualId = album?._id || album?.id || albumId
    
    wx.navigateTo({
      url: `/pages/album/create/create?id=${actualId}`
    })
  },

  // 删除相册
  deleteAlbum: function (e) {
    const albumId = e.currentTarget.dataset.id
    console.log('删除相册，ID:', albumId)
    
    if (!albumId) {
      app.showToast('相册ID不存在')
      return
    }
    
    // 确保使用正确的ID格式
    const album = this.data.albums.find(a => a.id === albumId || a._id === albumId)
    const actualId = album?._id || album?.id || albumId
    
    wx.showModal({
      title: '确认删除',
      content: '删除相册后，相册内的照片将无法恢复，确定要删除吗？',
      confirmText: '删除',
      confirmColor: '#f44336',
      success: (res) => {
        if (res.confirm) {
          this.performDeleteAlbum(actualId)
        }
      }
    })
  },

  // 执行删除相册（云开发版本）
  performDeleteAlbum: function (albumId) {
    app.showLoading('删除中...')
    
    // 调用云函数删除相册
    wx.cloud.callFunction({
      name: 'albumManager',
      data: {
        action: 'delete',
        albumId: albumId
      },
      success: (res) => {
        console.log('云函数删除相册结果:', res)
        
        if (res.result && res.result.success) {
          // 云删除成功，从本地数据中移除
          this.deleteAlbumFromLocal(albumId)
          app.hideLoading()
          app.showToast('相册已删除')
        } else {
          console.log('云删除失败，尝试本地删除:', res.result?.message)
          // 云删除失败，尝试本地删除
          this.deleteAlbumFromLocal(albumId)
          app.hideLoading()
          app.showToast('相册已删除（本地）')
        }
      },
      fail: (error) => {
        console.error('云函数调用失败:', error)
        // 云函数调用失败，尝试本地删除
        this.deleteAlbumFromLocal(albumId)
        app.hideLoading()
        app.showToast('相册已删除（本地）')
      }
    })
  },

  // 从本地删除相册
  deleteAlbumFromLocal: function (albumId) {
    console.log('从本地删除相册，ID:', albumId)
    
    // 从本地数据中移除相册
    let albums = this.data.albums
    albums = albums.filter(album => album._id !== albumId && album.id !== albumId)
    
    // 删除相册下的所有照片
    let allPhotos = wx.getStorageSync('photos') || []
    allPhotos = allPhotos.filter(photo => photo.albumId !== albumId)
    wx.setStorageSync('photos', allPhotos)
    
    // 更新本地存储
    wx.setStorageSync('albums', albums)
    
    // 更新页面数据
    this.setData({
      albums: albums
    })
    this.filterAlbums()
  },

  // 切换批量操作模式
  toggleBatchMode: function () {
    this.setData({
      isBatchMode: !this.data.isBatchMode,
      selectedAlbums: [],
      isAllSelected: false
    })
  },

  // 退出批量操作模式
  exitBatchMode: function () {
    this.setData({
      isBatchMode: false,
      selectedAlbums: [],
      isAllSelected: false
    })
  },

  // 切换相册选择状态
  toggleAlbumSelection: function (albumId) {
    let selectedAlbums = this.data.selectedAlbums
    const index = selectedAlbums.indexOf(albumId)
    
    if (index > -1) {
      selectedAlbums.splice(index, 1)
    } else {
      selectedAlbums.push(albumId)
    }
    
    this.setData({
      selectedAlbums: selectedAlbums,
      isAllSelected: selectedAlbums.length === this.data.filteredAlbums.length
    })
  },

  // 全选/取消全选
  selectAll: function () {
    if (this.data.isAllSelected) {
      this.setData({
        selectedAlbums: [],
        isAllSelected: false
      })
    } else {
      const allIds = this.data.filteredAlbums.map(album => album._id || album.id)
      this.setData({
        selectedAlbums: allIds,
        isAllSelected: true
      })
    }
  },

  // 批量删除
  batchDelete: function () {
    if (this.data.selectedAlbums.length === 0) {
      app.showToast('请选择要删除的相册')
      return
    }

    wx.showModal({
      title: '批量删除',
      content: `确定要删除选中的 ${this.data.selectedAlbums.length} 个相册吗？`,
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
    let albums = this.data.albums
    const selectedIds = this.data.selectedAlbums
    
    // 过滤掉选中的相册
    albums = albums.filter(album => !selectedIds.includes(album._id || album.id))
    
    // 更新本地存储
    wx.setStorageSync('albums', albums)
    
    // 更新页面数据
    this.setData({
      albums: albums,
      selectedAlbums: [],
      isAllSelected: false,
      isBatchMode: false
    })
    this.filterAlbums()
    
    app.showToast(`已删除 ${selectedIds.length} 个相册`)
  },

})
