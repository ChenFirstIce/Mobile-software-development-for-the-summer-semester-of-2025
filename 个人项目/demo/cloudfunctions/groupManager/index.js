// 云函数：群组管理
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { action, groupData, groupId, memberData } = event
  const { OPENID } = cloud.getWXContext()
  
  try {
    switch (action) {
      case 'create':
        return await createGroup(groupData, OPENID)
      case 'update':
        return await updateGroup(groupId, groupData, OPENID)
      case 'delete':
        return await deleteGroup(groupId, OPENID)
      case 'getList':
        return await getGroupList(OPENID)
      case 'getDetail':
        return await getGroupDetail(groupId, OPENID)
      case 'join':
        return await joinGroup(groupId, OPENID)
      case 'leave':
        return await leaveGroup(groupId, OPENID)
      case 'addMember':
        return await addMember(groupId, memberData, OPENID)
      case 'removeMember':
        return await removeMember(groupId, memberData, OPENID)
      case 'updateMemberRole':
        return await updateMemberRole(groupId, memberData, OPENID)
      case 'searchByRoomCode':
        return await searchGroupByRoomCode(event.roomCode, OPENID)
      case 'joinByRoomCode':
        return await joinGroupByRoomCode(event.roomCode, OPENID)
      default:
        return {
          success: false,
          message: '未知操作类型'
        }
    }
  } catch (error) {
    console.error('群组管理失败:', error)
    return {
      success: false,
      message: '操作失败: ' + error.message
    }
  }
}

// 创建群组
async function createGroup(groupData, openid) {
  // 获取用户信息
  const user = await db.collection('users').where({
    _openid: openid
  }).get()
  
  if (user.data.length === 0) {
    return {
      success: false,
      message: '用户不存在'
    }
  }
  
  const userInfo = user.data[0]
  
  // 生成房间号
  const roomCode = generateRoomCode()
  
  const group = {
    ...groupData,
    creatorId: openid,
    creatorName: userInfo.nickName,
    roomCode: roomCode,
    memberCount: 1,
    members: [{
      userId: openid,
      nickName: userInfo.nickName,
      avatarUrl: userInfo.avatarUrl || '',
      role: 'creator',
      joinTime: new Date()
    }],
    createTime: new Date(),
    updateTime: new Date(),
    status: 'active'
  }
  
  const result = await db.collection('groups').add({
    data: group
  })
  
  return {
    success: true,
    data: {
      ...group,
      _id: result._id
    },
    message: '群组创建成功'
  }
}

// 更新群组
async function updateGroup(groupId, groupData, openid) {
  // 检查权限
  const group = await db.collection('groups').doc(groupId).get()
  if (!group.data) {
    return {
      success: false,
      message: '群组不存在'
    }
  }
  
  // 只有创建者可以更新群组信息
  if (group.data.creatorId !== openid) {
    return {
      success: false,
      message: '无编辑权限'
    }
  }
  
  const updateData = {
    ...groupData,
    updateTime: new Date()
  }
  
  await db.collection('groups').doc(groupId).update({
    data: updateData
  })
  
  return {
    success: true,
    message: '群组更新成功'
  }
}

// 删除群组
async function deleteGroup(groupId, openid) {
  // 检查权限
  const group = await db.collection('groups').doc(groupId).get()
  if (!group.data) {
    return {
      success: false,
      message: '群组不存在'
    }
  }
  
  // 只有创建者可以删除群组
  if (group.data.creatorId !== openid) {
    return {
      success: false,
      message: '无删除权限'
    }
  }
  
  // 删除群组
  await db.collection('groups').doc(groupId).remove()
  
  // 删除群组相关的相册
  const albums = await db.collection('albums').where({
    groupId: groupId
  }).get()
  
  if (albums.data.length > 0) {
    // 逐个删除相册（避免使用batch）
    for (const album of albums.data) {
      try {
        await db.collection('albums').doc(album._id).remove()
      } catch (error) {
        console.error('删除相册失败:', album._id, error)
      }
    }
  }
  
  // 删除群组相关的照片
  const photos = await db.collection('photos').where({
    groupId: groupId
  }).get()
  
  if (photos.data.length > 0) {
    // 逐个删除照片（避免使用batch）
    for (const photo of photos.data) {
      try {
        await db.collection('photos').doc(photo._id).remove()
      } catch (error) {
        console.error('删除照片失败:', photo._id, error)
      }
    }
  }
  
  return {
    success: true,
    message: '群组删除成功'
  }
}

