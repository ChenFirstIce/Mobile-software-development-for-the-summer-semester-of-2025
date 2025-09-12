# 云开发集成说明

## 环境配置

### 1. 云开发环境ID
```
cloud1-3gfit3n1e60214ef
```

### 2. 数据库结构

#### 用户集合 (users)
```javascript
{
  _id: "用户ID",
  _openid: "微信OpenID",
  nickName: "用户昵称",
  avatarUrl: "头像URL",
  gender: 1, // 0-未知 1-男 2-女
  language: "语言",
  createTime: "创建时间",
  updateTime: "更新时间",
  lastLoginTime: "最后登录时间",
  status: "active", // active, inactive, banned
  preferences: {
    theme: "light",
    language: "zh_CN",
    notifications: true
  }
}
```

#### 群组集合 (groups)
```javascript
{
  _id: "群组ID",
  name: "群组名称",
  description: "群组描述",
  coverImage: "封面图片",
  creatorId: "创建者ID",
  creatorName: "创建者名称",
  roomCode: "房间号",
  verifyCode: "验证码",
  maxMembers: 50,
  memberCount: 5,
  members: [{
    userId: "用户ID",
    nickName: "用户昵称",
    avatarUrl: "头像URL",
    role: "creator", // creator, admin, member
    joinTime: "加入时间"
  }],
  tags: ["标签"],
  createTime: "创建时间",
  updateTime: "更新时间",
  status: "active"
}
```

#### 相册集合 (albums)
```javascript
{
  _id: "相册ID",
  name: "相册名称",
  description: "相册描述",
  coverImage: "封面图片",
  type: "shared", // personal, shared
  groupId: "群组ID",
  creatorId: "创建者ID",
  creatorName: "创建者名称",
  permissions: {
    view: true,
    edit: true,
    upload: true,
    delete: false
  },
  tags: ["标签"],
  photoCount: 25,
  createTime: "创建时间",
  updateTime: "更新时间",
  status: "active"
}
```

#### 照片集合 (photos)
```javascript
{
  _id: "照片ID",
  albumId: "相册ID",
  groupId: "群组ID",
  uploaderId: "上传者ID",
  uploaderName: "上传者名称",
  fileId: "云存储文件ID",
  name: "照片名称",
  description: "照片描述",
  location: {
    latitude: 39.9163,
    longitude: 116.3972,
    address: "地址"
  },
  size: 1024000,
  width: 1920,
  height: 1080,
  createTime: "创建时间",
  updateTime: "更新时间",
  status: "active"
}
```

#### 打卡记录集合 (checkins)
```javascript
{
  _id: "打卡ID",
  userId: "用户ID",
  groupId: "群组ID",
  location: {
    latitude: 39.9163,
    longitude: 116.3972,
    address: "地址"
  },
  title: "打卡标题",
  description: "打卡描述",
  photos: ["照片ID"],
  createTime: "创建时间",
  status: "active"
}
```

## 云函数说明

### 1. userLogin
- **功能**: 用户登录
- **参数**: `{ code: "微信登录code" }`
- **返回**: 用户信息

### 2. updateUserInfo
- **功能**: 更新用户信息
- **参数**: `{ userInfo: { nickName, avatarUrl, ... } }`
- **返回**: 更新后的用户信息

### 3. initDatabase
- **功能**: 初始化数据库集合
- **参数**: 无
- **返回**: 初始化结果

## 部署步骤

### 1. 在微信开发者工具中
1. 右键点击 `cloudfunctions` 文件夹
2. 选择"创建云开发环境"
3. 选择环境ID: `cloud1-3gfit3n1e60214ef`

### 2. 部署云函数
1. 右键点击 `cloudfunctions/userLogin` 文件夹
2. 选择"上传并部署：云端安装依赖"
3. 重复步骤1-2，部署其他云函数

### 3. 配置数据库
1. 在云开发控制台中创建数据库集合
2. 设置数据库安全规则
3. 调用 `initDatabase` 云函数初始化数据

## 安全规则

```javascript
// 用户集合
{
  "read": "auth != null && (resource.data._openid == auth.uid || resource.data._id == auth.uid)",
  "write": "auth != null && resource.data._openid == auth.uid"
}

// 群组集合
{
  "read": "auth != null && (resource.data.creatorId == auth.uid || resource.data.members[].userId == auth.uid)",
  "write": "auth != null && (resource.data.creatorId == auth.uid || resource.data.members[].userId == auth.uid)"
}

// 相册集合
{
  "read": "auth != null && (resource.data.creatorId == auth.uid || resource.data.permissions.view == true)",
  "write": "auth != null && (resource.data.creatorId == auth.uid || resource.data.permissions.edit == true)"
}

// 照片集合
{
  "read": "auth != null && (resource.data.uploaderId == auth.uid || resource.data.permissions.view == true)",
  "write": "auth != null && (resource.data.uploaderId == auth.uid || resource.data.permissions.edit == true)"
}

// 打卡记录集合
{
  "read": "auth != null && (resource.data.userId == auth.uid || resource.data.groupId != null)",
  "write": "auth != null && resource.data.userId == auth.uid"
}
```

## 使用说明

### 1. 用户登录
```javascript
// 在页面中调用
app.wxLogin().then(userInfo => {
  console.log('登录成功:', userInfo)
}).catch(error => {
  console.error('登录失败:', error)
})
```

### 2. 更新用户信息
```javascript
// 在页面中调用
app.getUserProfile().then(userInfo => {
  console.log('用户信息更新成功:', userInfo)
}).catch(error => {
  console.error('更新失败:', error)
})
```

### 3. 上传文件到云存储
```javascript
wx.cloud.uploadFile({
  cloudPath: 'avatars/user_123.jpg',
  filePath: tempFilePath,
  success: res => {
    console.log('上传成功:', res.fileID)
  }
})
```

## 注意事项

1. 确保云开发环境ID正确
2. 云函数需要先部署才能使用
3. 数据库安全规则需要正确配置
4. 云存储需要设置访问权限
5. 测试时建议使用真机调试
