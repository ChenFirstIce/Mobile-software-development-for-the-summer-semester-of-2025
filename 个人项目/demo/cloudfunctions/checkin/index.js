// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  const { action, data } = event
  
  try {
    switch (action) {
      case 'createPoint':
        return await createCheckinPoint(db, data)
      case 'updatePoint':
        return await updateCheckinPoint(db, data)
      case 'getPoint':
        return await getCheckinPoint(db, data)
      case 'listPoints':
        return await listCheckinPoints(db, data)
      case 'deletePoint':
        return await deleteCheckinPoint(db, data)
      case 'checkin':
        return await createCheckinRecord(db, data)
      case 'getRecords':
        return await getCheckinRecords(db, data)
      default:
        return { success: false, error: '未知操作' }
    }
  } catch (error) {
    console.error('打卡管理云函数错误:', error)
    return { success: false, error: error.message }
  }
}

// 创建打卡点
async function createCheckinPoint(db, data) {
  const { group_id, name, latitude, longitude, address } = data
  
  const pointData = {
    group_id,
    name,
    latitude,
    longitude,
    address: address || '',
    created_at: new Date()
  }
  
  const result = await db.collection('checkin_points').add({
    data: pointData
  })
  
  return {
    success: true,
    data: { _id: result._id, ...pointData }
  }
}

// 更新打卡点
async function updateCheckinPoint(db, data) {
  const { _id, ...updateData } = data
  
  const result = await db.collection('checkin_points').doc(_id).update({
    data: updateData
  })
  
  return {
    success: true,
    data: result
  }
}

// 获取打卡点
async function getCheckinPoint(db, data) {
  const { _id } = data
  
  const result = await db.collection('checkin_points').doc(_id).get()
  
  return {
    success: true,
    data: result.data
  }
}

// 获取打卡点列表
async function listCheckinPoints(db, data) {
  const { group_id, limit = 20, offset = 0 } = data
  
  let query = db.collection('checkin_points')
  
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

// 删除打卡点
async function deleteCheckinPoint(db, data) {
  const { _id } = data
  
  // 删除相关的打卡记录
  await db.collection('checkin_records').where({
    point_id: _id
  }).remove()
  
  // 删除打卡点
  await db.collection('checkin_points').doc(_id).remove()
  
  return {
    success: true
  }
}

// 创建打卡记录
async function createCheckinRecord(db, data) {
  const { point_id, user_id, latitude, longitude, photo_url } = data
  
  const recordData = {
    point_id,
    user_id,
    latitude,
    longitude,
    photo_url: photo_url || '',
    checkin_time: new Date()
  }
  
  const result = await db.collection('checkin_records').add({
    data: recordData
  })
  
  return {
    success: true,
    data: { _id: result._id, ...recordData }
  }
}

// 获取打卡记录
async function getCheckinRecords(db, data) {
  const { point_id, user_id, limit = 20, offset = 0 } = data
  
  let query = db.collection('checkin_records')
  
  if (point_id) {
    query = query.where({
      point_id: point_id
    })
  }
  
  if (user_id) {
    query = query.where({
      user_id: user_id
    })
  }
  
  const result = await query
    .skip(offset)
    .limit(limit)
    .orderBy('checkin_time', 'desc')
    .get()
  
  return {
    success: true,
    data: result.data
  }
}
