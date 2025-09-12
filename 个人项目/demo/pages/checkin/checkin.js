// pages/checkin/checkin.js
const app = getApp()

Page({
  data: {
    longitude: null,
    latitude: null,
    address: '',
    checkinContent: '',
    checkinPhotos: [],
    availableTags: [
      { name: '风景', selected: false },
      { name: '美食', selected: false },
      { name: '文化', selected: false },
      { name: '建筑', selected: false },
      { name: '自然', selected: false },
      { name: '城市', selected: false },
      { name: '乡村', selected: false },
      { name: '海滩', selected: false },
      { name: '山脉', selected: false },
      { name: '历史', selected: false }
    ],
    selectedAlbum: null,
    selectedAlbumId: null,
    privacy: 'public', // public, private
    showAlbumModal: false,
    showTagInputModal: false,
    customTagName: '',
    userAlbums: [],
    canSubmit: false,
    isLocationAlreadyCheckin: false, // 当前位置是否已经打卡过
    existingCheckinInfo: null // 已存在的打卡信息
  },

  onLoad: function (options) {
    // 检查是否从地图页面传递了位置信息
    if (options.longitude && options.latitude) {
      this.initLocationFromMap(options.longitude, options.latitude)
    } else {
      this.initLocation()
    }
    this.loadUserAlbums()
    this.checkSubmitStatus()
  },

  // 初始化位置信息
  initLocation: function () {
    app.showLoading('获取位置中...')
    
    app.getCurrentLocation().then(res => {
      this.setData({
        longitude: res.longitude,
        latitude: res.latitude
      })
      
      // 检查当前位置是否已经打卡过
      this.checkLocationCheckinStatus(res.longitude, res.latitude)
      
      // 解析地址
      this.reverseGeocode(res.longitude, res.latitude)
      
      app.hideLoading()
    }).catch(err => {
      console.error('获取位置失败', err)
      app.hideLoading()
      app.showToast('获取位置失败，请检查定位权限', 'error')
    })
  },

  // 从地图页面初始化位置信息
  initLocationFromMap: function (longitude, latitude) {
    app.showLoading('设置位置中...')
    
    this.setData({
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude)
    })
    
    // 检查当前位置是否已经打卡过
    this.checkLocationCheckinStatus(parseFloat(longitude), parseFloat(latitude))
    
    // 解析地址
    this.reverseGeocode(parseFloat(longitude), parseFloat(latitude))
    
    app.hideLoading()
  },

  // 自定义输入位置
  customLocationInput: function () {
    wx.showModal({
      title: '自定义位置',
      content: '请输入城市或商店名称',
      editable: true,
      placeholderText: '例如：北京故宫、星巴克咖啡',
      success: (res) => {
        if (res.confirm && res.content) {
          const locationName = res.content.trim()
          if (locationName) {
            this.setData({
              address: locationName,
              isCustomLocation: true
            })
            app.showToast('位置设置成功')
          }
        }
      }
    })
  },

  // 刷新位置
  refreshLocation: function () {
    this.initLocation()
  },

  // 检查当前位置是否已经打卡过
  checkLocationCheckinStatus: function (longitude, latitude) {
    const checkins = wx.getStorageSync('checkinPoints') || []
    const currentUserId = app.globalData.userInfo?.id
    
    if (!currentUserId) return
    
    // 精确到小数点后3位进行比较
    const roundedLng = Math.round(longitude * 1000) / 1000
    const roundedLat = Math.round(latitude * 1000) / 1000
    
    // 查找用户在该位置的打卡记录
    const existingCheckin = checkins.find(checkin => {
      if (checkin.userId !== currentUserId) return false
      
      const checkinLng = Math.round(checkin.longitude * 1000) / 1000
      const checkinLat = Math.round(checkin.latitude * 1000) / 1000
      
      return checkinLng === roundedLng && checkinLat === roundedLat
    })
    
    if (existingCheckin) {
      this.setData({
        isLocationAlreadyCheckin: true,
        existingCheckinInfo: existingCheckin
      })
    } else {
      this.setData({
        isLocationAlreadyCheckin: false,
        existingCheckinInfo: null
      })
    }
  },

  // 反向地理编码（解析地址），使用腾讯地图的api
  reverseGeocode: function (longitude, latitude) {
    wx.request({
      url: 'https://apis.map.qq.com/ws/geocoder/v1/',
      method: 'GET',
      data: {
        location: `${latitude},${longitude}`,
        key: app.globalData.tencentMapKey
      },
      success: (res) => {
        console.log(res.data)
        this.setData({
          address: res.data.result.formatted_addresses.recommend
        })
      }
    })
  },

  // 加载用户相册
  loadUserAlbums: function () {
    const albums = wx.getStorageSync('albums') || []
    const currentUserId = app.globalData.userInfo?.id
    
    const userAlbums = albums.filter(album => 
      // 用户创建的相册
      album.creatorId === currentUserId || 
      // 共享相册且用户有上传权限
      (album.type === 'shared' && album.permissions && album.permissions.upload) ||
      // 默认相册（所有用户都可以使用）
      album.isDefault === true
    )
    
    this.setData({
      userAlbums: userAlbums
    })
  },

  // 检查提交状态
  checkSubmitStatus: function () {
    // 打卡内容不是必须的，总是可以提交
    this.setData({
      canSubmit: true
    })
  },

  // 打卡内容输入
  onContentInput: function (e) {
    this.setData({
      checkinContent: e.detail.value
    })
    this.checkSubmitStatus()
  },


  // 添加照片
  addPhoto: function () {
    const remainingCount = 9 - this.data.checkinPhotos.length
    
    wx.chooseImage({
      count: remainingCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newPhotos = [...this.data.checkinPhotos, ...res.tempFilePaths]
        this.setData({
          checkinPhotos: newPhotos
        })
      }
    })
  },

  // 删除照片
  deletePhoto: function (e) {
    const index = e.currentTarget.dataset.index
    let photos = [...this.data.checkinPhotos]
    photos.splice(index, 1)
    
    this.setData({
      checkinPhotos: photos
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

  // 显示自定义标签输入
  showCustomTagInput: function () {
    this.setData({
      showTagInputModal: true,
      customTagName: ''
    })
  },

  // 隐藏自定义标签输入
  hideCustomTagInput: function () {
    this.setData({
      showTagInputModal: false
    })
  },

  // 自定义标签输入
  onCustomTagInput: function (e) {
    this.setData({
      customTagName: e.detail.value
    })
  },

  // 添加自定义标签
  addCustomTag: function () {
    const tagName = this.data.customTagName.trim()
    
    if (!tagName) {
      app.showToast('请输入标签名称')
      return
    }
    
    if (tagName.length > 10) {
      app.showToast('标签名称不能超过10个字符')
      return
    }
    
    // 检查是否已存在
    const exists = this.data.availableTags.some(tag => tag.name === tagName)
    if (exists) {
      app.showToast('标签已存在')
      return
    }
    
    // 添加新标签
    const newTag = { name: tagName, selected: true }
    let tags = [...this.data.availableTags, newTag]
    
    this.setData({
      availableTags: tags,
      showTagInputModal: false
    })
    
    app.showToast('标签添加成功')
  },

  // 选择相册
  selectAlbum: function () {
    if (this.data.userAlbums.length === 0) {
      app.showToast('暂无可用的相册')
      return
    }
    
    this.setData({
      showAlbumModal: true
    })
  },

  // 选择相册项目
  selectAlbumItem: function (e) {
    const album = e.currentTarget.dataset.album
    this.setData({
      selectedAlbum: album,
      selectedAlbumId: album.id
    })
  },

  // 确认相册选择
  confirmAlbum: function () {
    this.setData({
      showAlbumModal: false
    })
  },

  // 隐藏相册选择器
  hideAlbumSelector: function () {
    this.setData({
      showAlbumModal: false
    })
  },

  // 设置隐私
  setPrivacy: function (e) {
    const privacy = e.currentTarget.dataset.privacy
    this.setData({
      privacy: privacy
    })
  },

  // 提交打卡
  submitCheckin: function () {
    // 打卡内容不是必须的
    if (!this.data.address) {
      app.showToast('请设置打卡位置')
      return
    }
    
    // 如果是自定义位置，不需要经纬度
    if (!this.data.isCustomLocation && (!this.data.longitude || !this.data.latitude)) {
      app.showToast('无法获取位置信息')
      return
    }
    
    app.showLoading('正在提交...')
    
    // 获取选中的标签
    const selectedTags = this.data.availableTags
      .filter(tag => tag.selected)
      .map(tag => tag.name)
    
    // 创建打卡记录
    const checkinData = {
      id: Date.now().toString(),
      longitude: this.data.longitude,
      latitude: this.data.latitude,
      address: this.data.address,
      content: this.data.checkinContent.trim() || '无',
      photos: this.data.checkinPhotos,
      tags: selectedTags,
      albumId: this.data.selectedAlbumId,
      albumName: this.data.selectedAlbum ? this.data.selectedAlbum.name : null,
      privacy: this.data.privacy,
      createTime: new Date().toLocaleString(),
      userId: app.globalData.userInfo?.id || 'unknown',
      userName: app.globalData.userInfo?.nickName || '未知用户'
    }
    
    // 保存打卡记录
    this.saveCheckinData(checkinData)
  },

  // 取消打卡
  cancelCheckin: function () {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消打卡吗？已填写的内容将不会保存。',
      confirmText: '确定取消',
      confirmColor: '#f44336',
      cancelText: '继续编辑',
      success: (res) => {
        if (res.confirm) {
          // 用户确认取消，返回上一页
          wx.navigateBack()
        }
      }
    })
  },

  // 保存打卡数据
  saveCheckinData: function (checkinData) {
    // 保存到本地存储
    let checkins = wx.getStorageSync('checkinPoints') || []
    checkins.push(checkinData)
    wx.setStorageSync('checkinPoints', checkins)
    
    // 如果选择了相册，将照片添加到相册
    if (checkinData.albumId && checkinData.photos.length > 0) {
      this.addPhotosToAlbum(checkinData)
    }
    
    app.hideLoading()
    app.showToast('打卡成功！')
    
    // 返回上一页
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  },

  // 将照片添加到相册
  addPhotosToAlbum: function (checkinData) {
    let allPhotos = wx.getStorageSync('photos') || []
    const newPhotos = checkinData.photos.map((photo, index) => {
      return {
        id: Date.now() + index,
        albumId: checkinData.albumId,
        url: photo,
        name: `打卡照片${index + 1}`,
        description: checkinData.content,
        location: checkinData.address,
        uploadTime: checkinData.createTime,
        size: 0,
        type: 'image',
        source: 'checkin'
      }
    })
    
    allPhotos = allPhotos.concat(newPhotos)
    wx.setStorageSync('photos', allPhotos)
    
    // 更新相册照片数量
    let albums = wx.getStorageSync('albums') || []
    const albumIndex = albums.findIndex(a => a.id === checkinData.albumId)
    if (albumIndex > -1) {
      albums[albumIndex].photoCount = (albums[albumIndex].photoCount || 0) + newPhotos.length
      wx.setStorageSync('albums', albums)
    }
  },

})