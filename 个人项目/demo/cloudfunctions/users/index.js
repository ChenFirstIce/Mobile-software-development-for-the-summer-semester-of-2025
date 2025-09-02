// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  const { action, data } = event
  
  try {
    switch (action) {
      case 'create':
        return await createUser(db, data)
      case 'update':
        return await updateUser(db, data)
      case 'get':
        return await getUser(db, data)
      case 'list':
        return await listUsers(db, data)
      default:
        return { success: false, error: '未知操作' }
    }
  } catch (error) {
    console.error('用户管理云函数错误:', error)
    return { success: false, error: error.message }
  }
}

// 创建用户
async function createUser(db, data) {
  const { openid, unionid, nick_name, avatar_url, gender, phone } = data
  
  const userData = {
    openid,
    unionid,
    nick_name,
    avatar_url,
    gender: gender || 0,
    phone: phone || '',
    status: 'active',
    created_at: new Date()
  }
  
  const result = await db.collection('users').add({
    data: userData
  })
  
  return {
    success: true,
    data: { _id: result._id, ...userData }
  }
}

// 更新用户
async function updateUser(db, data) {
  const { _id, ...updateData } = data
  updateData.updated_at = new Date()
  
  const result = await db.collection('users').doc(_id).update({
    data: updateData
  })
  
  return {
    success: true,
    data: result
  }
}

// 获取用户
async function getUser(db, data) {
  const { openid } = data
  
  const result = await db.collection('users').where({
    openid: openid
  }).get()
  
  return {
    success: true,
    data: result.data[0] || null
  }
}

// 获取用户列表
async function listUsers(db, data) {
  const { limit = 20, offset = 0 } = data
  
  const result = await db.collection('users')
    .skip(offset)
    .limit(limit)
    .get()
  
  return {
    success: true,
    data: result.data
  }
}
