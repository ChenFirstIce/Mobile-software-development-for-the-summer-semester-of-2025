// 云函数：更新用户信息
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { userInfo } = event
  const { OPENID } = cloud.getWXContext()
  
  try {
    // 查找用户记录
    const userQuery = await db.collection('users').where({
      _openid: OPENID
    }).get()
    
    if (userQuery.data.length === 0) {
      return {
        success: false,
        message: '用户不存在，请先登录'
      }
    }
    
    const existingUser = userQuery.data[0]
    
    // 更新用户信息
    const updateData = {
      nickName: userInfo.nickName || existingUser.nickName,
      avatarUrl: userInfo.avatarUrl || existingUser.avatarUrl,
      gender: userInfo.gender !== undefined ? userInfo.gender : existingUser.gender,
      language: userInfo.language || existingUser.language,
      updateTime: new Date()
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
      message: '用户信息更新成功'
    }
  } catch (error) {
    console.error('更新用户信息失败:', error)
    return {
      success: false,
      message: '更新用户信息失败: ' + error.message
    }
  }
}
