// pages/game/game.js
//最底层的画布，有1：石头 0：外围的墙 2：路（ice） 3：猪（终点）；不存储小鸟和箱子
var data = require('../../utils/data.js')
var map = [
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
]

//很明显，这里指的是箱子的位置
var box = [
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
]

//方块的宽度
var w = 40
//初始小鸟的位置
var row = 0
var col = 0

Page({

  /**
   * 页面的初始数据
   */
  data: {
    level: 1
  },
  //初始化地图，并修改box中box的位置以及map中小鸟的位置
  initMap: function(level){
    let mapData = data.maps[level]//获得data.js中的数据
    for(var i = 0;i < 8;i++){
      for(var j = 0;j < 8;j++){
        box[i][j] = 0
        map[i][j] = mapData[i][j]

        if(mapData[i][j] == 4){
          box[i][j] = 4
          map[i][j] = 2//最底层画布的地图中，箱子在的位置表示为路 (ice)
        }else if(mapData[i][j] == 5){
          map[i][j] = 2//最底层画布的地图中，箱子在的位置表示为路（ice）
          row = i
          col = j
        }
      }
    }
  },

  drawCanvas: function(){
    let ctx = this.ctx
    ctx.clearRect(0,0,320,320)//y, x, y边界, x边界

    //一个格子一个格子的循环，地图
    for(var i = 0;i < 8;i++){
      for(var j = 0;j < 8;j++){
        let img = 'ice' //默认是路（ice）
        if(map[i][j] == 1){
          img = 'stone'
        }else if(map[i][j] == 3){
          img = 'pig'
        }

        //绘制地图，在该地点刷新图片
        ctx.drawImage('/images/icons/' + img + '.png', j * w, i * w, w, w)

        if(box[i][j] == 4){
          //在原地图是ice的基础上，叠加绘制箱子
          ctx.drawImage('/images/icons/box.png', j * w, i * w, w, w)
        }
      }
    }

    //这里的col和row表示的是小鸟的位置，直接叠加
    ctx.drawImage('/images/icons/bird.png', col * w, row * w, w, w)

    ctx.draw()
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    //获得关卡
    let level = options.level//从‘url：？level = ’获得level的值
    //更新页面关卡标题
    this.setData({
      level: parseInt(level) + 1
    })
    //创建画布上下文
    this.ctx = wx.createCanvasContext('myCanvas')
    this.initMap(level)
    this.drawCanvas()
  },

  isWin:function(){
    for(var i = 0;i < 8;i++){
      for(var j = 0;j < 8;j++){
        if(box[i][j] == 4 && map[i][j] != 3){//判断箱子的位置和猪（终点）的位置是否重合即可
          return false
        }
      }
    }
    return true
  },

  checkWin:function(){
    if(this.isWin()){
      wx.showModal({
        title: 'WIN',
        content: '你赢了🐂',
        showCancel:false
      })
    }
  },

  up:function(){
    //如果不在边界才能操作
    if(row > 0){
      //上面不能是石头和箱子
      if(map[row - 1][col] != 1 && box[row - 1][col] != 4){
        row = row - 1
      }else if(box[row - 1][col] == 4){//如果上面是箱子，就要判断是否能够推动箱子
        if(row - 1 > 0){//上上面不是边界
          if(map[row - 2][col] != 1 && box[row - 2][col] != 4){//上上面没有路障
            box[row - 2][col] = 4//可以向上推动箱子
            box[row - 1][col] = 0

            //更新小鸟的坐标
            row = row - 1
          }
        }
      }
      //重新绘制
      this.drawCanvas()
      this.checkWin()
    }
  },

  down:function(){
    //如果不在边界才能操作
    if(row < 7){
      //下面不能是石头和箱子
      if(map[row + 1][col] != 1 && box[row + 1][col] != 4){
        row = row + 1
      }else if(box[row + 1][col] == 4){//如果下面是箱子，就要判断是否能够推动箱子
        if(row + 1 < 7){//下下面不是边界
          if(map[row + 2][col] != 1 && box[row + 2][col] != 4){//下下面没有路障
            box[row + 2][col] = 4//可以向下推动箱子
            box[row + 1][col] = 0

            //更新小鸟的坐标
            row = row + 1
          }
        }
      }
      //重新绘制
      this.drawCanvas()
      this.checkWin()
    }
  },

  left:function(){
    //如果不在边界才能操作
    if(col > 0){
      //左面不能是石头和箱子
      if(map[row][col - 1] != 1 && box[row][col - 1] != 4){
        col = col - 1
      }else if(box[row][col - 1] == 4){//如果左面是箱子，就要判断是否能够推动箱子
        if(col - 1 > 0){//左左面不是边界
          if(map[row][col - 2] != 1 && box[row][col - 2] != 4){//左左面没有路障
            box[row][col - 2] = 4//可以向左推动箱子
            box[row][col - 1] = 0

            //更新小鸟的坐标
            col = col - 1
          }
        }
      }
      //重新绘制
      this.drawCanvas()
      this.checkWin()
    }
  },

  right:function(){
    //如果不在边界才能操作
    if(col < 7){
      //右面不能是石头和箱子
      if(map[row][col + 1] != 1 && box[row][col + 1] != 4){
        col = col + 1
      }else if(box[row][col + 1] == 4){//如果右面是箱子，就要判断是否能够推动箱子
        if(col + 1 < 7){//右右面不是边界
          if(map[row][col + 2] != 1 && box[row][col + 2] != 4){//右右面没有路障
            box[row][col + 2] = 4//可以向右推动箱子
            box[row][col + 1] = 0

            //更新小鸟的坐标
            col = col + 1
          }
        }
      }
      //重新绘制
      this.drawCanvas()
      this.checkWin()
    }
  },

  restartGame:function(){
    this.initMap(this.data.level - 1)//因为maps下标从0开始
    this.drawCanvas()
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})