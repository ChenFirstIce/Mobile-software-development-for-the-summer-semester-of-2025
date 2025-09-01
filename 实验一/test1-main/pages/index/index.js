//index.js
Page({
<<<<<<< HEAD
  data: {
    src: '/images/logo.jpg',
    name: 'Hello world'
  },
  
  // 新版获取用户信息方法
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户信息', // 必须填写
      success: (res) => {
        this.setData({
          src: res.userInfo.avatarUrl,
          name: res.userInfo.nickName
        })
      },
      fail: () => {
        console.log('用户拒绝授权')
      }
=======
  /**
   * 页面的初始数据
   */
  data: {
    src: '/images/logo.jpg',
    name: 'Hello world',
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
  },
  //获取用户信息
  getMyInfo: function(e) {
    wx.getUserProfile({
      desc: '展示用户信息',
      success: (res) => {
        console.log('用户信息获取成功', res)
        this.setData({
          name: res.userInfo.nickName, // 修正：从 userInfo 中获取昵称
          src: res.userInfo.avatarUrl,     // 修正：从 userInfo 中获取头像
          hasUserInfo: true
        })
      },
      fail: (res) => {
        console.log('用户信息获取失败', res)
      },
      complete: (res) => {},
>>>>>>> 4c273b32551c6b110e01e7450cb7a474b44c68c3
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    
  },
})