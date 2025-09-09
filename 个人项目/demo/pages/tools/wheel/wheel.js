// pages/tools/wheel/wheel.js
var util = require('../../../utils/util.js')
var app = getApp();

function randomsort(a, b) {
   return Math.random() > .5 ? -1 : 1;
}

Page({
  data: {
    size: { //转盘大小可配置
      w: 599,
      h: 600
    },
    fastJuedin: false,
    repeat: false,
    s_awards: '？',//结果
    share: true,
    groupId: null,
    currentGroup: null,
    hasWheel: false, // 是否有转盘
    // 群组协作相关
    completedMembers: 0,
    isMemberCompleted: {},
    incompleteMembers: [],
    showMembersModal: false,
    // 转盘编辑相关
    showEditModal: false,
    editTitle: '',
    editOptions: []
  },

  onLoad: function (options) {
    console.log('=========onload============');
    this.zhuanpan = this.selectComponent("#zhuanpan");
    
    // 获取群组ID
    if (options.groupId) {
      this.setData({
        groupId: options.groupId
      })
      this.loadGroupInfo()
      this.loadGroupWheel()
    } else {
      wx.showToast({
        title: '缺少群组信息',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  onShow: function () {
    console.log('============onShow============');
    var that = this;

    that.setData({
      fastJuedin: false,
      repeat: false,
    })

    // 重新加载群组转盘
    if (that.data.groupId) {
      that.loadGroupWheel()
      that.updateMemberStatus()
    }
  },

  // 加载群组信息
  loadGroupInfo: function() {
    const groups = wx.getStorageSync('groups') || []
    const group = groups.find(g => g.id === this.data.groupId)
    if (group) {
      this.setData({
        currentGroup: group
      })
      this.updateMemberStatus()
    }
  },

  // 加载群组转盘
  loadGroupWheel: function() {
    const groupWheels = wx.getStorageSync('groupWheels') || {}
    const groupWheel = groupWheels[this.data.groupId]
    
    if (groupWheel && groupWheel.length > 0) {
      // 有转盘，切换到群组转盘
      const wheel = groupWheel[0]
      
      // 使用安全方法切换转盘
      const switchSuccess = this.safeSwitchZhuanpan(wheel, true)
      
      if (!switchSuccess) {
        // 如果组件还没有准备好，延迟一下再尝试
        setTimeout(() => {
          this.safeSwitchZhuanpan(wheel, true)
        }, 100)
      }
      
      this.setData({
        hasWheel: true,
        awardsConfig: wheel // 直接设置转盘配置
      })
    } else {
      // 没有转盘，显示空状态
      this.setData({
        hasWheel: false,
        awardsConfig: null
      })
    }
  },

  // 重新开始转盘
  restartWheel: function() {
    wx.showModal({
      title: '重新开始',
      content: '确定要重新开始转盘吗？这将清空所有成员的贡献记录。',
      success: (res) => {
        if (res.confirm) {
          // 清空群组转盘
          const groupWheels = wx.getStorageSync('groupWheels') || {}
          delete groupWheels[this.data.groupId]
          wx.setStorageSync('groupWheels', groupWheels)
          
          // 清空贡献记录
          const wheelContributions = wx.getStorageSync('wheelContributions') || {}
          delete wheelContributions[this.data.groupId]
          wx.setStorageSync('wheelContributions', wheelContributions)
          
          // 重置状态
          this.setData({
            hasWheel: false,
            completedMembers: 0,
            isMemberCompleted: {},
            incompleteMembers: this.data.currentGroup ? this.data.currentGroup.members : []
          })
          
          wx.showToast({
            title: '已重新开始',
            icon: 'success'
          })
        }
      }
    })
  },

  // 更新成员完成状态
  updateMemberStatus: function() {
    const group = this.data.currentGroup
    if (!group) return

    const wheelContributions = wx.getStorageSync('wheelContributions') || {}
    const groupContributions = wheelContributions[group.id] || {}
    
    let completedCount = 0
    const isMemberCompleted = {}
    const incompleteMembers = []

    group.members.forEach(member => {
      const hasContributed = groupContributions[member.id] || false
      isMemberCompleted[member.id] = hasContributed
      if (hasContributed) {
        completedCount++
      } else {
        incompleteMembers.push(member)
      }
    })

    this.setData({
      completedMembers: completedCount,
      isMemberCompleted: isMemberCompleted,
      incompleteMembers: incompleteMembers
    })
  },

  // 标记成员已贡献
  markMemberContributed: function() {
    const group = this.data.currentGroup
    if (!group) return

    const currentUser = wx.getStorageSync('userInfo') || { id: 'anonymous' }
    const wheelContributions = wx.getStorageSync('wheelContributions') || {}
    
    if (!wheelContributions[group.id]) {
      wheelContributions[group.id] = {}
    }
    
    wheelContributions[group.id][currentUser.id] = true
    wx.setStorageSync('wheelContributions', wheelContributions)
    
    this.updateMemberStatus()
  },

  // 显示未完成成员列表
  showIncompleteMembers: function() {
    this.setData({
      showMembersModal: true
    })
  },

  // 隐藏未完成成员列表
  hideMembersModal: function() {
    this.setData({
      showMembersModal: false
    })
  },

  // 编辑转盘内容
  editWheel: function() {
    const currentConfig = this.data.awardsConfig
    if (currentConfig) {
      // 编辑现有转盘
      this.setData({
        showEditModal: true,
        editTitle: currentConfig.option,
        editOptions: currentConfig.awards.map(award => award.name)
      })
    } else {
      // 创建新转盘
      this.setData({
        showEditModal: true,
        editTitle: '',
        editOptions: ['选项1', '选项2']
      })
    }
  },

  // 隐藏编辑弹窗
  hideEditModal: function() {
    this.setData({
      showEditModal: false
    })
  },

  // 保存转盘编辑
  saveWheelEdit: function() {
    const { editTitle, editOptions, groupId } = this.data
    
    if (!editTitle.trim()) {
      wx.showToast({
        title: '请输入转盘标题',
        icon: 'none'
      })
      return
    }

    if (editOptions.length < 2) {
      wx.showToast({
        title: '至少需要2个选项',
        icon: 'none'
      })
      return
    }

    // 定义颜色数组
    const colorArr = [
      '#EE534F',
      '#FF7F50', 
      '#FFC928',
      '#66BB6A',
      '#42A5F5',
      '#5C6BC0',
      '#AA47BC',
      '#EC407A',
      '#FFB6C1',
      '#FFA827'
    ]

    // 创建新的转盘配置（一个群组只能有一个转盘）
    const newWheelConfig = {
      id: groupId, // 使用群组ID作为转盘ID，确保一个群组只有一个转盘
      groupId: groupId,
      option: editTitle,
      awards: editOptions.map((option, index) => ({
        id: index,
        name: option,
        color: colorArr[index % colorArr.length],
        probability: 0
      })),
      createdAt: new Date().toISOString(),
      createdBy: wx.getStorageSync('userInfo').id || 'unknown'
    }

    // 保存到群组转盘配置（覆盖现有转盘）
    const groupWheels = wx.getStorageSync('groupWheels') || {}
    groupWheels[groupId] = [newWheelConfig] // 直接覆盖，确保只有一个转盘
    wx.setStorageSync('groupWheels', groupWheels)

    // 更新当前转盘（使用安全方法）
    const switchSuccess = this.safeSwitchZhuanpan(newWheelConfig, true)
    
    if (!switchSuccess) {
      // 如果组件还没有准备好，延迟一下再尝试
      setTimeout(() => {
        this.safeSwitchZhuanpan(newWheelConfig, true)
      }, 100)
    }

    // 标记当前成员已贡献
    this.markMemberContributed()

    this.setData({
      showEditModal: false,
      hasWheel: true,
      awardsConfig: newWheelConfig // 直接设置转盘配置
    })

    wx.showToast({
      title: '保存成功',
      icon: 'success'
    })
  },

  // 输入转盘标题
  onTitleInput: function(e) {
    this.setData({
      editTitle: e.detail.value
    })
  },

  // 输入转盘选项
  onOptionInput: function(e) {
    const index = e.currentTarget.dataset.index
    const value = e.detail.value
    const editOptions = [...this.data.editOptions]
    editOptions[index] = value
    this.setData({
      editOptions: editOptions
    })
  },

  // 添加选项
  addOption: function() {
    const editOptions = [...this.data.editOptions, '']
    this.setData({
      editOptions: editOptions
    })
  },

  // 删除选项
  removeOption: function(e) {
    const index = e.currentTarget.dataset.index
    const editOptions = [...this.data.editOptions]
    if (editOptions.length > 2) {
      editOptions.splice(index, 1)
      this.setData({
        editOptions: editOptions
      })
    } else {
      wx.showToast({
        title: '至少需要2个选项',
        icon: 'none'
      })
    }
  },

  //接收当前转盘初始化时传来的参数
  getData(e) {
    this.setData({
      awardsConfig: e.detail,
    })
  },

  //接收当前转盘结束后的答案选项
  getAwards(e) {
    this.setData({ 
      s_awards: e.detail.end ? "？" : e.detail.s_awards,
      share: e.detail.end ? true : false,
    })
  },

  //开始转
  startZhuan(e) {
    this.setData({
        zhuanflg: e.detail ? true : false
    })
  },




  onShareAppMessage: function () {
    let that = this;
    var picNum = Math.floor(Math.random() * 4 + 1);//获取1-4的随机数，用于随机展示分享图片

    return {
      title: "一起来抽'" + that.data.awardsConfig.option + "'吧",
      path: '/pages/tools/wheel/wheel',
      success: function (res) {
        console.log('成功进入分享==========', res);
      },
      fail: function (res) {
        console.log('进入分享失败==========', res);
      }
    }
  },


  // 加载自定义转盘
  loadCustomWheel: function(wheelId) {
    const wheels = wx.getStorageSync('wheels') || []
    const wheel = wheels.find(w => w.id === wheelId)
    if (wheel) {
      // 切换到自定义转盘
      setTimeout(() => {
        this.safeSwitchZhuanpan(wheel, true)
      }, 500)
    }
  },

  // 安全地获取转盘组件
  getZhuanpanComponent: function() {
    if (!this.zhuanpan) {
      this.zhuanpan = this.selectComponent("#zhuanpan")
    }
    return this.zhuanpan
  },

  // 安全地切换转盘
  safeSwitchZhuanpan: function(wheelConfig, reset = false) {
    const zhuanpan = this.getZhuanpanComponent()
    if (zhuanpan && zhuanpan.switchZhuanpan) {
      zhuanpan.switchZhuanpan(wheelConfig, reset)
      return true
    }
    return false
  }
})
