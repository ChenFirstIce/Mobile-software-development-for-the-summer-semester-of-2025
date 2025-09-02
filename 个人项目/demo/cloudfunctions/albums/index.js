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
        return await createAlbum(db, data)
      case 'update':
        return await updateAlbum(db, data)
      case 'get':
        return await getAlbum(db, data)
      case 'list':
        return await listAlbums(db, data)
      case 'delete':
        return await deleteAlbum(db, data)
      default:
        return { success: false, error: '未知操作' }
    }
  } catch (error) {
    console.error('相册管理云函数错误:', error)
    return { success: false, error: error.message }
  }
}

// 创建相册
async function createAlbum(db, data) {
  const { group_id, name, creator_id } = data
  
  const albumData = {
    group_id,
    name,
    creator_id,
    photo_count: 0,
    created_at: new Date(),
    updated_at: new Date()
  }
  
  const result = await db.collection('albums').add({
    data: albumData
  })
  
  return {
    success: true,
    data: { _id: result._id, ...albumData }
  }
}

// 更新相册
async function updateAlbum(db, data) {
  const { _id, ...updateData } = data
  updateData.updated_at = new Date()
  
  const result = await db.collection('albums').doc(_id).update({
    data: updateData
  })
  
  return {
    success: true,
    data: result
  }
}

// 获取相册
async function getAlbum(db, data) {
  const { _id } = data
  
  const result = await db.collection('albums').doc(_id).get()
  
  return {
    success: true,
    data: result.data
  }
}

// 获取相册列表
async function listAlbums(db, data) {
  const { group_id, limit = 20, offset = 0 } = data
  
  let query = db.collection('albums')
  
  if (group_id) {
    query = query.where({
      group_id: group_id
    })
  }
  
  const result = await query
    .skip(offset)
    .limit(limit)
    .orderBy('created_at', 'desc')
    .get()
  
  return {
    success: true,
    data: result.data
  }
}

// 删除相册
async function deleteAlbum(db, data) {
  const { _id } = data
  
  // 删除相册下的所有照片
  await db.collection('photos').where({
    album_id: _id
  }).remove()
  
  // 删除相册
  await db.collection('albums').doc(_id).remove()
  
  return {
    success: true
  }
}
