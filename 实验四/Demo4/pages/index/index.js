Page({

  /**
   * 页面的初始数据
   */
  data: {
    danmuTxt: '',
    isLoading: false,
    crawlStatus: '',
    list:[]
  },


   /*创建视频上下文，控制视频的播放和停止 */
  onLoad: function (options) {
    this.videoCtx = wx.createVideoContext('myVideo')
    this.startCrawling()
  },

  /*播放视频 */
  playVideo: function(e){
    this.videoCtx.stop()
    this.setData({
     src: e.currentTarget.dataset.url
    } )
  },

  getDanmu: function(e){
    this.setData({
      danmuTxt: e.detail.value
    })
  },

  sendDanmu: function(e){
    function getRandColor() {
      let rgb = []
      for(let i = 0;i < 3;i++){
        let color = Math.floor(Math.random()*256).toString(16)
        color = color.length == 1 ? '0' + color:color
        rgb.push(color)
      }
      return '#' + rgb.join('')
    }

    let text = this.data.danmuTxt;
    this.videoCtx.sendDanmu({
      text:text,
      color: getRandColor()
    })
  },


  startCrawling: function() {
    this.setData({
      isLoading: true,
      crawlStatus: '开始爬取视频数据...'
    })

    this.crawlVideoData()
  },

  crawlVideoData: function() {
    const baseUrl = "https://arch.ahnu.edu.cn/ksxs/ksxsdyq.htm"
    
    console.log('开始请求主页面:', baseUrl)
    
    wx.request({
      url: baseUrl,
      method: 'GET',
      header: {
        'Content-Type': 'text/html; charset=utf-8'
      },
      success: (res) => {
        console.log('主页面请求成功，状态码:', res.statusCode)
        if (res.statusCode === 200) {
          console.log('HTML内容长度:', res.data.length)
          this.parseMainPage(res.data)
        } else {
          this.setData({
            isLoading: false,
            crawlStatus: `网络请求失败，状态码: ${res.statusCode}`
          })
        }
      },
      fail: (err) => {
        console.error('请求失败:', err)
        this.setData({
          isLoading: false,
          crawlStatus: '网络请求失败: ' + err.errMsg
        })
      }
    })
  },

  parseMainPage: function(html) {
    try {
      const simpleLinkRegex = /<a[^>]*href="([^"]*)"[^>]*>/g
      const allLinks = []
      let match
      
      while ((match = simpleLinkRegex.exec(html)) !== null) {
        allLinks.push(match[1])
      }
      
      console.log('找到的所有链接:', allLinks.slice(0, 10)) // 只显示前10个
    
      const textDivRegex = /<div[^>]*class="text"[^>]*>(.*?)<\/div>/gs
      const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g
      const titleRegex = /<span[^>]*class=""[^>]*>(.*?)<\/span>/g
      
      const videoLinks = []
      let textDivMatch
      
      while ((textDivMatch = textDivRegex.exec(html)) !== null) {
        const divContent = textDivMatch[1]
        console.log('找到text div:', divContent.substring(0, 200))
        
        let linkMatch
        
        // 在每个div中查找链接
        while ((linkMatch = linkRegex.exec(divContent)) !== null) {
          const url = linkMatch[1]
          const linkText = linkMatch[2]
          
          console.log('找到链接:', url, '文本:', linkText)
          
          // 提取标题
          const titleMatch = titleRegex.exec(linkText)
          if (titleMatch) {
            const title = titleMatch[1].trim()
            let fullUrl = url
            
            // 处理URL
            if (url.startsWith('../')) {
              fullUrl = 'https://arch.ahnu.edu.cn/' + url.substring(3)
            } else if (!url.startsWith('http')) {
              fullUrl = 'https://arch.ahnu.edu.cn/ksxs/' + url
            }
            
            console.log(`找到视频链接: ${title} -> ${fullUrl}`)
            
            videoLinks.push({
              title: title,
              url: fullUrl
            })
          }
        }
      }
      
      console.log(`总共找到 ${videoLinks.length} 个视频页面`)
      
      this.setData({
        crawlStatus: `找到 ${videoLinks.length} 个视频页面，开始获取视频链接...`
      })
      
      // 逐个获取视频详情
      this.crawlVideoDetails(videoLinks, 0)
      
    } catch (error) {
      console.error('解析主页面失败:', error)
      this.setData({
        isLoading: false,
        crawlStatus: '解析页面失败: ' + error.message
      })
    }
  },

  // 爬取视频详情页面
  crawlVideoDetails: function(videoLinks, index) {
    if (index >= videoLinks.length) {
      // 所有视频都爬取完成
      this.setData({
        isLoading: false,
        crawlStatus: '爬取完成'
      })
      return
    }

    const videoLink = videoLinks[index]
    
    wx.request({
      url: videoLink.url,
      method: 'GET',
      header: {
        'Content-Type': 'text/html; charset=utf-8'
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const videoUrls = this.extractVideoUrls(res.data, videoLink.url)
          
          if (videoUrls.length > 0) {
            const newVideo = {
              id: this.data.list.length + 1,
              title: videoLink.title,
              videourl: videoUrls
            }
            
            this.setData({
              list: [...this.data.list, newVideo],
              crawlStatus: `正在爬取: ${videoLink.title} (${index + 1}/${videoLinks.length})`
            })
          }
        }
        
        setTimeout(() => {
          this.crawlVideoDetails(videoLinks, index + 1)
        }, 1000)//timespeed(1)
      },
      fail: (err) => {
        console.error(`爬取 ${videoLink.title} 失败:`, err)
        console.error(`失败的URL: ${videoLink.url}`)
        // 即使失败也继续下一个
        setTimeout(() => {
          this.crawlVideoDetails(videoLinks, index + 1)
        }, 1000)
      }
    })
  },

  // 从页面中提取视频URL
  extractVideoUrls: function(html, baseUrl) {
    const videoUrls = []
    
    // 查找 vurl="..." 格式的视频链接
    const vurlRegex = /vurl="([^"]*)"/g
    let match
    
    while ((match = vurlRegex.exec(html)) !== null) {
      let videoUrl = match[1]
      
      // 处理URL
      if (videoUrl.startsWith('/')) {
        videoUrl = 'https://arch.ahnu.edu.cn' + videoUrl
      } else if (!videoUrl.startsWith('http')) {
        videoUrl = baseUrl + videoUrl
      }
      
      videoUrls.push(videoUrl)
    }
    
    // 去重
    return [...new Set(videoUrls)]
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
    
  }
})