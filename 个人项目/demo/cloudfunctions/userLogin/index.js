// 云函数：用户登录
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { code } = event
  const { OPENID, APPID } = cloud.getWXContext()
  
  try {
    // 检查用户是否已存在
    const userQuery = await db.collection('users').where({
      _openid: OPENID
    }).get()
    
    if (userQuery.data.length > 0) {
      // 用户已存在，更新最后登录时间
      const existingUser = userQuery.data[0]
      await db.collection('users').doc(existingUser._id).update({
        data: {
          lastLoginTime: new Date(),
          updateTime: new Date()
        }
      })
      
      return {
        success: true,
        data: existingUser,
        message: '用户登录成功'
      }
    } else {
      // 新用户，创建用户记录
      const newUser = {
        _openid: OPENID,
        nickName: '微信用户',
        avatarUrl: '',
        gender: 0,
        language: 'zh_CN',
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
