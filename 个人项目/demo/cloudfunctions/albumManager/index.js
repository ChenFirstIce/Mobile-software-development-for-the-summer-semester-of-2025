// 云函数：相册管理
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { action, albumData, albumId, groupId } = event
  const { OPENID } = cloud.getWXContext()
  
  console.log('云函数接收到的参数:', { action, albumId, albumData: albumData ? '有数据' : '无数据' })
  
  try {
    switch (action) {
      case 'create':
        return await createAlbum(albumData, OPENID)
      case 'update':
        return await updateAlbum(albumId, albumData, OPENID)
      case 'delete':
        return await deleteAlbum(albumId, OPENID)
      case 'getList':
        return await getAlbumList(OPENID, groupId)
      case 'getDetail':
        return await getAlbumDetail(albumId, OPENID)
      case 'checkPermission':
        return await checkAlbumPermission(albumId, OPENID)
      default:
        return {
          success: false,
          message: '未知操作类型'
        }
    }
  } catch (error) {
    console.error('相册管理失败:', error)
    return {
      success: false,
      message: '操作失败: ' + error.message
    }
  }
}

// 创建相册
async function createAlbum(albumData, openid) {
  const album = {
    ...albumData,
    creatorId: openid,
    createTime: new Date(),
    updateTime: new Date(),
    photoCount: 0,
    status: 'active'
  }
  
  const result = await db.collection('albums').add({
    data: album
  })
  
  return {
    success: true,
    data: {
      ...album,
      _id: result._id
    },
    message: '相册创建成功'
  }
}

// 更新相册
async function updateAlbum(albumId, albumData, openid) {
  console.log('开始更新相册:', { albumId, openid, albumData })
  
  // 检查权限
  const album = await db.collection('albums').doc(albumId).get()
  if (!album.data) {
    console.log('相册不存在:', albumId)
    return {
      success: false,
      message: '相册不存在'
    }
  }
  
  // 检查编辑权限
  if (album.data.creatorId !== openid && 
      (!album.data.permissions || !album.data.permissions.edit)) {
    console.log('无编辑权限:', { creatorId: album.data.creatorId, openid })
    return {
      success: false,
      message: '无编辑权限'
    }
  }
  
  // 过滤掉不能更新的字段
  const { _id, id, createTime, creatorId, creatorName, ...updateData } = albumData
  
  // 添加更新时间
  updateData.updateTime = new Date()
  
  await db.collection('albums').doc(albumId).update({
    data: updateData
  })
  
  // 获取更新后的相册数据
  const updatedAlbum = await db.collection('albums').doc(albumId).get()
  console.log('更新后的相册数据:', updatedAlbum.data)
  
  const result = {
    success: true,
    data: updatedAlbum.data,
    message: '相册更新成功'
  }
  
  console.log('返回结果:', result)
  return result
}

// 删除相册
async function deleteAlbum(albumId, openid) {
  // 检查权限
  const album = await db.collection('albums').doc(albumId).get()
  if (!album.data) {
    return {
      success: false,
      message: '相册不存在'
    }
  }
  
  // 只有创建者可以删除
  if (album.data.creatorId !== openid) {
    return {
      success: false,
      message: '无删除权限'
    }
  }
  
  // 删除相册
  await db.collection('albums').doc(albumId).remove()
  
  // 删除相册下的所有照片
  const photos = await db.collection('photos').where({
    albumId: albumId
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
    message: '相册删除成功'
  }
}

// 获取相册列表
async function getAlbumList(openid, groupId = null) {
  let query = db.collection('albums')
  
  if (groupId) {
    // 获取群组相册
    query = query.where({
      groupId: groupId,
      type: 'shared'
    })
  } else {
    // 获取用户相册（个人相册 + 有权限的群组相册）
    query = query.where(db.command.or([
      { creatorId: openid },
      { 
        'permissions.view': true,
        type: 'shared'
      }
    ]))
  }
  
  const result = await query
    .orderBy('updateTime', 'desc')
    .get()
  
  return {
    success: true,
    data: result.data,
    message: '获取相册列表成功'
  }
}

// 获取相册详情
async function getAlbumDetail(albumId, openid) {
  const album = await db.collection('albums').doc(albumId).get()
  
  if (!album.data) {
    return {
      success: false,
      message: '相册不存在'
    }
  }
  
  // 检查查看权限
  if (album.data.creatorId !== openid && 
      (!album.data.permissions || !album.data.permissions.view)) {
    return {
      success: false,
      message: '无查看权限'
    }
  }
  
  return {
    success: true,
    data: album.data,
    message: '获取相册详情成功'
  }
}

// 检查相册权限
async function checkAlbumPermission(albumId, openid) {
  const album = await db.collection('albums').doc(albumId).get()
  
  if (!album.data) {
    return {
      success: false,
      message: '相册不存在'
    }
  }
  
  const isCreator = album.data.creatorId === openid
  const permissions = album.data.permissions || {}
  
  return {
    success: true,
    data: {
      canView: isCreator || permissions.view,
      canEdit: isCreator || permissions.edit,
      canUpload: isCreator || permissions.upload,
      canDelete: isCreator || permissions.delete
    },
    message: '权限检查完成'
  }
}
