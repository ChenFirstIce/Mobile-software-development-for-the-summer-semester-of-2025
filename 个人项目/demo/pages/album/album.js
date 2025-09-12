// pages/album/album.js
const app = getApp()
const util = require('../../utils/util')

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
    util.checkLoginAndRedirect(this, this.onLoggedIn)
  },

  onShow: function () {
    util.checkLoginAndRedirect(this, this.onLoggedIn)
  },

  // 登录成功后的回调
  onLoggedIn: function () {
    this.loadAlbums()
  },

  // 加载相册数据（云开发版本）
  loadAlbums: function () {
    app.showLoading('加载中...')
    
    // 调用云函数获取相册列表
    wx.cloud.callFunction({
      name: 'albumManager',
      data: {
        action: 'getList'
      },
      success: (res) => {
        app.hideLoading()
        if (res.result.success) {
          const albums = res.result.data
          
          // 更新本地存储
          wx.setStorageSync('albums', albums)
          
          this.setData({
            albums: albums
          })
          this.filterAlbums()
        } else {
          app.showToast('加载相册失败: ' + res.result.message)
          // 降级到本地存储
          this.loadAlbumsFromLocal()
        }
      },
      fail: (error) => {
        app.hideLoading()
        console.error('云函数调用失败:', error)
        app.showToast('网络错误，使用本地数据')
        // 降级到本地存储
        this.loadAlbumsFromLocal()
      }
    })
  },

  // 从本地存储加载相册（降级方案）
  loadAlbumsFromLocal: function () {
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
        app.hideLoading()
        if (res.result.success) {
          // 从本地数据中移除
          let albums = this.data.albums
          albums = albums.filter(album => album._id !== albumId)
          
          // 更新本地存储
          wx.setStorageSync('albums', albums)
          
          // 更新页面数据
          this.setData({
            albums: albums
          })
          this.filterAlbums()
          
          app.showToast('相册已删除')
        } else {
          app.showToast('删除失败: ' + res.result.message)
        }
      },
      fail: (error) => {
        app.hideLoading()
        console.error('删除相册失败:', error)
        app.showToast('删除失败，请重试')
      }
    })
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
