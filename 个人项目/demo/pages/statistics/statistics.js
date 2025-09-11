// pages/statistics/statistics.js
const app = getApp()

Page({
  data: {
    timeRange: 'month', // week, month, year, all
    totalCheckins: 0,
    totalPhotos: 0,
    totalAlbums: 0,
    totalGroups: 0,
    checkinTrend: [],
    mostCheckinTime: '未知',
    mostCheckinType: '未知',
    avgCheckinInterval: '未知',
    maxCheckinInterval: '未知',
    photoStats: {
      total: 0,
      thisMonth: 0,
      thisWeek: 0,
      avgPerDay: 0
    },
    albumDistribution: [],
    topLocations: [],
    heatmapPoints: [],
    tagStats: [],
    shareStats: {
      wechat: 0,
      moments: 0,
      group: 0
    }
  },

  onLoad: function (options) {
    this.loadStatistics()
  },

  onShow: function () {
    this.loadStatistics()
  },

  // 加载统计数据
  loadStatistics: function () {
    this.loadOverviewData()
    this.loadCheckinStats()
    this.loadPhotoStats()
    this.loadLocationStats()
    this.loadTagStats()
    this.loadShareStats()
  },

  // 加载概览数据
  loadOverviewData: function () {
    const checkins = wx.getStorageSync('checkinPoints') || []
    const photos = wx.getStorageSync('photos') || []
    const albums = wx.getStorageSync('albums') || []
    const groups = wx.getStorageSync('groups') || []
    
    this.setData({
      totalCheckins: checkins.length || 0,
      totalPhotos: photos.length || 0,
      totalAlbums: albums.length || 0,
      totalGroups: groups.length || 0
    })
  },

  // 加载打卡统计
  loadCheckinStats: function () {
    const checkins = wx.getStorageSync('checkinPoints') || []
    const filteredCheckins = this.filterDataByTimeRange(checkins)
    
    // 生成打卡趋势数据
    const trendData = this.generateCheckinTrend(filteredCheckins)
    
    // 计算统计指标
    const stats = this.calculateCheckinStats(filteredCheckins)
    
    this.setData({
      checkinTrend: trendData || [],
      mostCheckinTime: stats.mostCheckinTime || '无',
      mostCheckinType: stats.mostCheckinType || '无',
      avgCheckinInterval: stats.avgCheckinInterval || '无',
      maxCheckinInterval: stats.maxCheckinInterval || '无'
    })
  },

  // 加载照片统计
  loadPhotoStats: function () {
    const photos = wx.getStorageSync('photos') || []
    const albums = wx.getStorageSync('albums') || []
    
    const filteredPhotos = this.filterDataByTimeRange(photos)
    const photoStats = this.calculatePhotoStats(filteredPhotos, photos)
    const albumDistribution = this.calculateAlbumDistribution(albums, photos)
    
    this.setData({
      photoStats: photoStats || {
        total: 0,
        thisMonth: 0,
        thisWeek: 0,
        avgPerDay: 0
      },
      albumDistribution: albumDistribution || []
    })
  },

  // 加载地点统计
  loadLocationStats: function () {
    const checkins = wx.getStorageSync('checkinPoints') || []
    const filteredCheckins = this.filterDataByTimeRange(checkins)
    
    const topLocations = this.calculateTopLocations(filteredCheckins)
    const heatmapPoints = this.generateHeatmapPoints(filteredCheckins)
    
    this.setData({
      topLocations: topLocations || [],
      heatmapPoints: heatmapPoints || []
    })
  },

  // 加载标签统计
  loadTagStats: function () {
    const checkins = wx.getStorageSync('checkinPoints') || []
    const filteredCheckins = this.filterDataByTimeRange(checkins)
    
    const tagStats = this.calculateTagStats(filteredCheckins)
    
    this.setData({
      tagStats: tagStats || []
    })
  },

  // 加载分享统计
  loadShareStats: function () {
    // 删除分享统计功能
    this.setData({
      shareStats: {
        wechat: 0,
        moments: 0,
        group: 0
      }
    })
  },

  // 根据时间范围过滤数据
  filterDataByTimeRange: function (data) {
    if (this.data.timeRange === 'all') {
      return data
    }
    
    const now = new Date()
    let startDate
    
    switch (this.data.timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        return data
    }
    
    return data.filter(item => {
      const itemDate = new Date(item.createTime || item.uploadTime)
      return itemDate >= startDate
    })
  },

  // 生成打卡趋势数据
  generateCheckinTrend: function (checkins) {
    const trend = []
    const now = new Date()
    
    // 根据时间范围生成标签
    let labels = []
    let days = 0
    
    switch (this.data.timeRange) {
      case 'week':
        days = 7
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          labels.push(date.getDate() + '日')
        }
        break
      case 'month':
        days = 30
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          labels.push(date.getDate() + '日')
        }
        break
      case 'year':
        days = 12
        for (let i = 11; i >= 0; i--) {
          const month = new Date(now.getFullYear(), i, 1)
          labels.push((month.getMonth() + 1) + '月')
        }
        break
      default:
        return trend
    }
    
    // 统计每天/每月的打卡次数
    const counts = new Array(days).fill(0)
    
    checkins.forEach(checkin => {
      const checkinDate = new Date(checkin.createTime)
      let index = 0
      
      if (this.data.timeRange === 'week' || this.data.timeRange === 'month') {
        const diffDays = Math.floor((now - checkinDate) / (24 * 60 * 60 * 1000))
        index = days - 1 - diffDays
      } else if (this.data.timeRange === 'year') {
        index = checkinDate.getMonth()
      }
      
      if (index >= 0 && index < days) {
        counts[index]++
      }
    })
    
    // 计算最大次数用于归一化
    const maxCount = Math.max(...counts) || 1
    
    // 生成趋势数据
    labels.forEach((label, index) => {
      const count = counts[index]
      const height = (count / maxCount) * 100
      
      trend.push({
        date: label,
        label: label,
        count: count,
        height: height
      })
    })
    
    return trend
  },

  // 计算打卡统计指标
  calculateCheckinStats: function (checkins) {
    if (checkins.length === 0) {
      return {
        mostCheckinTime: '无数据',
        mostCheckinType: '无数据',
        avgCheckinInterval: '无数据',
        maxCheckinInterval: '无数据'
      }
    }
    
    // 统计打卡时间
    const timeStats = {}
    checkins.forEach(checkin => {
      const hour = new Date(checkin.createTime).getHours()
      const timeSlot = hour < 6 ? '凌晨' : hour < 12 ? '上午' : hour < 18 ? '下午' : '晚上'
      timeStats[timeSlot] = (timeStats[timeSlot] || 0) + 1
    })
    
    const mostCheckinTime = Object.keys(timeStats).reduce((a, b) => 
      timeStats[a] > timeStats[b] ? a : b
    )
    
    // 统计打卡类型
    const typeStats = {}
    checkins.forEach(checkin => {
      typeStats[checkin.type] = (typeStats[checkin.type] || 0) + 1
    })
    
    const mostCheckinType = Object.keys(typeStats).reduce((a, b) => 
      typeStats[a] > typeStats[b] ? a : b
    )
    
    // 计算打卡间隔
    const intervals = []
    const sortedCheckins = checkins.sort((a, b) => 
      new Date(a.createTime) - new Date(b.createTime)
    )
    
    for (let i = 1; i < sortedCheckins.length; i++) {
      const interval = new Date(sortedCheckins[i].createTime) - new Date(sortedCheckins[i-1].createTime)
      intervals.push(Math.floor(interval / (24 * 60 * 60 * 1000)))
    }
    
    const avgInterval = intervals.length > 0 ? 
      Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length) : 0
    const maxInterval = intervals.length > 0 ? Math.max(...intervals) : 0
    
    return {
      mostCheckinTime: mostCheckinTime,
      mostCheckinType: mostCheckinType,
      avgCheckinInterval: avgInterval > 0 ? `${avgInterval}天` : '无数据',
      maxCheckinInterval: maxInterval > 0 ? `${maxInterval}天` : '无数据'
    }
  },

  // 计算照片统计
  calculatePhotoStats: function (filteredPhotos, allPhotos) {
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const thisMonthPhotos = allPhotos.filter(photo => 
      new Date(photo.uploadTime) >= thisMonth
    )
    
    const thisWeekPhotos = allPhotos.filter(photo => 
      new Date(photo.uploadTime) >= thisWeek
    )
    
    // 计算平均每天照片数
    const firstPhotoDate = allPhotos.length > 0 ? 
      new Date(allPhotos[0].uploadTime) : now
    const totalDays = Math.max(1, Math.floor((now - firstPhotoDate) / (24 * 60 * 60 * 1000)))
    const avgPerDay = Math.round(allPhotos.length / totalDays * 10) / 10
    
    return {
      total: allPhotos.length,
      thisMonth: thisMonthPhotos.length,
      thisWeek: thisWeekPhotos.length,
      avgPerDay: avgPerDay
    }
  },

  // 计算相册分布
  calculateAlbumDistribution: function (albums, photos) {
    if (albums.length === 0) return []
    
    const distribution = []
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#00BCD4']
    
    albums.forEach((album, index) => {
      const albumPhotos = photos.filter(photo => photo.albumId === album.id)
      const percentage = photos.length > 0 ? 
        Math.round((albumPhotos.length / photos.length) * 100) : 0
      
      distribution.push({
        name: album.name,
        count: albumPhotos.length,
        percentage: percentage,
        color: colors[index % colors.length],
        rotation: index * (360 / albums.length)
      })
    })
    
    return distribution
  },

  // 计算热门地点
  calculateTopLocations: function (checkins) {
    if (checkins.length === 0) return []
    
    const locationStats = {}
    checkins.forEach(checkin => {
      const location = checkin.address || '未知地点'
      locationStats[location] = (locationStats[location] || 0) + 1
    })
    
    const sortedLocations = Object.entries(locationStats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    const total = checkins.length
    
    return sortedLocations.map(location => ({
      ...location,
      percentage: Math.round((location.count / total) * 100)
    }))
  },

  // 生成热力图点
  generateHeatmapPoints: function (checkins) {
    if (checkins.length === 0) return []
    
    // 基于真实地理位置生成热力图
    const locationGroups = {}
    
    // 按地址分组，统计每个地点的打卡次数
    checkins.forEach(checkin => {
      if (checkin.longitude && checkin.latitude) {
        const key = `${checkin.longitude.toFixed(4)},${checkin.latitude.toFixed(4)}`
        if (!locationGroups[key]) {
          locationGroups[key] = {
            longitude: checkin.longitude,
            latitude: checkin.latitude,
            address: checkin.address || '未知地点',
            count: 0
          }
        }
        locationGroups[key].count++
      }
    })
    
    // 转换为热力图点数据
    const points = Object.values(locationGroups).map((location, index) => {
      // 根据打卡次数计算强度 (1-5次为低强度，6-10次为中强度，10次以上为高强度)
      let intensity = 0.3
      if (location.count >= 10) {
        intensity = 1.0
      } else if (location.count >= 6) {
        intensity = 0.7
      } else if (location.count >= 3) {
        intensity = 0.5
      }
      
      return {
        id: index,
        longitude: location.longitude,
        latitude: location.latitude,
        address: location.address,
        count: location.count,
        intensity: intensity
      }
    })
    
    return points
  },

  // 计算标签统计
  calculateTagStats: function (checkins) {
    if (checkins.length === 0) return []
    
    const tagStats = {}
    checkins.forEach(checkin => {
      if (checkin.tags && Array.isArray(checkin.tags)) {
        checkin.tags.forEach(tag => {
          tagStats[tag] = (tagStats[tag] || 0) + 1
        })
      }
    })
    
    const sortedTags = Object.entries(tagStats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
    
    if (sortedTags.length === 0) return []
    
    const maxCount = Math.max(...sortedTags.map(tag => tag.count))
    
    return sortedTags.map(tag => ({
      ...tag,
      size: Math.max(24, Math.min(48, 24 + (tag.count / maxCount) * 24)),
      opacity: 0.6 + (tag.count / maxCount) * 0.4
    }))
  },

  // 设置时间范围
  setTimeRange: function (e) {
    const range = e.currentTarget.dataset.range
    this.setData({
      timeRange: range
    })
    this.loadStatistics()
  },

})