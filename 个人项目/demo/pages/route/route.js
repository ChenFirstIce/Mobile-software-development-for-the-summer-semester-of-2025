// pages/route/route.js
const app = getApp()

Page({
  data: {
    // 地图相关
    mapCenter: {
      longitude: 116.397390,
      latitude: 39.908860
    },
    mapScale: 14,
    markers: [],
    polylines: [],
    mapContext: null, // 地图上下文对象
    
    // 路线规划
    startPoint: {
      name: '',
      longitude: null,
      latitude: null
    },
    endPoint: {
      name: '',
      longitude: null,
      latitude: null
    },
    waypoints: [], // 途径点数组
    selectedTransport: 'driving',
    
    // 路线信息
    routeInfo: null,
    canPlanRoute: false,
    
    // 搜索相关
    showSearchModal: false,
    searchType: 'start', // start, end, waypoint
    searchWaypointIndex: null, // 正在编辑的途径点索引
    searchKeyword: '',
    searchResults: [],
    searchSuggestions: [],
    showSuggestions: false,
    searchTimer: null,
    
    // 地图控制
    isUpdatingMap: false
  },

  onLoad: function (options) {
    this.createMapContext()
    this.initMap()
  },

  onShow: function () {
    // 页面显示时刷新地图
    this.updateMapDisplay()
  },

  // 创建地图上下文对象
  createMapContext: function () {
    const mapContext = wx.createMapContext('routeMap', this)
    this.setData({
      mapContext: mapContext
    })
    console.log('地图上下文创建成功')
  },

  // 初始化地图
  initMap: function () {
    app.getCurrentLocation().then(res => {
      this.setData({
        mapCenter: {
          longitude: res.longitude,
          latitude: res.latitude
        }
      })
      this.updateMapDisplay()
    }).catch(err => {
      console.error('获取位置失败:', err)
      app.showToast('获取位置失败，请检查定位权限')
    })
  },

  // 更新地图显示
  updateMapDisplay: function () {
    const markers = []
    
    // 添加起点标记
    if (this.data.startPoint.longitude && this.data.startPoint.latitude) {
      markers.push({
        id: 'start',
        longitude: this.data.startPoint.longitude,
        latitude: this.data.startPoint.latitude,
        title: '起点',
        iconPath: '/images/start-marker.png',
        width: 30,
        height: 30,
        callout: {
          content: this.data.startPoint.name,
          color: '#333',
          fontSize: 12,
          borderRadius: 4,
          bgColor: '#4CAF50',
          padding: 8,
          display: 'BYCLICK'
        }
      })
    }
    
    // 添加途径点标记
    this.data.waypoints.forEach((waypoint, index) => {
      if (waypoint.longitude && waypoint.latitude) {
        markers.push({
          id: 'waypoint-' + index,
          longitude: waypoint.longitude,
          latitude: waypoint.latitude,
          title: '途径点 ' + (index + 1),
          iconPath: '/images/waypoint-marker.png',
          width: 26,
          height: 26,
          callout: {
            content: waypoint.name || ('途径点 ' + (index + 1)),
            color: '#333',
            fontSize: 12,
            borderRadius: 4,
            bgColor: '#FFC107',
            padding: 8,
            display: 'BYCLICK'
          }
        })
      }
    })
    
    // 添加终点标记
    if (this.data.endPoint.longitude && this.data.endPoint.latitude) {
      markers.push({
        id: 'end',
        longitude: this.data.endPoint.longitude,
        latitude: this.data.endPoint.latitude,
        title: '终点',
        iconPath: '/images/end-marker.png',
        width: 30,
        height: 30,
        callout: {
          content: this.data.endPoint.name,
          color: '#333',
          fontSize: 12,
          borderRadius: 4,
          bgColor: '#FF5722',
          padding: 8,
          display: 'BYCLICK'
        }
      })
    }
    

    // 检查是否可以规划路线（需要有起点和终点）
    const canPlanRoute = this.data.startPoint.longitude && this.data.startPoint.latitude &&
                         this.data.endPoint.longitude && this.data.endPoint.latitude
    
    this.setData({
      markers: markers,
      canPlanRoute: canPlanRoute
    })
  },

  // 选择起点
  selectStartPoint: function () {
    this.setData({
      showSearchModal: true,
      searchType: 'start',
      searchWaypointIndex: null,
      searchKeyword: '',
      searchResults: [],
      searchSuggestions: [],
      showSuggestions: false
    })
  },

  // 选择终点
  selectEndPoint: function () {
    this.setData({
      showSearchModal: true,
      searchType: 'end',
      searchWaypointIndex: null,
      searchKeyword: '',
      searchResults: [],
      searchSuggestions: [],
      showSuggestions: false
    })
  },

  // 添加途径点（仅驾车模式）
  addWaypoint: function () {
    if (this.data.selectedTransport !== 'driving') {
      app.showToast('只有驾车模式支持途径点')
      return
    }
    
    const waypoints = [...this.data.waypoints]
    waypoints.push({
      name: '',
      longitude: null,
      latitude: null
    })
    
    this.setData({
      waypoints: waypoints
    }, () => {
      this.selectWaypoint({currentTarget: {dataset: {index: waypoints.length - 1}}})
    })
  },

  // 选择途径点（仅驾车模式）
  selectWaypoint: function (e) {
    if (this.data.selectedTransport !== 'driving') {
      app.showToast('只有驾车模式支持途径点')
      return
    }
    
    const index = e.currentTarget.dataset.index
    this.setData({
      showSearchModal: true,
      searchType: 'waypoint',
      searchWaypointIndex: index,
      searchKeyword: this.data.waypoints[index].name || '',
      searchResults: [],
      searchSuggestions: [],
      showSuggestions: false
    })
  },

  // 移除途径点
  removeWaypoint: function (e) {
    const index = e.currentTarget.dataset.index
    const waypoints = [...this.data.waypoints]
    waypoints.splice(index, 1)
    
    this.setData({
      waypoints: waypoints
    }, () => {
      this.updateMapDisplay()
    })
  },

  // 使用当前位置作为起点/终点/途径点
  useCurrentLocation: function () {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        // 获取逆地理编码
        wx.request({
          url: 'https://apis.map.qq.com/ws/geocoder/v1/',
          data: {
            key: app.globalData.tencentMapKey,
            location: `${res.latitude},${res.longitude}`
          },
          success: (geoRes) => {
            if (geoRes.data.status === 0) {
              const address = geoRes.data.result.address
              const location = {
                title: address || '当前位置',
                longitude: res.longitude,
                latitude: res.latitude
              }
              
              this.setLocation(location)
            }
          },
          fail: () => {
            // 即使逆地理编码失败，也使用当前位置
            const location = {
              title: '当前位置',
              longitude: res.longitude,
              latitude: res.latitude
            }
            
            this.setLocation(location)
          }
        })
      },
      fail: (err) => {
        console.error('获取位置失败:', err)
        app.showToast('获取位置失败，请检查定位权限')
      }
    })
  },

  // 设置位置信息（根据类型设置起点、终点或途径点）
  setLocation: function (location) {
    if (this.data.searchType === 'start') {
      this.setData({
        startPoint: {
          name: location.title,
          longitude: location.longitude,
          latitude: location.latitude
        }
      })
    } else if (this.data.searchType === 'end') {
      this.setData({
        endPoint: {
          name: location.title,
          longitude: location.longitude,
          latitude: location.latitude
        }
      })
    } else if (this.data.searchType === 'waypoint' && this.data.searchWaypointIndex !== null) {
      const waypoints = [...this.data.waypoints]
      waypoints[this.data.searchWaypointIndex] = {
        name: location.title,
        longitude: location.longitude,
        latitude: location.latitude
      }
      this.setData({
        waypoints: waypoints
      })
    }
    
    this.closeSearchModal()
    this.updateMapDisplay()
    app.showToast(`已选择${this.getLocationTypeName()}：${location.title}`)
  },

  // 获取位置类型名称
  getLocationTypeName: function () {
    if (this.data.searchType === 'start') return '起点'
    if (this.data.searchType === 'end') return '终点'
    if (this.data.searchType === 'waypoint') return '途径点' + (this.data.searchWaypointIndex !== null ? (this.data.searchWaypointIndex + 1) : '')
    return '位置'
  },

  // 选择交通方式
  selectTransport: function (e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      selectedTransport: type
    })
    
    // 如果切换到非驾车模式，清空途径点
    if (type !== 'driving') {
      this.setData({
        waypoints: []
      })
    }
    
    // 如果已有路线，重新规划
    if (this.data.routeInfo) {
      this.planRoute()
    }
  },

  // 搜索输入
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
        searchSuggestions: []
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
    if (this.data.searchKeyword && this.data.searchSuggestions.length > 0) {
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
        location: `${this.data.mapCenter.latitude},${this.data.mapCenter.longitude}`,
        get_subpois: 1,
        policy: 0,
        page_size: 10
      },
      success: (res) => {
        console.log('搜索建议API响应:', res)
        
        if (res.data.status === 0) {
          this.setData({
            searchSuggestions: res.data.data || [],
            showSuggestions: true
          })
        } else {
          console.error('搜索建议失败:', res.data.message)
          this.setData({
            searchSuggestions: [],
            showSuggestions: false
          })
        }
      },
      fail: (error) => {
        console.error('搜索建议请求失败:', error)
        this.setData({
          searchSuggestions: [],
          showSuggestions: false
        })
      }
    })
  },

  // 选择搜索建议
  selectSuggestion: function (e) {
    const index = e.currentTarget.dataset.index
    const suggestion = this.data.searchSuggestions[index]
    
    if (suggestion) {
      const location = {
        title: suggestion.title,
        longitude: suggestion.location.lng,
        latitude: suggestion.location.lat
      }
      
      this.setLocation(location)
    }
  },

  // 搜索地点（确认搜索）
  searchLocation: function () {
    const keyword = this.data.searchKeyword.trim()
    if (!keyword) {
      app.showToast('请输入搜索关键词')
      return
    }
    
    // 如果有搜索建议，选择第一个
    if (this.data.searchSuggestions && this.data.searchSuggestions.length > 0) {
      this.selectSuggestion({currentTarget: {dataset: {index: 0}}})
      return
    }
    
    // 否则进行详细搜索
    wx.request({
      url: 'https://apis.map.qq.com/ws/place/v1/search',
      data: {
        key: app.globalData.tencentMapKey,
        keyword: keyword,
        region: '全国',
        page_size: 10
      },
      success: (res) => {
        if (res.data.status === 0 && res.data.data && res.data.data.length > 0) {
          const location = {
            title: res.data.data[0].title,
            longitude: res.data.data[0].location.lng,
            latitude: res.data.data[0].location.lat
          }
          
          this.setLocation(location)
        } else {
          app.showToast('没有找到相关地点')
        }
      },
      fail: (error) => {
        console.error('搜索失败:', error)
        app.showToast('搜索失败，请检查网络')
      }
    })
  },

  // 选择地点
  selectLocation: function (e) {
    const location = e.currentTarget.dataset.location
    
    if (location) {
      this.setLocation({
        title: location.title,
        longitude: location.location.lng,
        latitude: location.location.lat
      })
    }
  },

  // 关闭搜索弹窗
  closeSearchModal: function () {
    this.setData({
      showSearchModal: false,
      searchKeyword: '',
      searchResults: []
    })
  },

  // 规划路线
  planRoute: function () {
    // 检查是否有起点和终点
    if (!this.data.startPoint.longitude || !this.data.endPoint.longitude) {
      app.showToast('请先选择起点和终点')
      return
    }
    
    // 构建途径点参数（仅驾车模式）
    let waypointParam = ''
    if (this.data.selectedTransport === 'driving' && this.data.waypoints.length > 0) {
      const validWaypoints = this.data.waypoints.filter(wp => wp.longitude && wp.latitude)
      if (validWaypoints.length > 0) {
        waypointParam = validWaypoints.map(wp => `${wp.latitude},${wp.longitude}`).join(';')
      }
    }
    
    // 根据交通方式选择不同的API
    let url = ''
    switch (this.data.selectedTransport) {
      case 'driving':
        url = 'https://apis.map.qq.com/ws/direction/v1/driving'
        break
      case 'walking':
        url = 'https://apis.map.qq.com/ws/direction/v1/walking'
        break
      case 'bicycling':
        url = 'https://apis.map.qq.com/ws/direction/v1/bicycling'
        break
      case 'transit':
        url = 'https://apis.map.qq.com/ws/direction/v1/transit'
        break
      default:
        url = 'https://apis.map.qq.com/ws/direction/v1/driving'
    }
    
    // 构建请求参数
    const params = {
      key: app.globalData.tencentMapKey,
      from: `${this.data.startPoint.latitude},${this.data.startPoint.longitude}`,
      to: `${this.data.endPoint.latitude},${this.data.endPoint.longitude}`,
      waypoint_order: 0,
      output: 'json'
    }
    
    // 添加途径点参数
    if (waypointParam) {
      params.waypoints = waypointParam
    }
    
    // 发起路线规划请求
    wx.request({
      url: url,
      data: params,
      success: (res) => {
        console.log('路线规划API响应:', res)
        
        if (res.data.status === 0 && res.data.result && res.data.result.routes && res.data.result.routes.length > 0) {
          // 直接获取第一条路线
          const route = res.data.result.routes[0]
          console.log('路线数据:', route)
          
          // 解析路线数据
          this.parseRouteData(route)
          
          // 更新路线信息
          this.setData({
            routeInfo: {
              distance: this.formatDistance(route.distance),
              duration: this.formatDuration(route.duration),
              cost: route.cost ? `¥${route.cost}` : undefined,
              tolls: route.tolls || 0,
              tollDistance: route.toll_distance || 0
            }
          })
          
          console.log('路线信息已更新:', {
            distance: this.formatDistance(route.distance),
            duration: this.formatDuration(route.duration),
            cost: route.cost,
            tolls: route.tolls
          })
        } else {
          console.error('路线规划失败:', res.data.message)
          app.showToast('路线规划失败: ' + (res.data.message || '未知错误'))
        }
      },
      fail: (error) => {
        console.error('路线规划请求失败:', error)
        app.showToast('路线规划失败，请检查网络')
      }
    })
  },

  // 解析路线数据并绘制路线
  parseRouteData: function (route) {
    if (!route || !route.polyline) return
    
    // 解压polyline坐标
    const coors = route.polyline
    for (let i = 2; i < coors.length; i++) {
      coors[i] = coors[i - 2] + coors[i] / 1000000
    }
    
    // 转换为地图所需的坐标格式
    const points = []
    for (let i = 0; i < coors.length; i += 2) {
      points.push({
        latitude: coors[i],
        longitude: coors[i + 1]
      })
    }
    
    // 更新路线显示
    this.setData({
      polylines: [{
        points: points,
        color: '#4CAF50',
        width: 6,
        dottedLine: false
      }]
    })
    
    // 调整地图视野以显示整个路线
    this.fitMapToRoute(points)
  },

  // 调整地图视野以显示整个路线
  fitMapToRoute: function (points) {
    if (!points || points.length === 0) return
    
    // 找到经纬度的最大最小值
    let minLat = points[0].latitude
    let maxLat = points[0].latitude
    let minLng = points[0].longitude
    let maxLng = points[0].longitude
    
    points.forEach(point => {
      minLat = Math.min(minLat, point.latitude)
      maxLat = Math.max(maxLat, point.latitude)
      minLng = Math.min(minLng, point.longitude)
      maxLng = Math.max(maxLng, point.longitude)
    })
    
    // 计算中心点
    const centerLat = (minLat + maxLat) / 2
    const centerLng = (minLng + maxLng) / 2
    
    // 设置地图中心和缩放级别
    this.setData({
      mapCenter: {
        longitude: centerLng,
        latitude: centerLat
      },
      mapScale: 14 // 可以根据路线范围动态调整缩放级别
    })
  },

  // 格式化距离显示
  formatDistance: function (meters) {
    if (!meters || isNaN(meters)) {
      return '0米'
    }
    if (meters < 1000) {
      return `${Math.round(meters)}米`
    } else {
      return `${(meters / 1000).toFixed(1)}公里`
    }
  },

  // 格式化时间显示（duration单位为分钟）
  formatDuration: function (minutes) {
    if (!minutes || isNaN(minutes)) {
      return '0分钟'
    }
    if (minutes < 1) {
      return `${Math.round(minutes * 60)}秒`
    } else if (minutes < 60) {
      return `${Math.floor(minutes)}分钟${minutes % 1 > 0 ? `${Math.round((minutes % 1) * 60)}秒` : ''}`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = Math.floor(minutes % 60)
      return `${hours}小时${remainingMinutes > 0 ? `${remainingMinutes}分钟` : ''}`
    }
  },

  // 清除路线
  clearRoute: function () {
    this.setData({
      polylines: [],
      routeInfo: null,
      startPoint: {
        name: '',
        longitude: null,
        latitude: null
      },
      endPoint: {
        name: '',
        longitude: null,
        latitude: null
      },
      waypoints: []
    }, () => {
      this.updateMapDisplay()
    })
  },


  // 移动到当前位置
  moveToLocation: function () {
    app.getCurrentLocation().then(res => {
      this.setData({
        mapCenter: {
          longitude: res.longitude,
          latitude: res.latitude
        },
        mapScale: 16
      })
    }).catch(err => {
      app.showToast('获取位置失败')
    })
  },


})