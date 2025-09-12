// pages/statistics/statistics.js
const app = getApp()

Page({
  data: {
    timeRange: 'month', // week, month, year, all
    // 基础统计
    totalCheckins: 0,
    totalPhotos: 0,
    totalAlbums: 0,
    totalGroups: 0,
    totalDistance: 0,
    totalDays: 0,
    
    // 打卡统计
    checkinTrend: [],
    mostCheckinTime: '无数据',
    avgCheckinInterval: '无数据',
    maxCheckinInterval: '无数据',
    checkinStreak: 0,
    longestStreak: 0,
    
    // 照片统计
    photoStats: {
      total: 0,
      thisMonth: 0,
      thisWeek: 0,
      avgPerDay: 0,
      avgPerCheckin: 0
    },
    photoTrend: [],
    
    // 群组统计
    groupStats: {
      total: 0,
      created: 0,
      joined: 0,
      active: 0,
      totalMembers: 0
    },
    
    // 地点统计
    topLocations: [],
    
    // 标签和分类
    tagStats: [],
    categoryStats: [],
    
    // 活跃度统计
    activityLevel: '新手',
    activityScore: 0,
    weeklyActivity: [],
    monthlyActivity: [],
    
    // 成就系统
    achievements: [],
    
    // 分享相关
    shareImage: '',
    reportGenerated: false
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
    this.loadGroupStats()
    this.loadLocationStats()
    this.loadActivityStats()
    this.loadAchievements()
    this.generateReport()
  },

  // 加载概览数据
  loadOverviewData: function () {
    const checkins = wx.getStorageSync('checkinPoints') || []
    const photos = wx.getStorageSync('photos') || []
    const albums = wx.getStorageSync('albums') || []
    const groups = wx.getStorageSync('groups') || []
    
    // 计算总距离
    const totalDistance = this.calculateTotalDistance(checkins)
    
    // 计算活跃天数
    const totalDays = this.calculateActiveDays(checkins, photos)
    
    this.setData({
      totalCheckins: checkins.length || 0,
      totalPhotos: photos.length || 0,
      totalAlbums: albums.length || 0,
      totalGroups: groups.length || 0,
      totalDistance: totalDistance,
      totalDays: totalDays
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
    
    // 计算连续打卡
    const streakData = this.calculateCheckinStreak(checkins)
    
    this.setData({
      checkinTrend: trendData || [],
      mostCheckinTime: stats.mostCheckinTime || '无数据',
      avgCheckinInterval: stats.avgCheckinInterval || '无数据',
      maxCheckinInterval: stats.maxCheckinInterval || '无数据',
      checkinStreak: streakData.current || 0,
      longestStreak: streakData.longest || 0
    })
  },

  // 加载照片统计
  loadPhotoStats: function () {
    const photos = wx.getStorageSync('photos') || []
    const albums = wx.getStorageSync('albums') || []
    
    const filteredPhotos = this.filterDataByTimeRange(photos)
    const photoStats = this.calculatePhotoStats(filteredPhotos, photos)
    this.setData({
      photoStats: photoStats || {
        total: 0,
        thisMonth: 0,
        thisWeek: 0,
        avgPerDay: 0
      }
    })
  },

  // 加载地点统计
  loadLocationStats: function () {
    const checkins = wx.getStorageSync('checkinPoints') || []
    const filteredCheckins = this.filterDataByTimeRange(checkins)
    
    const topLocations = this.calculateTopLocations(filteredCheckins)
    
    this.setData({
      topLocations: topLocations || []
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
    if (!checkins || checkins.length === 0) {
      return {
        mostCheckinTime: '无数据',
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

  // 计算总距离
  calculateTotalDistance: function (checkins) {
    if (!checkins || checkins.length < 2) return 0
    
    let totalDistance = 0
    const sortedCheckins = checkins.sort((a, b) => new Date(a.createTime) - new Date(b.createTime))
    
    for (let i = 1; i < sortedCheckins.length; i++) {
      const prev = sortedCheckins[i - 1]
      const curr = sortedCheckins[i]
      
      if (prev.longitude && prev.latitude && curr.longitude && curr.latitude) {
        const distance = this.calculateDistance(
          prev.latitude, prev.longitude,
          curr.latitude, curr.longitude
        )
        totalDistance += distance
      }
    }
    
    return Math.round(totalDistance)
  },

  // 计算两点间距离（公里）
  calculateDistance: function (lat1, lon1, lat2, lon2) {
    const R = 6371 // 地球半径（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  },

  // 计算活跃天数
  calculateActiveDays: function (checkins, photos) {
    const activeDays = new Set()
    
    // 统计打卡天数
    if (checkins && checkins.length > 0) {
      checkins.forEach(checkin => {
        if (checkin && checkin.createTime) {
          const date = new Date(checkin.createTime).toDateString()
          activeDays.add(date)
        }
      })
    }
    
    // 统计拍照天数
    if (photos && photos.length > 0) {
      photos.forEach(photo => {
        if (photo && photo.uploadTime) {
          const date = new Date(photo.uploadTime).toDateString()
          activeDays.add(date)
        }
      })
    }
    
    return activeDays.size
  },

  // 计算连续打卡
  calculateCheckinStreak: function (checkins) {
    if (!checkins || checkins.length === 0) return { current: 0, longest: 0 }
    
    const sortedCheckins = checkins.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    
    // 计算当前连续打卡
    for (let i = 0; i < sortedCheckins.length; i++) {
      const checkinDate = new Date(sortedCheckins[i].createTime)
      checkinDate.setHours(0, 0, 0, 0)
      
      const daysDiff = Math.floor((today - checkinDate) / (24 * 60 * 60 * 1000))
      
      if (i === 0 && daysDiff <= 1) {
        currentStreak = 1
        tempStreak = 1
      } else if (i > 0) {
        const prevDate = new Date(sortedCheckins[i-1].createTime)
        prevDate.setHours(0, 0, 0, 0)
        const prevDaysDiff = Math.floor((today - prevDate) / (24 * 60 * 60 * 1000))
        
        if (daysDiff === prevDaysDiff + 1) {
          if (i === 1) currentStreak = 2
          else currentStreak++
          tempStreak++
        } else {
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 1
        }
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak)
    
    return {
      current: currentStreak,
      longest: longestStreak
    }
  },

  // 加载群组统计
  loadGroupStats: function () {
    const groups = wx.getStorageSync('groups') || []
    const userInfo = app.globalData.userInfo
    
    let created = 0
    let joined = 0
    let active = 0
    let totalMembers = 0
    
    groups.forEach(group => {
      totalMembers += group.memberCount || 0
      
      if (group.creator === userInfo?.nickName || group.creatorId === userInfo?.id) {
        created++
      } else if (group.members.some(member => 
        member.id === userInfo?.id || member.name === userInfo?.nickName
      )) {
        joined++
      }
      
      // 判断群组是否活跃（最近30天有活动）
      const lastActivity = new Date(group.lastActivity || group.createTime)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      if (lastActivity > thirtyDaysAgo) {
        active++
      }
    })
    
    this.setData({
      groupStats: {
        total: groups.length,
        created: created,
        joined: joined,
        active: active,
        totalMembers: totalMembers
      }
    })
  },

  // 加载活跃度统计
  loadActivityStats: function () {
    const checkins = wx.getStorageSync('checkinPoints') || []
    const photos = wx.getStorageSync('photos') || []
    const groups = wx.getStorageSync('groups') || []
    
    // 计算活跃度分数
    const activityScore = this.calculateActivityScore(checkins, photos, groups)
    const activityLevel = this.getActivityLevel(activityScore)
    
    // 生成周活跃度数据
    const weeklyActivity = this.generateWeeklyActivity(checkins, photos)
    
    // 生成月活跃度数据
    const monthlyActivity = this.generateMonthlyActivity(checkins, photos)
    
    this.setData({
      activityLevel: activityLevel,
      activityScore: activityScore,
      weeklyActivity: weeklyActivity,
      monthlyActivity: monthlyActivity
    })
  },

  // 计算活跃度分数
  calculateActivityScore: function (checkins, photos, groups) {
    let score = 0
    
    // 打卡分数 (每个打卡点 10分)
    score += checkins.length * 10
    
    // 照片分数 (每张照片 1分)
    score += photos.length * 1
    
    // 群组分数 (创建群组 50分，加入群组 20分)
    const userInfo = app.globalData.userInfo
    groups.forEach(group => {
      if (group.creator === userInfo?.nickName || group.creatorId === userInfo?.id) {
        score += 50
      } else if (group.members.some(member => 
        member.id === userInfo?.id || member.name === userInfo?.nickName
      )) {
        score += 20
      }
    })
    
    // 连续打卡奖励
    const streakData = this.calculateCheckinStreak(checkins)
    score += streakData.longest * 5
    
    return Math.min(score, 1000) // 最高1000分
  },

  // 获取活跃度等级
  getActivityLevel: function (score) {
    if (score >= 800) return '网瘾没救了'
    if (score >= 600) return '天天上网'
    if (score >= 400) return '有一点牛'
    if (score >= 200) return '前面的区域以后再来探索'
    return '沙发旅者'
  },

  // 生成周活跃度数据
  generateWeeklyActivity: function (checkins, photos) {
    const weeklyData = []
    const now = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toDateString()
      
      const dayCheckins = checkins.filter(checkin => 
        new Date(checkin.createTime).toDateString() === dateStr
      ).length
      
      const dayPhotos = photos.filter(photo => 
        new Date(photo.uploadTime).toDateString() === dateStr
      ).length
      
      weeklyData.push({
        date: date.getDate() + '日',
        checkins: dayCheckins,
        photos: dayPhotos,
        total: dayCheckins + dayPhotos
      })
    }
    
    return weeklyData
  },

  // 生成月活跃度数据
  generateMonthlyActivity: function (checkins, photos) {
    const monthlyData = []
    const now = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), i, 1)
      const monthStr = month.getMonth() + 1 + '月'
      
      const monthCheckins = checkins.filter(checkin => {
        const checkinDate = new Date(checkin.createTime)
        return checkinDate.getMonth() === i && checkinDate.getFullYear() === now.getFullYear()
      }).length
      
      const monthPhotos = photos.filter(photo => {
        const photoDate = new Date(photo.uploadTime)
        return photoDate.getMonth() === i && photoDate.getFullYear() === now.getFullYear()
      }).length
      
      monthlyData.push({
        month: monthStr,
        checkins: monthCheckins,
        photos: monthPhotos,
        total: monthCheckins + monthPhotos
      })
    }
    
    return monthlyData
  },

  // 加载成就系统
  loadAchievements: function () {
    const checkins = wx.getStorageSync('checkinPoints') || []
    const photos = wx.getStorageSync('photos') || []
    const groups = wx.getStorageSync('groups') || []
    
    const achievements = []
    
    // 打卡成就
    if (checkins.length >= 1) achievements.push({ name: '初次打卡', desc: '完成第一次打卡', icon: '🎯', unlocked: true })
    if (checkins.length >= 10) achievements.push({ name: '打卡新手', desc: '完成10次打卡', icon: '📍', unlocked: true })
    if (checkins.length >= 50) achievements.push({ name: '打卡达人', desc: '完成50次打卡', icon: '🏆', unlocked: true })
    if (checkins.length >= 100) achievements.push({ name: '打卡大师', desc: '完成100次打卡', icon: '👑', unlocked: true })
    
    // 照片成就
    if (photos.length >= 10) achievements.push({ name: '摄影新手', desc: '上传10张照片', icon: '📷', unlocked: true })
    if (photos.length >= 100) achievements.push({ name: '摄影达人', desc: '上传100张照片', icon: '📸', unlocked: true })
    
    // 群组成就
    if (groups.length >= 1) achievements.push({ name: '社交达人', desc: '加入第一个群组', icon: '👥', unlocked: true })
    if (groups.length >= 5) achievements.push({ name: '群组专家', desc: '加入5个群组', icon: '🌟', unlocked: true })
    
    // 连续打卡成就
    const streakData = this.calculateCheckinStreak(checkins)
    if (streakData.longest >= 7) achievements.push({ name: '坚持一周', desc: '连续打卡7天', icon: '🔥', unlocked: true })
    if (streakData.longest >= 30) achievements.push({ name: '月度坚持', desc: '连续打卡30天', icon: '💪', unlocked: true })
    
    this.setData({
      achievements: achievements
    })
  },

  // 生成统计报告
  generateReport: function () {
    const reportData = {
      totalCheckins: this.data.totalCheckins,
      totalPhotos: this.data.totalPhotos,
      totalAlbums: this.data.totalAlbums,
      totalGroups: this.data.totalGroups,
      totalDistance: this.data.totalDistance,
      totalDays: this.data.totalDays,
      activityLevel: this.data.activityLevel,
      activityScore: this.data.activityScore,
      achievements: this.data.achievements.length,
      generateTime: new Date().toLocaleString()
    }
    
    this.setData({
      reportGenerated: true
    })
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    const reportData = {
      totalCheckins: this.data.totalCheckins,
      totalPhotos: this.data.totalPhotos,
      totalDistance: this.data.totalDistance,
      activityLevel: this.data.activityLevel,
      generateTime: new Date().toLocaleDateString()
    }
    
    return {
      title: `我的旅游统计报告 - ${reportData.activityLevel} | 打卡${reportData.totalCheckins}次，拍照${reportData.totalPhotos}张，行程${reportData.totalDistance}公里`,
      //imageUrl: '/images/statistics-share.png'
    }
  },

  // 分享给好友
  onShareAppMessage: function () {
    return {
      title: '查看我的旅游统计报告',
      path: '/pages/statistics/statistics',
      //imageUrl: '/images/statistics-share.png'
    }
  }

})