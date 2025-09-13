// pages/checkin/list/list.js
const app = getApp()

Page({
  data: {
    checkins: [],
    loading: false,
    page: 1,
    pageSize: 20,
    hasMore: true,
    filterType: 'all', // all, public, private
    selectedTags: [],
    availableTags: [],
    showFilterModal: false,
    stats: {
      total: 0,
      public: 0,
      recent: 0
    }
  },

  onLoad: function (options) {
    this.loadCheckinList()
    this.loadUserStats()
    this.loadAvailableTags()
  },

  onShow: function () {
    // 刷新数据
    this.refreshData()
  },

  // 加载打卡列表
  loadCheckinList: function (isRefresh = false) {
    if (this.data.loading) return

    this.setData({
      loading: true
    })

    const page = isRefresh ? 1 : this.data.page

    wx.cloud.callFunction({
      name: 'checkinManager',
      data: {
        action: 'getList',
        page: page,
        pageSize: this.data.pageSize,
        privacy: this.data.filterType === 'all' ? null : this.data.filterType,
        tags: this.data.selectedTags.length > 0 ? this.data.selectedTags : null
      },
      success: (res) => {
        if (res.result.success) {
          const newCheckins = res.result.data.list || []
          const checkins = isRefresh ? newCheckins : [...this.data.checkins, ...newCheckins]
          
          this.setData({
            checkins: checkins,
            page: page + 1,
            hasMore: newCheckins.length === this.data.pageSize,
            loading: false
          })
        } else {
          this.setData({
            loading: false
          })
          app.showToast(res.result.message || '加载失败', 'error')
        }
      },
      fail: (err) => {
        console.error('加载打卡列表失败:', err)
        this.setData({
          loading: false
        })
        app.showToast('网络错误，请重试', 'error')
      }
    })
  },

  // 加载用户统计
  loadUserStats: function () {
    wx.cloud.callFunction({
      name: 'checkinManager',
      data: {
        action: 'getUserStats'
      },
      success: (res) => {
        if (res.result.success) {
          this.setData({
            stats: res.result.data
          })
        }
      },
      fail: (err) => {
        console.error('加载用户统计失败:', err)
      }
    })
  },

  // 加载可用标签
  loadAvailableTags: function () {
    // 从所有打卡记录中提取标签
    wx.cloud.callFunction({
      name: 'checkinManager',
      data: {
        action: 'getList',
        page: 1,
        pageSize: 1000 // 获取更多数据来提取标签
      },
      success: (res) => {
        if (res.result.success) {
          const checkins = res.result.data.list || []
          const tagSet = new Set()
          
          checkins.forEach(checkin => {
            if (checkin.tags && Array.isArray(checkin.tags)) {
              checkin.tags.forEach(tag => tagSet.add(tag))
            }
          })
          
          this.setData({
            availableTags: Array.from(tagSet).map(tag => ({
              name: tag,
              selected: this.data.selectedTags.includes(tag)
            }))
          })
        }
      },
      fail: (err) => {
        console.error('加载标签失败:', err)
      }
    })
  },

  // 刷新数据
  refreshData: function () {
    this.setData({
      page: 1,
      hasMore: true
    })
    this.loadCheckinList(true)
  },

  // 加载更多
  loadMore: function () {
    if (this.data.hasMore && !this.data.loading) {
      this.loadCheckinList()
    }
  },

  // 切换筛选类型
  switchFilterType: function (e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      filterType: type,
      page: 1,
      hasMore: true
    })
    this.loadCheckinList(true)
  },

  // 显示筛选弹窗
  showFilter: function () {
    this.setData({
      showFilterModal: true
    })
  },

  // 隐藏筛选弹窗
  hideFilter: function () {
    this.setData({
      showFilterModal: false
    })
  },

  // 切换标签选择
  toggleTag: function (e) {
    const index = e.currentTarget.dataset.index
    let tags = [...this.data.availableTags]
    tags[index].selected = !tags[index].selected
    
    this.setData({
      availableTags: tags
    })
  },

  // 应用筛选
  applyFilter: function () {
    const selectedTags = this.data.availableTags
      .filter(tag => tag.selected)
      .map(tag => tag.name)
    
    this.setData({
      selectedTags: selectedTags,
      page: 1,
      hasMore: true,
      showFilterModal: false
    })
    
    this.loadCheckinList(true)
  },

  // 清除筛选
  clearFilter: function () {
    const tags = this.data.availableTags.map(tag => ({
      ...tag,
      selected: false
    }))
    
    this.setData({
      selectedTags: [],
      availableTags: tags,
      filterType: 'all',
      page: 1,
      hasMore: true,
      showFilterModal: false
    })
    
    this.loadCheckinList(true)
  },

  // 查看打卡详情
  viewCheckinDetail: function (e) {
    const checkinId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/checkin/detail/detail?id=${checkinId}`
    })
  },

  // 编辑打卡
  editCheckin: function (e) {
    const checkinId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/checkin/edit/edit?id=${checkinId}`
    })
  },

  // 删除打卡
  deleteCheckin: function (e) {
    const checkinId = e.currentTarget.dataset.id
    const checkin = this.data.checkins.find(c => c._id === checkinId)
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除这条打卡记录吗？`,
      confirmText: '删除',
      confirmColor: '#f44336',
      success: (res) => {
        if (res.confirm) {
          this.performDeleteCheckin(checkinId)
        }
      }
    })
  },

  // 执行删除打卡
  performDeleteCheckin: function (checkinId) {
    app.showLoading('删除中...')
    
    wx.cloud.callFunction({
      name: 'checkinManager',
      data: {
        action: 'delete',
        checkinId: checkinId
      },
      success: (res) => {
        app.hideLoading()
        if (res.result.success) {
          app.showToast('删除成功')
          // 从列表中移除
          const checkins = this.data.checkins.filter(c => c._id !== checkinId)
          this.setData({
            checkins: checkins
          })
          // 重新加载统计
          this.loadUserStats()
        } else {
          app.showToast(res.result.message || '删除失败', 'error')
        }
      },
      fail: (err) => {
        console.error('删除打卡失败:', err)
        app.hideLoading()
        app.showToast('删除失败，请重试', 'error')
      }
    })
  },

  // 分享打卡
  shareCheckin: function (e) {
    const checkinId = e.currentTarget.dataset.id
    const checkin = this.data.checkins.find(c => c._id === checkinId)
    
    if (checkin) {
      return {
        title: `我在${checkin.address}的打卡`,
        path: `/pages/checkin/detail/detail?id=${checkinId}`,
        imageUrl: checkin.photos && checkin.photos.length > 0 ? checkin.photos[0] : ''
      }
    }
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    this.refreshData()
    wx.stopPullDownRefresh()
  },

  // 上拉加载更多
  onReachBottom: function () {
    this.loadMore()
  }
})
