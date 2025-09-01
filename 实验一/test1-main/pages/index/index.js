//index.js
Page({
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