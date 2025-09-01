// pages/checkin/checkin.js
const app = getApp()

Page({
  data: {
    longitude: null,
    latitude: null,
    address: '',
    checkinContent: '',
    checkinType: 'text', // text, photo, mixed
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
    privacy: 'public', // public, friends, private
    showAlbumModal: false,
    showTagInputModal: false,
    customTagName: '',
    userAlbums: [],
    canSubmit: false
  },

  onLoad: function (options) {
    this.initLocation()
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
      
      // 解析地址
      this.reverseGeocode(res.longitude, res.latitude)
      
      app.hideLoading()
    }).catch(err => {
      console.error('获取位置失败', err)
      app.hideLoading()
      app.showToast('获取位置失败，请检查定位权限', 'error')
    })
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

  // 反向地理编码（解析地址）
  reverseGeocode: function (longitude, latitude) {
    // 这里应该调用地图API进行地址解析
    // 由于微信小程序限制，这里使用模拟数据
    setTimeout(() => {
      this.setData({
        address: `经度${longitude.toFixed(6)}, 纬度${latitude.toFixed(6)}`
      })
    }, 1000)
  },

  // 加载用户相册
  loadUserAlbums: function () {
    const albums = wx.getStorageSync('albums') || []
    const userAlbums = albums.filter(album => 
      album.creatorId === app.globalData.userInfo?.id || 
      (album.type === 'shared' && album.permissions && album.permissions.upload)
    )
    
    this.setData({
      userAlbums: userAlbums
    })
  },

  // 检查提交状态
  checkSubmitStatus: function () {
    const canSubmit = this.data.checkinContent.trim().length > 0
    this.setData({
      canSubmit: canSubmit
    })
  },

  // 打卡内容输入
  onContentInput: function (e) {
    this.setData({
      checkinContent: e.detail.value
    })
    this.checkSubmitStatus()
  },

  // 选择打卡类型
  selectType: function (e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      checkinType: type
    })
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
      content: this.data.checkinContent.trim(),
      type: this.data.checkinType,
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

  // 保存打卡数据
  saveCheckinData: function (checkinData) {
    // 保存到本地存储
    let checkins = wx.getStorageSync('checkins') || []
    checkins.push(checkinData)
    wx.setStorageSync('checkins', checkins)
    
    // 如果选择了相册，将照片添加到相册
    if (checkinData.albumId && checkinData.photos.length > 0) {
      this.addPhotosToAlbum(checkinData)
    }
    
    // 更新地图页面的打卡点
    this.updateMapCheckinPoints(checkinData)
    
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

  // 更新地图打卡点
  updateMapCheckinPoints: function (checkinData) {
    let checkinPoints = wx.getStorageSync('checkinPoints') || []
    
    const newPoint = {
      id: checkinData.id,
      longitude: checkinData.longitude,
      latitude: checkinData.latitude,
      content: checkinData.content,
      type: checkinData.type,
      photos: checkinData.photos,
      tags: checkinData.tags,
      createTime: checkinData.createTime,
      privacy: checkinData.privacy
    }
    
    checkinPoints.push(newPoint)
    wx.setStorageSync('checkinPoints', checkinPoints)
  },

  // 取消打卡
  cancelCheckin: function () {
    wx.navigateBack()
  },

  // 阻止事件冒泡
  stopPropagation: function () {
    // 空函数，用于阻止事件冒泡
  }
})