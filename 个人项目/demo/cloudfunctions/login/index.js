// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  
  try {
    const { openid, appid, unionid } = wxContext
    const { userInfo } = event // 从前端传入的用户信息
    
    // 查找用户是否已存在
    const userResult = await db.collection('users').where({
      openid: openid
    }).get()
    
    let user = null
    
    if (userResult.data.length === 0) {
      // 新用户，创建用户记录
      const newUser = {
        openid: openid,
        appid: appid,
        unionid: unionid,
        nickName: userInfo ? userInfo.nickName : '',
        avatarUrl: userInfo ? userInfo.avatarUrl : '',
        gender: userInfo ? userInfo.gender : 0,
        country: userInfo ? userInfo.country : '',
        province: userInfo ? userInfo.province : '',
        city: userInfo ? userInfo.city : '',
        language: userInfo ? userInfo.language : '',
        createTime: new Date(),
        updateTime: new Date(),
        lastLoginTime: new Date()
      }
      
      const addResult = await db.collection('users').add({
        data: newUser
      })
      
      user = {
        ...newUser,
        _id: addResult._id
      }
    } else {
      // 老用户，更新登录时间
      user = userResult.data[0]
      
      // 更新用户信息（如果有新的用户信息）
      if (userInfo) {
        await db.collection('users').doc(user._id).update({
          data: {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl,
            gender: userInfo.gender,
            country: userInfo.country,
            province: userInfo.province,
            city: userInfo.city,
            language: userInfo.language,
            updateTime: new Date(),
            lastLoginTime: new Date()
          }
        })
        
        // 更新返回的用户信息
        user = {
          ...user,
          ...userInfo,
          updateTime: new Date(),
          lastLoginTime: new Date()
        }
      } else {
        // 只更新登录时间
        await db.collection('users').doc(user._id).update({
          data: {
            lastLoginTime: new Date()
          }
        })
      }
    }
    
    return {
      success: true,
      openid: openid,
      appid: appid,
      unionid: unionid,
      user: user
    }
    
  } catch (error) {
    console.error('登录失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}