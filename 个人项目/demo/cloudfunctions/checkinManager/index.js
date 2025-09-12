// 打卡管理云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { action } = event
  const { OPENID } = cloud.getWXContext()

  try {
    switch (action) {
      case 'create':
        return await createCheckin(event, OPENID)
      case 'getList':
        return await getCheckinList(event, OPENID)
      case 'getDetail':
        return await getCheckinDetail(event, OPENID)
      case 'update':
        return await updateCheckin(event, OPENID)
      case 'delete':
        return await deleteCheckin(event, OPENID)
      case 'getByLocation':
        return await getCheckinsByLocation(event, OPENID)
      case 'getUserStats':
        return await getUserCheckinStats(event, OPENID)
      default:
        return {
          success: false,
          message: '未知操作类型'
        }
    }
  } catch (error) {
    console.error('打卡管理云函数错误:', error)
    return {
      success: false,
      message: '服务器错误: ' + error.message
    }
  }
}

// 创建打卡记录
async function createCheckin(event, openid) {
  const {
    longitude,
    latitude,
    address,
    content,
    photos,
    tags,
    albumId,
    albumName,
    privacy = 'public'
  } = event

  // 验证必填字段
  if (!address) {
    return {
      success: false,
      message: '地址信息不能为空'
    }
  }

  // 获取用户信息
  const userQuery = await db.collection('users').where({ _openid: openid }).get()
  if (userQuery.data.length === 0) {
    return {
      success: false,
      message: '用户不存在，请先登录'
    }
  }
  const user = userQuery.data[0]

  // 创建打卡记录
  const checkinData = {
    _openid: openid,
    userId: openid,
    userName: user.nickName || '未知用户',
    userAvatar: user.avatarUrl || '',
    longitude: longitude || null,
    latitude: latitude || null,
    address: address,
    content: content || '',
    photos: photos || [],
    tags: tags || [],
    albumId: albumId || null,
    albumName: albumName || null,
    privacy: privacy,
    createTime: new Date(),
    updateTime: new Date(),
    likeCount: 0,
    commentCount: 0,
    isDeleted: false
  }

  const result = await db.collection('checkins').add({
    data: checkinData
  })

  return {
    success: true,
    data: {
      _id: result._id,
      ...checkinData
    },
    message: '打卡成功'
  }
}

// 获取打卡列表
async function getCheckinList(event, openid) {
  const {
    page = 1,
    pageSize = 20,
    userId = null,
    privacy = 'all',
    albumId = null,
    tags = null
  } = event

  let whereCondition = {
    isDeleted: false
  }

  // 根据用户ID筛选
  if (userId) {
    whereCondition.userId = userId
  }

  // 根据隐私设置筛选
  if (privacy === 'public') {
    whereCondition.privacy = 'public'
  } else if (privacy === 'private') {
    whereCondition.userId = openid
  }

  // 根据相册ID筛选
  if (albumId) {
    whereCondition.albumId = albumId
  }

  // 根据标签筛选
  if (tags && tags.length > 0) {
    whereCondition.tags = db.command.in(tags)
  }

  try {
    const result = await db.collection('checkins')
      .where(whereCondition)
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    // 获取总数
    const countResult = await db.collection('checkins')
      .where(whereCondition)
      .count()

    return {
      success: true,
      data: {
        list: result.data,
        total: countResult.total,
        page: page,
        pageSize: pageSize
      },
      message: '获取打卡列表成功'
    }
  } catch (error) {
    console.error('获取打卡列表失败:', error)
    return {
      success: false,
      message: '获取打卡列表失败'
    }
  }
}

// 获取打卡详情
async function getCheckinDetail(event, openid) {
  const { checkinId } = event

  if (!checkinId) {
    return {
      success: false,
      message: '打卡ID不能为空'
    }
  }

  try {
    const result = await db.collection('checkins')
      .doc(checkinId)
      .get()

    if (result.data.length === 0) {
      return {
        success: false,
        message: '打卡记录不存在'
      }
    }

    const checkin = result.data[0]

    // 检查权限
    if (checkin.privacy === 'private' && checkin.userId !== openid) {
      return {
        success: false,
        message: '无权限查看此打卡记录'
      }
    }

    return {
      success: true,
      data: checkin,
      message: '获取打卡详情成功'
    }
  } catch (error) {
    console.error('获取打卡详情失败:', error)
    return {
      success: false,
      message: '获取打卡详情失败'
    }
  }
}