// 获取群组列表
async function getGroupList(openid) {
  const result = await db.collection('groups')
    .where(db.command.or([
      { creatorId: openid },
      { 
        'members.userId': openid,
        status: 'active'
      }
    ]))
    .orderBy('updateTime', 'desc')
    .get()
  
  return {
    success: true,
    data: result.data,
    message: '获取群组列表成功'
  }
}

// 获取群组详情
async function getGroupDetail(groupId, openid) {
  const group = await db.collection('groups').doc(groupId).get()
  
  if (!group.data) {
    return {
      success: false,
      message: '群组不存在'
    }
  }
  
  // 检查是否是群组成员
  const isMember = group.data.creatorId === openid || 
    group.data.members.some(member => member.userId === openid)
  
  if (!isMember) {
    return {
      success: false,
      message: '无查看权限'
    }
  }
  
  return {
    success: true,
    data: group.data,
    message: '获取群组详情成功'
  }
}

// 加入群组
async function joinGroup(groupId, openid) {
  // 获取用户信息
  const user = await db.collection('users').where({
    _openid: openid
  }).get()
  
  if (user.data.length === 0) {
    return {
      success: false,
      message: '用户不存在'
    }
  }
  
  const userInfo = user.data[0]
  
  // 获取群组信息
  const group = await db.collection('groups').doc(groupId).get()
  if (!group.data) {
    return {
      success: false,
      message: '群组不存在'
    }
  }
  
  // 检查是否已经是成员
  const isAlreadyMember = group.data.members.some(member => member.userId === openid)
  if (isAlreadyMember) {
    return {
      success: false,
      message: '您已经是群组成员'
    }
  }
  
  // 检查群组人数限制
  if (group.data.memberCount >= group.data.maxMembers) {
    return {
      success: false,
      message: '群组人数已满'
    }
  }
  
  // 添加成员
  const newMember = {
    userId: openid,
    nickName: userInfo.nickName,
    avatarUrl: userInfo.avatarUrl || '',
    role: 'member',
    joinTime: new Date()
  }
  
  await db.collection('groups').doc(groupId).update({
    data: {
      members: db.command.push(newMember),
      memberCount: db.command.inc(1),
      updateTime: new Date()
    }
  })
  
  return {
    success: true,
    message: '成功加入群组'
  }
}

// 退出群组
async function leaveGroup(groupId, openid) {
  // 获取群组信息
  const group = await db.collection('groups').doc(groupId).get()
  if (!group.data) {
    return {
      success: false,
      message: '群组不存在'
    }
  }
  
  // 检查是否是群组成员
  const memberIndex = group.data.members.findIndex(member => member.userId === openid)
  if (memberIndex === -1) {
    return {
      success: false,
      message: '您不是群组成员'
    }
  }
  
  // 创建者不能退出群组，只能解散
  if (group.data.creatorId === openid) {
    return {
      success: false,
      message: '群主不能退出群组，请解散群组'
    }
  }
  
  // 移除成员
  const updatedMembers = group.data.members.filter(member => member.userId !== openid)
  
  await db.collection('groups').doc(groupId).update({
    data: {
      members: updatedMembers,
      memberCount: db.command.inc(-1),
      updateTime: new Date()
    }
  })
  
  return {
    success: true,
    message: '成功退出群组'
  }
}

// 添加成员
async function addMember(groupId, memberData, openid) {
  // 检查权限
  const group = await db.collection('groups').doc(groupId).get()
  if (!group.data) {
    return {
      success: false,
      message: '群组不存在'
    }
  }
  
  // 只有创建者和管理员可以添加成员
  const member = group.data.members.find(m => m.userId === openid)
  if (group.data.creatorId !== openid && (!member || member.role === 'member')) {
    return {
      success: false,
      message: '无添加成员权限'
    }
  }
  
  // 检查群组人数限制
  if (group.data.memberCount >= group.data.maxMembers) {
    return {
      success: false,
      message: '群组人数已满'
    }
  }
  
  // 添加成员
  const newMember = {
    ...memberData,
    joinTime: new Date()
  }
  
  await db.collection('groups').doc(groupId).update({
    data: {
      members: db.command.push(newMember),
      memberCount: db.command.inc(1),
      updateTime: new Date()
    }
  })
  
  return {
    success: true,
    message: '成功添加成员'
  }
}

