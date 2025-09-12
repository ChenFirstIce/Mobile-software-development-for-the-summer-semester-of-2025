// 云函数：用户登录
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { code, userInfo } = event
  const { OPENID, APPID } = cloud.getWXContext()
  
  try {
    // 检查用户是否已存在
    const userQuery = await db.collection('users').where({
      _openid: OPENID
    }).get()
    
    if (userQuery.data.length > 0) {
      // 用户已存在，更新用户信息和最后登录时间
      const existingUser = userQuery.data[0]
      
      // 如果传入了用户信息，则更新用户信息
      const updateData = {
        lastLoginTime: new Date(),
        updateTime: new Date()
      }
      
      if (userInfo) {
        updateData.nickName = userInfo.nickName || existingUser.nickName
        updateData.avatarUrl = userInfo.avatarUrl || existingUser.avatarUrl
        updateData.gender = userInfo.gender !== undefined ? userInfo.gender : existingUser.gender
        updateData.language = userInfo.language || existingUser.language
      }
      
      await db.collection('users').doc(existingUser._id).update({
        data: updateData
      })
      
      // 返回更新后的用户信息
      const updatedUser = {
        ...existingUser,
        ...updateData
      }
      
      return {
        success: true,
        data: updatedUser,
        message: '用户登录成功'
      }
    } else {
      // 新用户，创建用户记录
      const newUser = {
        _openid: OPENID,
        nickName: userInfo ? userInfo.nickName : '微信用户',
        avatarUrl: userInfo ? userInfo.avatarUrl : '',
        gender: userInfo ? userInfo.gender : 0,
        language: userInfo ? userInfo.language : 'zh_CN',
        createTime: new Date(),
        updateTime: new Date(),
        lastLoginTime: new Date(),
        status: 'active',
        preferences: {
          theme: 'light',
          language: 'zh_CN',
          notifications: true
        }
      }
      
      const result = await db.collection('users').add({
        data: newUser
      })
      
      const userWithId = {
        ...newUser,
        _id: result._id
      }
      
      return {
        success: true,
        data: userWithId,
        message: '新用户注册成功'
      }
    }
  } catch (error) {
    console.error('用户登录失败:', error)
    return {
      success: false,
      message: '登录失败: ' + error.message
    }
  }
}