// 更新打卡记录
async function updateCheckin(event, openid) {
  const {
    checkinId,
    content,
    photos,
    tags,
    albumId,
    albumName,
    privacy
  } = event

  if (!checkinId) {
    return {
      success: false,
      message: '打卡ID不能为空'
    }
  }

  try {
    // 检查打卡记录是否存在
    const checkinQuery = await db.collection('checkins').doc(checkinId).get()
    if (checkinQuery.data.length === 0) {
      return {
        success: false,
        message: '打卡记录不存在'
      }
    }

    const checkin = checkinQuery.data[0]

    // 检查权限
    if (checkin.userId !== openid) {
      return {
        success: false,
        message: '无权限修改此打卡记录'
      }
    }

    // 构建更新数据
    const updateData = {
      updateTime: new Date()
    }

    if (content !== undefined) updateData.content = content
    if (photos !== undefined) updateData.photos = photos
    if (tags !== undefined) updateData.tags = tags
    if (albumId !== undefined) updateData.albumId = albumId
    if (albumName !== undefined) updateData.albumName = albumName
    if (privacy !== undefined) updateData.privacy = privacy

    await db.collection('checkins').doc(checkinId).update({
      data: updateData
    })

    return {
      success: true,
      message: '更新打卡记录成功'
    }
  } catch (error) {
    console.error('更新打卡记录失败:', error)
    return {
      success: false,
      message: '更新打卡记录失败'
    }
  }
}

// 删除打卡记录
async function deleteCheckin(event, openid) {
  const { checkinId } = event

  if (!checkinId) {
    return {
      success: false,
      message: '打卡ID不能为空'
    }
  }

  try {
    // 检查打卡记录是否存在
    const checkinQuery = await db.collection('checkins').doc(checkinId).get()
    if (checkinQuery.data.length === 0) {
      return {
        success: false,
        message: '打卡记录不存在'
      }
    }

    const checkin = checkinQuery.data[0]

    // 检查权限
    if (checkin.userId !== openid) {
      return {
        success: false,
        message: '无权限删除此打卡记录'
      }
    }

    // 软删除
    await db.collection('checkins').doc(checkinId).update({
      data: {
        isDeleted: true,
        updateTime: new Date()
      }
    })

    return {
      success: true,
      message: '删除打卡记录成功'
    }
  } catch (error) {
    console.error('删除打卡记录失败:', error)
    return {
      success: false,
      message: '删除打卡记录失败'
    }
  }
}

// 根据位置获取打卡记录
async function getCheckinsByLocation(event, openid) {
  const {
    longitude,
    latitude,
    radius = 0.01, // 默认100米范围内
    page = 1,
    pageSize = 20
  } = event

  if (!longitude || !latitude) {
    return {
      success: false,
      message: '位置信息不能为空'
    }
  }

  try {
    // 计算位置范围
    const minLng = longitude - radius
    const maxLng = longitude + radius
    const minLat = latitude - radius
    const maxLat = latitude + radius

    const result = await db.collection('checkins')
      .where({
        isDeleted: false,
        privacy: 'public',
        longitude: db.command.gte(minLng).and(db.command.lte(maxLng)),
        latitude: db.command.gte(minLat).and(db.command.lte(maxLat))
      })
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return {
      success: true,
      data: {
        list: result.data,
        page: page,
        pageSize: pageSize
      },
      message: '获取位置打卡记录成功'
    }
  } catch (error) {
    console.error('获取位置打卡记录失败:', error)
    return {
      success: false,
      message: '获取位置打卡记录失败'
    }
  }
}

// 获取用户打卡统计
async function getUserCheckinStats(event, openid) {
  const { userId = openid } = event

  try {
    // 获取用户打卡总数
    const totalResult = await db.collection('checkins')
      .where({
        userId: userId,
        isDeleted: false
      })
      .count()

    // 获取公开打卡数
    const publicResult = await db.collection('checkins')
      .where({
        userId: userId,
        isDeleted: false,
        privacy: 'public'
      })
      .count()

    // 获取最近7天打卡数
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentResult = await db.collection('checkins')
      .where({
        userId: userId,
        isDeleted: false,
        createTime: db.command.gte(sevenDaysAgo)
      })
      .count()

    // 获取标签统计
    const tagResult = await db.collection('checkins')
      .where({
        userId: userId,
        isDeleted: false
      })
      .field({
        tags: true
      })
      .get()

    const tagCount = {}
    tagResult.data.forEach(checkin => {
      if (checkin.tags && Array.isArray(checkin.tags)) {
        checkin.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1
        })
      }
    })

    return {
      success: true,
      data: {
        total: totalResult.total,
        public: publicResult.total,
        recent: recentResult.total,
        tagCount: tagCount
      },
      message: '获取用户打卡统计成功'
    }
  } catch (error) {
    console.error('获取用户打卡统计失败:', error)
    return {
      success: false,
      message: '获取用户打卡统计失败'
    }
  }
}
