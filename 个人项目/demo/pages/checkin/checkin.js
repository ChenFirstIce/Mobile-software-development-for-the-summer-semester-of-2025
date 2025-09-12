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
    // 先尝试从云端检查
    this.checkLocationCheckinStatusFromCloud(longitude, latitude)
  },

  // 从云端检查位置打卡状态
  checkLocationCheckinStatusFromCloud: function (longitude, latitude) {
    wx.cloud.callFunction({
      name: 'checkinManager',
      data: {
        action: 'getByLocation',
        longitude: longitude,
        latitude: latitude,
        radius: 0.001 // 100米范围内
      },
      success: (res) => {
        if (res.result.success) {
          const checkins = res.result.data.list || []
          const currentUserId = app.globalData.userInfo?._openid
          
          // 查找用户在该位置的打卡记录
          const existingCheckin = checkins.find(checkin => checkin.userId === currentUserId)
          
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
        } else {
          // 云端检查失败，使用本地数据
          this.checkLocationCheckinStatusFromLocal(longitude, latitude)
        }
      },
      fail: (err) => {
        console.error('从云端检查打卡状态失败:', err)
        // 云端检查失败，使用本地数据
        this.checkLocationCheckinStatusFromLocal(longitude, latitude)
      }
    })
  },

  // 从本地检查位置打卡状态
  checkLocationCheckinStatusFromLocal: function (longitude, latitude) {
    const checkins = wx.getStorageSync('checkinPoints') || []
    const currentUserId = app.globalData.userInfo?._openid
    
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
    // 先尝试从云端获取
    this.loadUserAlbumsFromCloud()
  },

  // 从云端加载用户相册
  loadUserAlbumsFromCloud: function () {
    wx.cloud.callFunction({
      name: 'albumManager',
      data: {
        action: 'getList',
        type: 'all'
      },
      success: (res) => {
        if (res.result.success && res.result.data && res.result.data.list) {
          this.setData({
            userAlbums: res.result.data.list
          })
        } else {
          // 云端获取失败，使用本地数据
          this.loadUserAlbumsFromLocal()
        }
      },
      fail: (err) => {
        console.error('从云端获取相册失败:', err)
        // 云端获取失败，使用本地数据
        this.loadUserAlbumsFromLocal()
      }
    })
  },

  // 从本地加载用户相册
  loadUserAlbumsFromLocal: function () {
    const albums = wx.getStorageSync('albums') || []
    const currentUserId = app.globalData.userInfo?._openid
    
    // 确保 albums 是数组
    if (!Array.isArray(albums)) {
      console.error('本地相册数据格式错误:', albums)
      this.setData({
        userAlbums: []
      })
      return
    }
    
    const userAlbums = albums.filter(album => 
      // 用户创建的相册
      album.creatorId === currentUserId || 
      // 共享相册且用户有上传权限
      (album.type === 'shared' && album.permissions && album.permissions.upload) ||
      // 默认相册（所有用户都可以使用）
      album.isDefault === true
    )
    
    this.setData({
      userAlbums: userAlbums || []
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
        // 上传照片到云存储
        this.uploadPhotosToCloud(res.tempFilePaths)
      }
    })
  },

  // 上传照片到云存储
  uploadPhotosToCloud: function (tempFilePaths) {
    app.showLoading('上传照片中...')
    
    const uploadPromises = tempFilePaths.map((filePath, index) => {
      const fileName = `checkin/${Date.now()}_${index}.jpg`
      return wx.cloud.uploadFile({
        cloudPath: fileName,
        filePath: filePath
      })
    })

    Promise.all(uploadPromises)
      .then((results) => {
        const cloudFileIds = results.map(result => result.fileID)
        const newPhotos = [...this.data.checkinPhotos, ...cloudFileIds]
        
        this.setData({
          checkinPhotos: newPhotos
        })
        
        app.hideLoading()
        app.showToast('照片上传成功')
      })
      .catch((error) => {
        console.error('照片上传失败:', error)
        app.hideLoading()
        app.showToast('照片上传失败，请重试', 'error')
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
    // 检查 userAlbums 是否存在且为数组
    if (!this.data.userAlbums || !Array.isArray(this.data.userAlbums) || this.data.userAlbums.length === 0) {
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
      selectedAlbumId: album._id || album.id
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
    
    // 提交到云端
    this.submitCheckinToCloud(selectedTags)
  },

  // 提交打卡到云端
  submitCheckinToCloud: function (selectedTags) {
    wx.cloud.callFunction({
      name: 'checkinManager',
      data: {
        action: 'create',
        longitude: this.data.longitude,
        latitude: this.data.latitude,
        address: this.data.address,
        content: this.data.checkinContent.trim() || '',
        photos: this.data.checkinPhotos,
        tags: selectedTags,
        albumId: this.data.selectedAlbumId,
        albumName: this.data.selectedAlbum ? this.data.selectedAlbum.name : null,
        privacy: this.data.privacy
      },
      success: (res) => {
        if (res.result.success) {
          // 云端保存成功，同时保存到本地作为备份
          this.saveCheckinDataToLocal(res.result.data)
          
          app.hideLoading()
          app.showToast('打卡成功！')
          
          // 如果选择了相册，将照片添加到相册
          if (this.data.selectedAlbumId && this.data.checkinPhotos.length > 0) {
            this.addPhotosToAlbum(res.result.data)
          }
          
          // 返回上一页
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          app.hideLoading()
          app.showToast(res.result.message || '打卡失败，请重试', 'error')
        }
      },
      fail: (err) => {
        console.error('提交打卡到云端失败:', err)
        app.hideLoading()
        app.showToast('网络错误，正在保存到本地...', 'error')
        
        // 云端失败，保存到本地
        this.saveCheckinDataToLocal({
          id: Date.now().toString(),
          longitude: this.data.longitude,
          latitude: this.data.latitude,
          address: this.data.address,
          content: this.data.checkinContent.trim() || '',
          photos: this.data.checkinPhotos,
          tags: selectedTags,
          albumId: this.data.selectedAlbumId,
          albumName: this.data.selectedAlbum ? this.data.selectedAlbum.name : null,
          privacy: this.data.privacy,
          createTime: new Date().toLocaleString(),
          userId: app.globalData.userInfo?._openid || 'unknown',
          userName: app.globalData.userInfo?.nickName || '未知用户'
        })
      }
    })
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

  // 保存打卡数据到本地
  saveCheckinDataToLocal: function (checkinData) {
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
    // 先尝试添加到云端相册
    this.addPhotosToAlbumCloud(checkinData)
  },

  // 添加照片到云端相册
  addPhotosToAlbumCloud: function (checkinData) {
    const photoData = checkinData.photos.map((photo, index) => {
      return {
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

    wx.cloud.callFunction({
      name: 'photoManager',
      data: {
        action: 'batchUpload',
        photos: photoData
      },
      success: (res) => {
        if (res.result.success) {
          console.log('照片已添加到云端相册')
        } else {
          console.error('添加照片到云端相册失败:', res.result.message)
          // 云端失败，保存到本地
          this.addPhotosToAlbumLocal(checkinData)
        }
      },
      fail: (err) => {
        console.error('添加照片到云端相册失败:', err)
        // 云端失败，保存到本地
        this.addPhotosToAlbumLocal(checkinData)
      }
    })
  },

  // 添加照片到本地相册
  addPhotosToAlbumLocal: function (checkinData) {
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
    const albumIndex = albums.findIndex(a => (a._id === checkinData.albumId) || (a.id === checkinData.albumId))
    if (albumIndex > -1) {
      albums[albumIndex].photoCount = (albums[albumIndex].photoCount || 0) + newPhotos.length
      wx.setStorageSync('albums', albums)
    }
  },

})