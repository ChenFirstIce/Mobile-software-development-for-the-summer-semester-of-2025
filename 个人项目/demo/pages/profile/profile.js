// pages/profile/profile.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    showLoginModal: false,
    isEditingNickname: false,
    editNickName: '',
    editAvatar: ''
  },

  onLoad: function (options) {
    this.checkLoginStatus()
  },

  onShow: function () {
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus: function () {
    const userInfo = wx.getStorageSync('userInfo')
    const isLoggedIn = wx.getStorageSync('userToken') ? true : false
    
    this.setData({
      userInfo: userInfo,
      isLoggedIn: isLoggedIn
    })
  },

  // 显示登录弹窗
  showLoginModal: function () {
    this.setData({
      showLoginModal: true
    })
  },

  // 隐藏登录弹窗
  hideLoginModal: function () {
    this.setData({
      showLoginModal: false
    })
  },

  // 微信授权登录（云开发版本）
  wxLogin: function () {
    wx.showLoading({
      title: '登录中...'
    })

    app.wxLogin()
      .then((userInfo) => {
        wx.hideLoading()
        this.setData({
          userInfo: userInfo,
          isLoggedIn: true,
          showLoginModal: false
        })
        app.showToast('登录成功')
        
        // 登录成功后跳转到首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }, 1500)
      })
      .catch((error) => {
        wx.hideLoading()
        console.error('登录失败:', error)
        app.showToast(error.message || '登录失败，请重试')
      })
  },

  // 获取用户信息（云开发版本）
  getUserProfile: function () {
    if (!this.data.isLoggedIn) {
      this.showLoginModal()
      return
    }

    wx.showLoading({
      title: '获取信息中...'
    })

    app.getUserProfile()
      .then((userInfo) => {
        wx.hideLoading()
        this.setData({
          userInfo: userInfo
        })
        app.showToast('用户信息更新成功')
      })
      .catch((error) => {
        wx.hideLoading()
        console.error('获取用户信息失败:', error)
        app.showToast('获取用户信息失败')
      })
  },

  // 退出登录
  logout: function () {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储
          wx.removeStorageSync('userToken')
          wx.removeStorageSync('userInfo')
          
          // 更新全局数据
          app.globalData.userInfo = null
          app.globalData.isLoggedIn = false
          
          // 更新页面数据
          this.setData({
            userInfo: null,
            isLoggedIn: false
          })
          
          app.showToast('已退出登录')
        }
      }
    })
  },

  // 编辑头像
  editAvatar: function () {
    if (!this.data.isLoggedIn) {
      this.showLoginModal()
      return
    }
    
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          editAvatar: res.tempFilePaths[0]
        })
        this.saveAvatar()
      }
    })
  },

  // 编辑昵称
  editNickname: function () {
    if (!this.data.isLoggedIn) {
      this.showLoginModal()
      return
    }
    
    this.setData({
      isEditingNickname: true,
      editNickName: this.data.userInfo.nickName || ''
    })
  },

  // 完成昵称编辑
  finishNicknameEdit: function () {
    if (this.data.isEditingNickname) {
      this.saveNickname()
    }
  },

  // 昵称输入
  onNickNameInput: function (e) {
    this.setData({
      editNickName: e.detail.value
    })
  },

  // 保存头像（云开发版本）
  saveAvatar: function () {
    if (!this.data.editAvatar) return

    app.showLoading('保存中...')

    // 先上传图片到云存储
    const fileName = `avatars/${this.data.userInfo._id}_${Date.now()}.jpg`
    wx.cloud.uploadFile({
      cloudPath: fileName,
      filePath: this.data.editAvatar,
      success: (res) => {
        console.log('头像上传成功:', res)
        
        // 调用云函数更新用户信息
        wx.cloud.callFunction({
          name: 'updateUserInfo',
          data: {
            userInfo: {
              avatarUrl: res.fileID
            }
          },
          success: (res) => {
            if (res.result.success) {
              const updatedUserInfo = res.result.data
              
              // 保存到本地存储
              wx.setStorageSync('userInfo', updatedUserInfo)
              
              // 更新全局数据
              app.globalData.userInfo = updatedUserInfo

              // 更新页面数据
              this.setData({
                userInfo: updatedUserInfo,
                editAvatar: ''
              })

              app.hideLoading()
              app.showToast('头像更新成功')
            } else {
              app.hideLoading()
              app.showToast('头像更新失败: ' + res.result.message)
            }
          },
          fail: (error) => {
            app.hideLoading()
            console.error('更新用户信息失败:', error)
            app.showToast('头像更新失败')
          }
        })
      },
      fail: (error) => {
        app.hideLoading()
        console.error('头像上传失败:', error)
        app.showToast('头像上传失败')
      }
    })
  },

  // 保存昵称（云开发版本）
  saveNickname: function () {
    const { editNickName } = this.data
    
    if (!editNickName.trim()) {
      app.showToast('请输入昵称')
      return
    }

    app.showLoading('保存中...')

    // 调用云函数更新用户信息
    wx.cloud.callFunction({
      name: 'updateUserInfo',
      data: {
        userInfo: {
          nickName: editNickName.trim()
        }
      },
      success: (res) => {
        if (res.result.success) {
          const updatedUserInfo = res.result.data
          
          // 保存到本地存储
          wx.setStorageSync('userInfo', updatedUserInfo)
          
          // 更新全局数据
          app.globalData.userInfo = updatedUserInfo

          // 更新页面数据
          this.setData({
            userInfo: updatedUserInfo,
            isEditingNickname: false,
            editNickName: ''
          })

          app.hideLoading()
          app.showToast('昵称更新成功')
        } else {
          app.hideLoading()
          app.showToast('昵称更新失败: ' + res.result.message)
        }
      },
      fail: (error) => {
        app.hideLoading()
        console.error('更新用户信息失败:', error)
        app.showToast('昵称更新失败')
      }
    })
  },

})
