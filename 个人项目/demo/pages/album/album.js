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
    this.loadAlbums()
  },

  // 加载相册数据
  loadAlbums: function () {
    // 从本地存储或云数据库获取相册数据
    let albums = wx.getStorageSync('albums') || []
  
    this.setData({
      albums: albums
    })
    this.filterAlbums()
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
      url: '/pages/album/create'
    })
  },

  // 打开相册
  openAlbum: function (e) {
    if (this.data.isBatchMode) {
      this.toggleAlbumSelection(e.currentTarget.dataset.id)
      return
    }

    const albumId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/album/detail?id=${albumId}`
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
    
    wx.navigateTo({
      url: `/pages/album/create?id=${albumId}`
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
    
    wx.showModal({
      title: '确认删除',
      content: '删除相册后，相册内的照片将无法恢复，确定要删除吗？',
      confirmText: '删除',
      confirmColor: '#f44336',
      success: (res) => {
        if (res.confirm) {
          this.performDeleteAlbum(albumId)
        }
      }
    })
  },

  // 执行删除相册
  performDeleteAlbum: function (albumId) {
    let albums = this.data.albums
    albums = albums.filter(album => album.id !== albumId)
    
    // 更新本地存储
    wx.setStorageSync('albums', albums)
    
    // 更新页面数据
    this.setData({
      albums: albums
    })
    this.filterAlbums()
    
    app.showToast('相册已删除')
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
      const allIds = this.data.filteredAlbums.map(album => album.id)
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
    albums = albums.filter(album => !selectedIds.includes(album.id))
    
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

  // 下拉刷新
  onPullDownRefresh: function () {
    this.loadAlbums()
    wx.stopPullDownRefresh()
  }
})
