// pages/map/map.js
const app = getApp()

Page({
  data: {
    mapType: 'basic',
    longitude: 116.397390,
    latitude: 39.908860,
    scale: 14,
    markers: [],
    polyline: [],
    checkinPoints: []
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
    this.initMap()
    this.loadCheckinPoints()
  },

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

  showCheckinModal: function () {
    wx.navigateTo({
      url: '/pages/checkin/checkin'
    })
  },


  navigateToHotel: function () {
    wx.navigateTo({
      url: '/pages/hotel/hotel'
    })
  },

  navigateToStats: function () {
    wx.navigateTo({
      url: '/pages/statistics/statistics'
    })
  },

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
        title: point.content,
        iconPath: '/images/checkin-marker.png',
        width: 32,
        height: 32,
        callout: {
          content: point.content.substring(0, 20) + (point.content.length > 20 ? '...' : ''),
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

  onMarkerTap: function (e) {
    const markerId = e.markerId
    const checkinPoint = this.data.checkinPoints[markerId]
    
    if (checkinPoint) {
      // 在特殊模式下显示删除选项
      if (this.data.mapType === 'special') {
        wx.showActionSheet({
          itemList: ['查看详情', '删除打卡点'],
          success: (res) => {
            if (res.tapIndex === 0) {
              // 查看详情
              this.showCheckinDetails(checkinPoint)
            } else if (res.tapIndex === 1) {
              // 删除打卡点
              this.deleteCheckinPoint(markerId)
            }
          }
        })
      } else {
        // 普通模式只显示详情
        this.showCheckinDetails(checkinPoint)
      }
    }
  },

  // 显示打卡详情
  showCheckinDetails: function (checkinPoint) {
    wx.showModal({
      title: '打卡信息',
      content: `${checkinPoint.content}\n\n时间：${checkinPoint.time}\n位置：${checkinPoint.address}`,
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

  onMapTap: function (e) {
    const { longitude, latitude } = e.detail
    console.log('地图点击位置:', { longitude, latitude })
    
    // 特殊模式下，点击地图创建打卡点
    if (this.data.mapType === 'special' && this.data.enableMapTap) {
      this.createCheckinPointFromMap(longitude, latitude)
    }
  },

  // 从地图点击创建打卡点
  createCheckinPointFromMap: function (longitude, latitude) {
    wx.showModal({
      title: '创建打卡点',
      content: '是否在此位置创建打卡点？',
      success: (res) => {
        if (res.confirm) {
          this.showCheckinForm(longitude, latitude)
        }
      }
    })
  },

  // 显示打卡表单
  showCheckinForm: function (longitude, latitude) {
    wx.showModal({
      title: '打卡信息',
      content: '请输入打卡内容（可选）',
      editable: true,
      placeholderText: '例如：到此一游',
      success: (res) => {
        if (res.confirm) {
          const content = res.content || '到此一游'
          this.createCheckinPoint(longitude, latitude, content)
        }
      }
    })
  },

  // 创建打卡点
  createCheckinPoint: function (longitude, latitude, content) {
    const checkinPoint = {
      id: Date.now(),
      longitude: longitude,
      latitude: latitude,
      content: content,
      time: new Date().toLocaleString(),
      address: '自定义位置',
      imageUrl: null
    }
    
    this.addCheckinPoint(checkinPoint)
    app.showToast('打卡点创建成功')
  },

  onRegionChange: function (e) {
    if (e.type === 'end') {
      // 地图操作结束后的处理
    }
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

})
