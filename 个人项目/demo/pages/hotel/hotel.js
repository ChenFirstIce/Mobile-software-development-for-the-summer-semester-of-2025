// pages/hotel/hotel.js
const app = getApp()

Page({
  data: {
    // 搜索参数
    destination: '',
    checkInDate: '',
    checkOutDate: '',
    roomIndex: 0,
    guestIndex: 0,
    roomOptions: ['1间', '2间', '3间', '4间', '5间'],
    guestOptions: ['1人', '2人', '3人', '4人', '5人', '6人'],
    
    // 筛选条件
    minPrice: '',
    maxPrice: '',
    starFilter: 'all',
    sortBy: 'price',
    
    // 酒店数据
    hotels: [],
    filteredHotels: [],
    
    // 视图控制
    viewMode: 'list', // list 或 grid
    isLoading: false,
    hasSearched: false,
    
    // 弹窗控制
    showPriceModal: false,
    selectedHotel: null
  },

  onLoad: function (options) {
    this.initPage()
  },

  onShow: function () {
    // 页面显示时的处理
  },

  // 初始化页面
  initPage: function () {
    // 设置默认日期（明天和后天）
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayAfterTomorrow = new Date()
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
    
    this.setData({
      checkInDate: this.formatDate(tomorrow),
      checkOutDate: this.formatDate(dayAfterTomorrow)
    })
  },

  // 格式化日期
  formatDate: function (date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 目的地输入
  onDestinationInput: function (e) {
    this.setData({
      destination: e.detail.value
    })
    this.checkSearchStatus()
  },

  // 入住日期选择
  onCheckInChange: function (e) {
    this.setData({
      checkInDate: e.detail.value
    })
    this.checkSearchStatus()
  },

  // 退房日期选择
  onCheckOutChange: function (e) {
    this.setData({
      checkOutDate: e.detail.value
    })
    this.checkSearchStatus()
  },

  // 房间数选择
  onRoomChange: function (e) {
    this.setData({
      roomIndex: e.detail.value
    })
  },

  // 入住人数选择
  onGuestChange: function (e) {
    this.setData({
      guestIndex: e.detail.value
    })
  },

  // 检查搜索状态
  checkSearchStatus: function () {
    const canSearch = this.data.destination.trim() !== '' && 
                     this.data.checkInDate !== '' && 
                     this.data.checkOutDate !== ''
    
    this.setData({
      canSearch: canSearch
    })
  },

  // 最低价格输入
  onMinPriceInput: function (e) {
    this.setData({
      minPrice: e.detail.value
    })
    this.filterHotels()
  },

  // 最高价格输入
  onMaxPriceInput: function (e) {
    this.setData({
      maxPrice: e.detail.value
    })
    this.filterHotels()
  },

  // 设置星级筛选
  setStarFilter: function (e) {
    const star = e.currentTarget.dataset.star
    this.setData({
      starFilter: star
    })
    this.filterHotels()
  },

  // 设置排序方式
  setSortBy: function (e) {
    const sort = e.currentTarget.dataset.sort
    this.setData({
      sortBy: sort
    })
    this.filterHotels()
  },

  // 设置视图模式
  setViewMode: function (e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({
      viewMode: mode
    })
  },

  // 搜索酒店
  searchHotels: function () {
    if (!this.data.canSearch) {
      app.showToast('请填写完整的搜索条件', 'none')
      return
    }

    this.setData({
      isLoading: true,
      hasSearched: true
    })

    // 模拟API调用
    setTimeout(() => {
      this.performSearch()
    }, 1000)
  },

  // 执行搜索
  performSearch: function () {
    // 模拟酒店数据
    const mockHotels = this.generateMockHotels()
    
    this.setData({
      hotels: mockHotels,
      filteredHotels: mockHotels,
      isLoading: false
    })
    
    this.filterHotels()
  },

  // 生成模拟酒店数据
  generateMockHotels: function () {
    const hotels = []
    const hotelNames = [
      '北京希尔顿酒店', '上海浦东丽思卡尔顿酒店', '广州白天鹅宾馆',
      '深圳福田香格里拉大酒店', '杭州西溪悦榕庄', '成都太古里博舍酒店',
      '西安威斯汀大酒店', '南京金陵饭店', '苏州金鸡湖凯宾斯基酒店'
    ]
    
    const platforms = [
      { name: '飞猪', icon: '/images/fliggy.png', color: '#FF6A00' },
      { name: '携程', icon: '/images/ctrip.png', color: '#0086F6' },
      { name: '美团', icon: '/images/meituan.png', color: '#FFC300' },
      { name: '去哪儿', icon: '/images/qunar.png', color: '#00A6FB' }
    ]

    for (let i = 0; i < 9; i++) {
      const hotel = {
        id: i + 1,
        name: hotelNames[i],
        address: `北京市朝阳区某某路${i + 1}号`,
        image: `/images/hotel-${i + 1}.png`,
        rating: (4.0 + Math.random() * 1.0).toFixed(1),
        stars: Math.floor(Math.random() * 3) + 3, // 3-5星
        features: ['免费WiFi', '健身房', '游泳池', '餐厅'].slice(0, Math.floor(Math.random() * 4) + 1),
        prices: []
      }

      // 为每个平台生成价格
      platforms.forEach(platform => {
        const basePrice = 300 + Math.random() * 700
        const price = Math.floor(basePrice / 10) * 10 // 取整到10
        hotel.prices.push({
          platform: platform.name,
          platformName: platform.name,
          platformIcon: platform.icon,
          price: price,
          description: '含早餐',
          note: Math.random() > 0.7 ? '限时优惠' : '',
          url: `https://${platform.name.toLowerCase()}.com/hotel/${hotel.id}`
        })
      })

      // 计算最低价格
      const prices = hotel.prices.map(p => p.price)
      const minPrice = Math.min(...prices)
      const lowestPricePlatform = hotel.prices.find(p => p.price === minPrice)
      hotel.lowestPrice = {
        price: minPrice,
        platform: lowestPricePlatform.platform,
        platformName: lowestPricePlatform.platformName
      }

      hotels.push(hotel)
    }

    return hotels
  },

  // 筛选酒店
  filterHotels: function () {
    let filtered = [...this.data.hotels]

    // 价格筛选
    if (this.data.minPrice !== '') {
      filtered = filtered.filter(hotel => 
        hotel.lowestPrice.price >= parseInt(this.data.minPrice)
      )
    }
    if (this.data.maxPrice !== '') {
      filtered = filtered.filter(hotel => 
        hotel.lowestPrice.price <= parseInt(this.data.maxPrice)
      )
    }

    // 星级筛选
    if (this.data.starFilter !== 'all') {
      const starCount = parseInt(this.data.starFilter)
      filtered = filtered.filter(hotel => hotel.stars === starCount)
    }

    // 排序
    filtered.sort((a, b) => {
      switch (this.data.sortBy) {
        case 'price':
          return a.lowestPrice.price - b.lowestPrice.price
        case 'rating':
          return parseFloat(b.rating) - parseFloat(a.rating)
        case 'distance':
          // 模拟距离排序
          return Math.random() - 0.5
        default:
          return 0
      }
    })

    this.setData({
      filteredHotels: filtered
    })
  },

  // 查看酒店详情
  viewHotelDetail: function (e) {
    const hotel = e.currentTarget.dataset.hotel
    // 这里可以导航到酒店详情页面
    app.showToast(`查看${hotel.name}详情`, 'none')
  },

  // 查看所有价格
  viewAllPrices: function (e) {
    const hotel = e.currentTarget.dataset.hotel
    this.setData({
      selectedHotel: hotel,
      showPriceModal: true
    })
  },

  // 隐藏价格弹窗
  hidePriceModal: function () {
    this.setData({
      showPriceModal: false,
      selectedHotel: null
    })
  },

  // 预订酒店
  bookHotel: function (e) {
    const hotel = e.currentTarget.dataset.hotel
    const platform = e.currentTarget.dataset.platform
    
    // 这里应该跳转到对应的预订平台
    const platformUrl = hotel.prices.find(p => p.platform === platform)?.url
    if (platformUrl) {
      // 复制链接到剪贴板
      wx.setClipboardData({
        data: platformUrl,
        success: () => {
          app.showToast('链接已复制到剪贴板', 'success')
        }
      })
    } else {
      app.showToast(`正在跳转到${platform}预订`, 'none')
    }
  },

  // 查看平台详情
  viewPlatform: function (e) {
    const url = e.currentTarget.dataset.url
    // 复制链接到剪贴板
    wx.setClipboardData({
      data: url,
      success: () => {
        app.showToast('链接已复制到剪贴板', 'success')
      }
    })
  },

  // 收藏酒店
  addToFavorites: function (e) {
    const hotel = e.currentTarget.dataset.hotel
    // 添加到收藏列表
    let favorites = wx.getStorageSync('favoriteHotels') || []
    const exists = favorites.find(f => f.id === hotel.id)
    
    if (!exists) {
      favorites.push(hotel)
      wx.setStorageSync('favoriteHotels', favorites)
      app.showToast('已添加到收藏', 'success')
    } else {
      app.showToast('已在收藏列表中', 'none')
    }
  },

  // 阻止事件冒泡
  stopPropagation: function () {
    // 空函数，用于阻止事件冒泡
  },

  // 分享小程序
  onShareAppMessage: function () {
    return {
      title: '酒店比价神器，找到最优惠的酒店',
      path: '/pages/hotel/hotel'
    }
  },

  onShareTimeline: function () {
    return {
      title: '酒店比价神器，找到最优惠的酒店'
    }
  }
})