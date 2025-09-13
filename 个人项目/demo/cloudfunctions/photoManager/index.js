// 云函数：照片管理
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { action, photoData, photoId, albumId } = event
  const { OPENID } = cloud.getWXContext()
  
  try {
    switch (action) {
      case 'upload':
        return await uploadPhoto(photoData, OPENID)
      case 'batchUpload':
        return await batchUploadPhotos(photoData, OPENID)
      case 'update':
        return await updatePhoto(photoId, photoData, OPENID)
      case 'delete':
        return await deletePhoto(photoId, OPENID)
      case 'getList':
        return await getPhotoList(albumId, OPENID)
      case 'getDetail':
        return await getPhotoDetail(photoId, OPENID)
      case 'batchDelete':
        return await batchDeletePhotos(photoData.photoIds, OPENID)
      default:
        return {
          success: false,
          message: '未知操作类型'
        }
    }
  } catch (error) {
    console.error('照片管理失败:', error)
    return {
      success: false,
      message: '操作失败: ' + error.message
    }
  }
}

// 上传照片
async function uploadPhoto(photoData, openid) {
  // 检查相册权限
  const album = await db.collection('albums').doc(photoData.albumId).get()
  if (!album.data) {
    return {
      success: false,
      message: '相册不存在'
    }
  }
  
  // 检查上传权限
  if (album.data.creatorId !== openid && 
      (!album.data.permissions || !album.data.permissions.upload)) {
    return {
      success: false,
      message: '无上传权限'
    }
  }
  
  const photo = {
    ...photoData,
    uploaderId: openid,
    createTime: new Date(),
    updateTime: new Date(),
    status: 'active'
  }
  
  const result = await db.collection('photos').add({
    data: photo
  })
  
  // 更新相册照片数量
  await db.collection('albums').doc(photoData.albumId).update({
    data: {
      photoCount: db.command.inc(1),
      updateTime: new Date()
    }
  })
  
  return {
    success: true,
    data: {
      ...photo,
      _id: result._id
    },
    message: '照片上传成功'
  }
}

// 更新照片
async function updatePhoto(photoId, photoData, openid) {
  // 检查权限
  const photo = await db.collection('photos').doc(photoId).get()
  if (!photo.data) {
    return {
      success: false,
      message: '照片不存在'
    }
  }
  
  // 检查编辑权限
  if (photo.data.uploaderId !== openid) {
    // 检查相册权限
    const album = await db.collection('albums').doc(photo.data.albumId).get()
    if (album.data.creatorId !== openid && 
        (!album.data.permissions || !album.data.permissions.edit)) {
      return {
        success: false,
        message: '无编辑权限'
      }
    }
  }
  
  const updateData = {
    ...photoData,
    updateTime: new Date()
  }
  
  await db.collection('photos').doc(photoId).update({
    data: updateData
  })
  
  return {
    success: true,
    message: '照片更新成功'
  }
}

// 删除照片
async function deletePhoto(photoId, openid) {
  // 检查权限
  const photo = await db.collection('photos').doc(photoId).get()
  if (!photo.data) {
    return {
      success: false,
      message: '照片不存在'
    }
  }
  
  // 检查删除权限
  if (photo.data.uploaderId !== openid) {
    // 检查相册权限
    const album = await db.collection('albums').doc(photo.data.albumId).get()
    if (album.data.creatorId !== openid && 
        (!album.data.permissions || !album.data.permissions.delete)) {
      return {
        success: false,
        message: '无删除权限'
      }
    }
  }
  
  // 删除照片
  await db.collection('photos').doc(photoId).remove()
  
  // 更新相册照片数量
  await db.collection('albums').doc(photo.data.albumId).update({
    data: {
      photoCount: db.command.inc(-1),
      updateTime: new Date()
    }
  })
  
  return {
    success: true,
    message: '照片删除成功'
  }
}

// 获取照片列表
async function getPhotoList(albumId, openid) {
  // 检查相册权限
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
  
  const result = await db.collection('photos')
    .where({
      albumId: albumId,
      status: 'active'
    })
    .orderBy('createTime', 'desc')
    .get()
  
  return {
    success: true,
    data: result.data,
    message: '获取照片列表成功'
  }
}

