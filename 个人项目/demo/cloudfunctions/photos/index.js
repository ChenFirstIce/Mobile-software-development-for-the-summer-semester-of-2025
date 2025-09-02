// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  const { action, data } = event
  
  try {
    switch (action) {
      case 'upload':
        return await uploadPhoto(db, data)
      case 'get':
        return await getPhoto(db, data)
      case 'list':
        return await listPhotos(db, data)
      case 'delete':
        return await deletePhoto(db, data)
      default:
        return { success: false, error: '未知操作' }
    }
  } catch (error) {
    console.error('照片管理云函数错误:', error)
    return { success: false, error: error.message }
  }
}

// 上传照片
async function uploadPhoto(db, data) {
  const { album_id, uploader_id, file_url, location } = data
  
  const photoData = {
    album_id,
    uploader_id,
    file_url,
    location: location || '',
    created_at: new Date()
  }
  
  const result = await db.collection('photos').add({
    data: photoData
  })
  
  // 更新相册照片数量
  await db.collection('albums').where({
    _id: album_id
  }).update({
    data: {
      photo_count: db.command.inc(1),
      updated_at: new Date()
    }
  })
  
  return {
    success: true,
    data: { _id: result._id, ...photoData }
  }
}

// 获取照片
async function getPhoto(db, data) {
  const { _id } = data
  
  const result = await db.collection('photos').doc(_id).get()
  
  return {
    success: true,
    data: result.data
  }
}

// 获取照片列表
async function listPhotos(db, data) {
  const { album_id, limit = 20, offset = 0 } = data
  
  let query = db.collection('photos')
  
  if (album_id) {
    query = query.where({
      album_id: album_id
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

// 删除照片
async function deletePhoto(db, data) {
  const { _id, album_id } = data
  
  await db.collection('photos').doc(_id).remove()
  
  // 更新相册照片数量
  if (album_id) {
    await db.collection('albums').where({
      _id: album_id
    }).update({
      data: {
        photo_count: db.command.inc(-1),
        updated_at: new Date()
      }
    })
  }
  
  return {
    success: true
  }
}
