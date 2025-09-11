// pages/map/map.js
const app = getApp()
const util = require('../../utils/util')

Page({
  data: {
    mapType: 'basic',
    longitude: 116.397390,
    latitude: 39.908860,
    scale: 14,
    markers: [],
    polyline: [],
    checkinPoints: [],
    enableMapTap: false, // 是否启用地图点击创建打卡点
    searchKeyword: '', // 搜索关键词
    searchResults: [], // 搜索结果
    Location:{         //搜索的位置，默认为当前的定位
      longitude: '',
      latitude: '',
    },
    dropdownOpen: false, // 下拉框是否打开
    selectedCategory: '', // 选中的分类
    suggestions: [], // 搜索建议列表
    showSuggestions: false, // 是否显示建议列表
    searchTimer: null, // 搜索防抖定时器
    MarkerId: null, // 标记的id
  },

/**********检查登录**********/
  onLoad: function (options) {
    util.checkLoginAndRedirect(this, this.onLoggedIn)
  },

  onShow: function () {
    util.checkLoginAndRedirect(this, this.onLoggedIn)
  },

  // 登录成功后的回调
  onLoggedIn: function () {
    this.initMap()
    this.loadCheckinPoints()
  },

/**********初始化地图**********/
  initMap: function () {
    app.getCurrentLocation().then(res => {
      this.setData({
        longitude: res.longitude,
        latitude: res.latitude
      })
      this.updateMarkers()
    }).catch(err => {
      console.error('获取位置失败:', err)
      app.showToast('获取位置失败，请检查定位权限')
    })
  },

  switchMapType: function (e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      mapType: type
    })
    this.updateMapDisplay()
  },

  updateMapDisplay: function () {
    if (this.data.mapType === 'special') {
      this.showSpecialFeatures()
    } else {
      this.showBasicFeatures()
    }
  },

  showSpecialFeatures: function () {
    app.showToast('已切换到特殊地图模式，点击地图可创建打卡点')
    // 特殊模式下启用地图点击创建打卡点功能
    this.setData({
      enableMapTap: true
    })
  },

  showBasicFeatures: function () {
    app.showToast('已切换到基础地图模式')
  },

  moveToLocation: function () {
    app.getCurrentLocation().then(res => {
      this.setData({
        longitude: res.longitude,
        latitude: res.latitude,
        scale: 16
      })
    }).catch(err => {
      app.showToast('获取位置失败')
    })
  },

/**********地图点击事件**********/
  // 地图点击事件
  onMarkerTap: function (e) {
    const markerId = e.markerId
    const checkinPoints = this.data.checkinPoints
    //调试信息
    console.log('markerId', markerId)
    console.log('checkinPoints length', this.data.checkinPoints.length)
    console.log('checkinPoints', this.data.checkinPoints)
    
    // 检查是否是有效的打卡点标记
    if (markerId !== undefined && markerId < checkinPoints.length) {
      this.setData({
        MarkerId: markerId
      })
      
      if (checkinPoints && checkinPoints[markerId]) {
        // 在特殊模式下显示删除选项
        if (this.data.mapType === 'special') {
          wx.showActionSheet({
            itemList: ['查看详情', '删除打卡点'],
            success: (res) => {
              if (res.tapIndex === 0) {
                // 查看详情
                this.showCheckinDetails(checkinPoints[markerId])
              } else if (res.tapIndex === 1) {
                // 删除打卡点
                this.deleteCheckinPoint(markerId)
              }
            }
          })
        } else {
          // 普通模式只显示详情
          this.showCheckinDetails(checkinPoints[markerId])
        }
      }
    }
  },

  onMapTap: function (e) {
    const { longitude, latitude } = e.detail
    console.log('地图点击位置:', { longitude, latitude })

    if (this.data.MarkerId !== null) {
      this.setData({
        MarkerId: null // 重置标记的id
      })
      return
    }

    this.setData({
      Location: {
        longitude: longitude,
        latitude: latitude
      }
    })

    // 特殊模式下，点击地图创建打卡点
    if (this.data.mapType === 'special' && this.data.enableMapTap) {
      console.log('地图点击位置创建打卡点')
      this.createCheckinPointFromMap(longitude, latitude)
    }
  },

/**********地图缩放**********/
  zoomIn: function () {
    let scale = this.data.scale
    if (scale < 20) {
      this.setData({
        scale: scale + 1
      })
    }
  },

  zoomOut: function () {
    let scale = this.data.scale
    if (scale > 3) {
      this.setData({
        scale: scale - 1
      })
    }
  },

/**********导航栏功能**********/
  showCheckinModal: function () {
    wx.navigateTo({
      url: '/pages/checkin/checkin'
    })
  },

  navigateToStats: function () {
    wx.navigateTo({
      url: '/pages/statistics/statistics'
    })
  },