// 获取照片详情
async function getPhotoDetail(photoId, openid) {
  const photo = await db.collection('photos').doc(photoId).get()
  
  if (!photo.data) {
    return {
      success: false,
      message: '照片不存在'
    }
  }
  
  // 检查相册权限
  const album = await db.collection('albums').doc(photo.data.albumId).get()
  if (album.data.creatorId !== openid && 
      (!album.data.permissions || !album.data.permissions.view)) {
    return {
      success: false,
      message: '无查看权限'
    }
  }
  
  return {
    success: true,
    data: photo.data,
    message: '获取照片详情成功'
  }
}

// 批量删除照片
async function batchDeletePhotos(photoIds, openid) {
  const photos = await db.collection('photos')
    .where({
      _id: db.command.in(photoIds)
    })
    .get()
  
  if (photos.data.length === 0) {
    return {
      success: false,
      message: '没有找到要删除的照片'
    }
  }
  
  // 检查权限
  for (const photo of photos.data) {
    if (photo.uploaderId !== openid) {
      // 检查相册权限
      const album = await db.collection('albums').doc(photo.albumId).get()
      if (album.data.creatorId !== openid && 
          (!album.data.permissions || !album.data.permissions.delete)) {
        return {
          success: false,
          message: '无删除权限'
        }
      }
    }
  }
  
  // 批量删除（逐个删除避免使用batch）
  for (const photo of photos.data) {
    try {
      await db.collection('photos').doc(photo._id).remove()
    } catch (error) {
      console.error('删除照片失败:', photo._id, error)
    }
  }
  
  // 更新相册照片数量
  const albumIds = [...new Set(photos.data.map(photo => photo.albumId))]
  for (const albumId of albumIds) {
    const count = photos.data.filter(photo => photo.albumId === albumId).length
    await db.collection('albums').doc(albumId).update({
      data: {
        photoCount: db.command.inc(-count),
        updateTime: new Date()
      }
    })
  }
  
  return {
    success: true,
    message: `成功删除 ${photos.data.length} 张照片`
  }
}

// 批量上传照片
async function batchUploadPhotos(photoData, openid) {
  const { photos, albumId } = photoData
  
  if (!photos || !Array.isArray(photos) || photos.length === 0) {
    return {
      success: false,
      message: '照片数据不能为空'
    }
  }
  
  if (!albumId) {
    return {
      success: false,
      message: '相册ID不能为空'
    }
  }
  
  // 检查相册权限
  const album = await db.collection('albums').doc(albumId).get()
  if (!album.data) {
    return {
      success: false,
      message: '相册不存在'
    }
  }
  
  // 检查上传权限
  if (album.data.creatorId !== openid && 
      (!album.data.permissions || !album.data.permissions.upload)) {
    return {
      success: false,
      message: '无上传权限'
    }
  }
  
  const uploadedPhotos = []
  const errors = []
  
  // 批量上传照片
  for (let i = 0; i < photos.length; i++) {
    try {
      const photo = {
        ...photos[i],
        albumId: albumId,
        uploaderId: openid,
        createTime: new Date(),
        updateTime: new Date(),
        status: 'active'
      }
      
      const result = await db.collection('photos').add({
        data: photo
      })
      
      uploadedPhotos.push({
        ...photo,
        _id: result._id
      })
    } catch (error) {
      console.error(`上传第${i+1}张照片失败:`, error)
      errors.push(`第${i+1}张照片上传失败: ${error.message}`)
    }
  }
  
  // 更新相册照片数量
  if (uploadedPhotos.length > 0) {
    await db.collection('albums').doc(albumId).update({
      data: {
        photoCount: db.command.inc(uploadedPhotos.length),
        updateTime: new Date()
      }
    })
  }
  
  return {
    success: uploadedPhotos.length > 0,
    data: {
      uploadedPhotos: uploadedPhotos,
      totalCount: photos.length,
      successCount: uploadedPhotos.length,
      errorCount: errors.length
    },
    message: uploadedPhotos.length === photos.length ? 
      `成功上传 ${uploadedPhotos.length} 张照片` : 
      `成功上传 ${uploadedPhotos.length} 张照片，失败 ${errors.length} 张`
  }
}