// 移除成员
async function removeMember(groupId, memberData, openid) {
  // 检查权限
  const group = await db.collection('groups').doc(groupId).get()
  if (!group.data) {
    return {
      success: false,
      message: '群组不存在'
    }
  }
  
  // 只有创建者和管理员可以移除成员
  const member = group.data.members.find(m => m.userId === openid)
  if (group.data.creatorId !== openid && (!member || member.role === 'member')) {
    return {
      success: false,
      message: '无移除成员权限'
    }
  }
  
  // 移除成员
  const updatedMembers = group.data.members.filter(m => m.userId !== memberData.userId)
  
  await db.collection('groups').doc(groupId).update({
    data: {
      members: updatedMembers,
      memberCount: db.command.inc(-1),
      updateTime: new Date()
    }
  })
  
  return {
    success: true,
    message: '成功移除成员'
  }
}

// 更新成员角色
async function updateMemberRole(groupId, memberData, openid) {
  // 检查权限
  const group = await db.collection('groups').doc(groupId).get()
  if (!group.data) {
    return {
      success: false,
      message: '群组不存在'
    }
  }
  
  // 只有创建者可以更新成员角色
  if (group.data.creatorId !== openid) {
    return {
      success: false,
      message: '无更新角色权限'
    }
  }
  
  // 更新成员角色
  const updatedMembers = group.data.members.map(member => {
    if (member.userId === memberData.userId) {
      return {
        ...member,
        role: memberData.role
      }
    }
    return member
  })
  
  await db.collection('groups').doc(groupId).update({
    data: {
      members: updatedMembers,
      updateTime: new Date()
    }
  })
  
  return {
    success: true,
    message: '成功更新成员角色'
  }
}

// 通过房间号搜索群组
async function searchGroupByRoomCode(roomCode, openid) {
  try {
    // 通过房间号查找群组
    const result = await db.collection('groups')
      .where({
        roomCode: roomCode,
        status: 'active'
      })
      .get()
    
    if (result.data.length === 0) {
      return {
        success: false,
        message: '房间号不存在或群组已解散'
      }
    }
    
    const group = result.data[0]
    
    // 检查用户是否已经是群组成员
    const isAlreadyMember = group.creatorId === openid || 
      group.members.some(member => member.userId === openid)
    
    return {
      success: true,
      data: {
        groupId: group._id,
        name: group.name,
        description: group.description,
        memberCount: group.memberCount,
        maxMembers: group.maxMembers,
        hasVerifyCode: !!group.verifyCode,
        isAlreadyMember: isAlreadyMember,
        creatorName: group.creatorName
      },
      message: '找到群组'
    }
  } catch (error) {
    console.error('搜索群组失败:', error)
    return {
      success: false,
      message: '搜索失败: ' + error.message
    }
  }
}

// 通过房间号加入群组
async function joinGroupByRoomCode(roomCode, openid) {
  try {
    // 获取用户信息
    const user = await db.collection('users').where({
      _openid: openid
    }).get()
    
    if (user.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      }
    }
    
    const userInfo = user.data[0]
    
    // 通过房间号查找群组
    const result = await db.collection('groups')
      .where({
        roomCode: roomCode,
        status: 'active'
      })
      .get()
    
    if (result.data.length === 0) {
      return {
        success: false,
        message: '房间号不存在或群组已解散'
      }
    }
    
    const group = result.data[0]
    
    // 检查是否已经是成员
    const isAlreadyMember = group.creatorId === openid || 
      group.members.some(member => member.userId === openid)
    
    if (isAlreadyMember) {
      return {
        success: false,
        message: '您已经是群组成员'
      }
    }
    
    // 检查群组人数限制
    if (group.memberCount >= group.maxMembers) {
      return {
        success: false,
        message: '群组人数已满'
      }
    }
    
    // 添加成员
    const newMember = {
      userId: openid,
      nickName: userInfo.nickName,
      avatarUrl: userInfo.avatarUrl || '',
      role: 'member',
      joinTime: new Date()
    }
    
    await db.collection('groups').doc(group._id).update({
      data: {
        members: db.command.push(newMember),
        memberCount: db.command.inc(1),
        updateTime: new Date()
      }
    })
    
    return {
      success: true,
      data: {
        groupId: group._id,
        groupName: group.name
      },
      message: '成功加入群组'
    }
  } catch (error) {
    console.error('加入群组失败:', error)
    return {
      success: false,
      message: '加入失败: ' + error.message
    }
  }
}

// 生成房间号
function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