/**********打卡点功能**********/
  // 加载&更新打卡点
  loadCheckinPoints: function () {
    const checkinPoints = wx.getStorageSync('checkinPoints') || []
    this.setData({
      checkinPoints: checkinPoints
    })
    this.updateMarkers()
  },

  updateMarkers: function () {
    const markers = this.data.checkinPoints.map((point, index) => {
      return {
        id: index,
        longitude: point.longitude,
        latitude: point.latitude,
        title: point.content || '打卡点',
        address: point.address || '未知位置',
        iconPath: '/images/checkin-marker.png',
        width: 32,
        height: 32,
        callout: {
          content: `${point.content || '打卡点'}\n${point.address || '未知位置'}`,
          color: '#333',
          fontSize: 12,
          borderRadius: 4,
          bgColor: '#fff',
          padding: 8,
          display: 'BYCLICK'
        }
      }
    })

    this.setData({
      markers: markers
    })
  },

  // 显示打卡详情
  showCheckinDetails: function (checkinPoint) {
    wx.showModal({
      title: '打卡信息',
      content: `${checkinPoint.content}\n\n时间：${checkinPoint.createTime}\n位置：${checkinPoint.address}`,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 删除打卡点
  deleteCheckinPoint: function (markerId) {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个打卡点吗？',
      success: (res) => {
        if (res.confirm) {
          let checkinPoints = this.data.checkinPoints
          checkinPoints.splice(markerId, 1)
          
          // 更新本地存储
          wx.setStorageSync('checkinPoints', checkinPoints)
          
          // 更新页面数据
          this.setData({
            checkinPoints: checkinPoints
          })
          this.updateMarkers()
          
          app.showToast('打卡点已删除')
        }
      }
    })
  },


  // 从地图点击创建打卡点
  createCheckinPointFromMap: function (longitude, latitude) {
    wx.showModal({
      title: '创建打卡点',
      content: '是否在此位置创建打卡点？',
      success: (res) => {
        if (res.confirm) {
          // 跳转到打卡页面，传递位置信息
          wx.navigateTo({
            url: `/pages/checkin/checkin?longitude=${longitude}&latitude=${latitude}`
          })
        }
      }
    })
  },

  addCheckinPoint: function (point) {
    let checkinPoints = this.data.checkinPoints
    checkinPoints.push(point)
    
    wx.setStorageSync('checkinPoints', checkinPoints)
    
    this.setData({
      checkinPoints: checkinPoints
    })
    this.updateMarkers()
  },

/**********搜索框**********/
  // 搜索框输入
  onSearchInput: function (e) {
    const keyword = e.detail.value
    this.setData({
      searchKeyword: keyword
    })
    
    // 清除之前的定时器
    if (this.data.searchTimer) {
      clearTimeout(this.data.searchTimer)
    }
    
    // 如果输入为空，隐藏建议列表
    if (!keyword.trim()) {
      this.setData({
        showSuggestions: false,
        suggestions: []
      })
      return
    }
    
    // 设置防抖，500ms后执行搜索
    const timer = setTimeout(() => {
      this.getSearchSuggestions(keyword)
    }, 500)
    
    this.setData({
      searchTimer: timer
    })
  },

  // 搜索框获得焦点
  onSearchFocus: function () {
    if (this.data.searchKeyword && this.data.suggestions.length > 0) {
      this.setData({
        showSuggestions: true
      })
    }
  },

  // 搜索框失去焦点
  onSearchBlur: function () {
    // 延迟隐藏，让用户有时间点击建议项
    setTimeout(() => {
      this.setData({
        showSuggestions: false
      })
    }, 200)
  },

  // 获取搜索建议
  getSearchSuggestions: function (keyword) {    
    wx.request({
      url: 'https://apis.map.qq.com/ws/place/v1/suggestion',
      data: {
        key: app.globalData.tencentMapKey,
        keyword: keyword,
        region: '全国',
        location: `${this.data.latitude},${this.data.longitude}`,
        get_subpois: 1,
        policy: 0,
        page_size: 10
      },
      success: (res) => {
        console.log('搜索建议API响应:', res)
        
        if (res.data.status === 0) {
          this.setData({
            suggestions: res.data.data || [],
            showSuggestions: true
          })
        } else {
          console.error('搜索建议失败:', res.data.message)
          this.setData({
            suggestions: [],
            showSuggestions: false
          })
          app.showToast('没有找到相关地点')
        }
      },
      fail: (error) => {
        console.error('搜索建议请求失败:', error)
        this.setData({
          suggestions: [],
          showSuggestions: false
        })
      }
    })
  },

  // 选择搜索建议
  selectSuggestion: function (e) {
    const index = e.currentTarget.dataset.index
    const suggestion = this.data.suggestions[index]
    
    if (suggestion) {
      this.setData({
        searchKeyword: suggestion.title,
        showSuggestions: false
      })
      
      // 移动地图到建议的位置
      this.setData({
        longitude: suggestion.location.lng,
        latitude: suggestion.location.lat,
        scale: 16
      })
      this.addSearchMarker(suggestion)
      app.showToast(`已定位到：${suggestion.title}`)
    }
  },

  // 搜索框确认（点击确认按钮<bindconfirm>后的定位）
  searchLocation: function (e) {
    const keyword = e.detail.value || this.data.searchKeyword
    this.setData({
      searchKeyword: keyword,
      showSuggestions: false
    })
    
    // 如果有搜索建议，选择第一个
    if (this.data.suggestions && this.data.suggestions.length > 0) {
      this.selectSuggestion({currentTarget: {dataset: {index: 0}}})
      this.addSearchMarker(this.data.suggestions[0])
    }
    else{
      app.showToast('没有找到相关地点')
    }
  },

  // 添加搜索标记
  addSearchMarker: function (result) {
    if (!result || !result.location) {
      console.error('搜索结果数据无效:', result)
      return
    }

    const marker = {
      id: 'search_' + (result.id || Date.now()),
      longitude: result.location.lng,
      latitude: result.location.lat,
      title: result.title || '搜索结果',
      address: result.address || '未知位置',
      iconPath: '', // 空字符串使用默认标记
      width: 30,
      height: 30,
      callout: {
        content: `${result.title || '搜索结果'}\n${result.address || '未知位置'}`,
        color: '#333',
        fontSize: 12,
        borderRadius: 4,
        bgColor: '#fff',
        padding: 8,
        display: 'BYCLICK'
      }
    }
    
    // 添加到现有标记数组中
    const allMarkers = [...this.data.markers, marker]
    this.setData({
      markers: allMarkers,
      Location: {
        longitude: result.location.lng,
        latitude: result.location.lat
      }
    })
    
    console.log('搜索标记已添加:', marker)
  },

/**********下拉框**********/
  // 切换下拉框显示状态
  toggleDropdown: function () {
    this.setData({
      dropdownOpen: !this.data.dropdownOpen
    })
  },

  // 选择分类
  selectCategory: function (e) {
    const category = e.currentTarget.dataset.category

    this.setData({
      selectedCategory: category,
      dropdownOpen: false
    })

    if(category === '选择类型'){
      this.clearSearchMarkers()
    }else{
      this.searchByCategory()
    }
  },

  // 根据选择的分类进行搜索
  searchByCategory: function () {
    var category = this.data.selectedCategory
    var location = this.data.Location

    if(location.longitude === '' || location.latitude === ''){
      this.setData({
        Location: {
          longitude: this.data.longitude,
          latitude: this.data.latitude
        }
      })
      location = this.data.Location
    }

    // 清除之前的搜索结果标记，只保留打卡点标记
    this.clearSearchMarkers()

    // 绘制搜索范围圆圈
    this.drawSearchCircle(location.latitude, location.longitude, 1000)

    wx.request({
      url: 'https://apis.map.qq.com/ws/place/v1/search',
      data: {
        key: app.globalData.tencentMapKey,
        keyword: category,
        region: '全国',
        location: `${location.latitude},${location.longitude}`,
        boundary: `nearby(${location.latitude},${location.longitude},1000,1)`,
        page_size: 20
      },
      success: (res) => {
        console.log('搜索结果:', res)
        if (res.data.status === 0 && res.data.data && res.data.data.length > 0) {
          // 显示搜索结果
          const results = res.data.data
          results.forEach(result => {
            this.addSearchMarker(result)
          })
          app.showToast(`找到 ${results.length} 个${category}地点`)
        } else {
          app.showToast('未找到相关地点')
        }
      },
      fail: (error) => {
        console.error('搜索失败:', error)
        app.showToast('搜索失败，请检查网络')
      }
    })
  },

  // 清除搜索结果标记，保留打卡点标记
  clearSearchMarkers: function () {
    // 只保留打卡点标记，过滤掉搜索结果标记
    const checkinMarkers = this.data.markers.filter(marker => 
      !marker.id || !marker.id.toString().startsWith('search_')
    )
    
    this.setData({
      markers: checkinMarkers,
      polyline: [] // 清除搜索圆圈
    })
  },

  // 绘制搜索范围圆圈
  drawSearchCircle: function (centerLat, centerLng, radius) {
    // 生成圆形边界点
    const points = this.generateCirclePoints(centerLat, centerLng, radius)
    
    // 创建圆形折线
    const circlePolyline = {
      points: points,
      color: '#4CAF50FF',
      width: 3,
      dottedLine: true,
      arrowLine: false,
      borderColor: '#4CAF50FF',
      borderWidth: 1
    }
    
    this.setData({
      polyline: [circlePolyline]
    })
  },

  // 生成圆形边界点
  generateCirclePoints: function (centerLat, centerLng, radius) {
    const points = []
    const numPoints = 64 // 圆形精度，点数越多越圆滑
    
    // 将半径从米转换为经纬度度数（近似）
    const latRadius = radius / 111000 // 1度纬度约等于111km
    const lngRadius = radius / (111000 * Math.cos(centerLat * Math.PI / 180))
    
    for (let i = 0; i <= numPoints; i++) {
      const angle = (2 * Math.PI * i) / numPoints
      const lat = centerLat + latRadius * Math.cos(angle)
      const lng = centerLng + lngRadius * Math.sin(angle)
      
      points.push({
        latitude: lat,
        longitude: lng
      })
    }
    
    return points
  }
})
