// 云函数：初始化数据库
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    // 创建数据库集合（如果不存在）
    const collections = ['users', 'groups', 'albums', 'photos', 'checkins']
    
    for (const collectionName of collections) {
      try {
        // 尝试获取集合信息，如果不存在会抛出异常
        await db.collection(collectionName).limit(1).get()
        console.log(`集合 ${collectionName} 已存在`)
      } catch (error) {
        // 集合不存在，创建它
        console.log(`创建集合 ${collectionName}`)
        // 注意：云开发中集合会在第一次写入数据时自动创建
        // 这里我们只是添加一个占位文档
        await db.collection(collectionName).add({
          data: {
            _init: true,
            createTime: new Date()
          }
        })
        
        // 删除占位文档
        const result = await db.collection(collectionName).where({
          _init: true
        }).get()
        
        if (result.data.length > 0) {
          await db.collection(collectionName).doc(result.data[0]._id).remove()
        }
      }
    }
    
    return {
      success: true,
      message: '数据库初始化成功'
    }
  } catch (error) {
    console.error('数据库初始化失败:', error)
    return {
      success: false,
      message: '数据库初始化失败: ' + error.message
    }
  }
}
