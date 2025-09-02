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
        return await createGroup(db, data)
      case 'update':
        return await updateGroup(db, data)
      case 'get':
        return await getGroup(db, data)
      case 'list':
        return await listGroups(db, data)
      case 'join':
        return await joinGroup(db, data)
      case 'leave':
        return await leaveGroup(db, data)
      default:
        return { success: false, error: '未知操作' }
    }
  } catch (error) {
    console.error('群组管理云函数错误:', error)
    return { success: false, error: error.message }
  }
}

// 创建群组
async function createGroup(db, data) {
  const { name, description, creator_id, type, max_members, verification_type, invite_code } = data
  
  // 生成6位随机房间号
  const roomCode = generateRoomCode()
  
  const groupData = {
    name,
    description,
    creator_id,
    type: type || 'public',
    max_members: max_members || 10,
    member_count: 1,
    verification_type: verification_type || 'none',
    invite_code: invite_code || roomCode,
    room_code: roomCode,
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  }
  
  const result = await db.collection('groups').add({
    data: groupData
  })
  
  return {
    success: true,
    data: { _id: result._id, ...groupData }
  }
}

// 更新群组
async function updateGroup(db, data) {
  const { _id, ...updateData } = data
  updateData.updated_at = new Date()
  
  const result = await db.collection('groups').doc(_id).update({
    data: updateData
  })
  
  return {
    success: true,
    data: result
  }
}

// 获取群组
async function getGroup(db, data) {
  const { _id } = data
  
  const result = await db.collection('groups').doc(_id).get()
  
  return {
    success: true,
    data: result.data
  }
}

// 获取群组列表
async function listGroups(db, data) {
  const { creator_id, limit = 20, offset = 0 } = data
  
  let query = db.collection('groups')
  
  if (creator_id) {
    query = query.where({
      creator_id: creator_id
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

// 加入群组
async function joinGroup(db, data) {
  const { group_id, user_id } = data
  
  // 检查群组是否存在
  const groupResult = await db.collection('groups').doc(group_id).get()
  if (!groupResult.data) {
    return { success: false, error: '群组不存在' }
  }
  
  // 检查是否已经是成员
  const memberResult = await db.collection('group_members').where({
    group_id: group_id,
    user_id: user_id
  }).get()
  
  if (memberResult.data.length > 0) {
    return { success: false, error: '已经是群组成员' }
  }
  
  // 添加成员记录
  const memberData = {
    group_id,
    user_id,
    role: 'member',
    join_time: new Date()
  }
  
  await db.collection('group_members').add({
    data: memberData
  })
  
  // 更新群组成员数
  await db.collection('groups').doc(group_id).update({
    data: {
      member_count: db.command.inc(1),
      updated_at: new Date()
    }
  })
  
  return {
    success: true,
    data: memberData
  }
}

// 离开群组
async function leaveGroup(db, data) {
  const { group_id, user_id } = data
  
  // 删除成员记录
  const memberResult = await db.collection('group_members').where({
    group_id: group_id,
    user_id: user_id
  }).get()
  
  if (memberResult.data.length > 0) {
    await db.collection('group_members').doc(memberResult.data[0]._id).remove()
    
    // 更新群组成员数
    await db.collection('groups').doc(group_id).update({
      data: {
        member_count: db.command.inc(-1),
        updated_at: new Date()
      }
    })
  }
  
  return {
    success: true
  }
}

// 生成6位随机房间号
function generateRoomCode() {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
