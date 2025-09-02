# 数据库表结构设计 v3.0

## 概述
本文档描述了旅冰GO小程序的云数据库表结构设计，包含所有核心功能模块的数据表。

## 数据库表列表

### 1. 用户表 (users)

**表名**: `users`

**字段说明**:
- `_id`: 记录ID，主键，自动生成
- `openid`: 微信OpenID，用户唯一标识
- `unionid`: 微信UnionID，开放平台唯一标识
- `nick_name`: 用户昵称
- `avatar_url`: 头像URL
- `gender`: 性别 (0: 未知, 1: 男, 2: 女)
- `phone`: 手机号
- `status`: 状态 (active: 活跃, inactive: 非活跃)
- `created_at`: 创建时间
- `updated_at`: 更新时间

**索引**:
- `openid`: 唯一索引
- `unionid`: 普通索引

### 2. 群组表 (groups)

**表名**: `groups`

**字段说明**:
- `_id`: 群组ID，主键，自动生成
- `name`: 群组名称
- `description`: 群组描述
- `creator_id`: 创建者ID，关联users表
- `type`: 群组类型 (public: 公开, private: 私密)
- `max_members`: 最大成员数
- `member_count`: 当前成员数
- `verification_type`: 验证方式 (none: 无需验证, code: 邀请码, approval: 审批)
- `invite_code`: 邀请码
- `room_code`: 房间号，6位随机字符串
- `status`: 状态 (active: 活跃, inactive: 非活跃)
- `created_at`: 创建时间
- `updated_at`: 更新时间

**索引**:
- `creator_id`: 普通索引
- `room_code`: 唯一索引
- `status`: 普通索引

### 3. 群组成员表 (group_members)

**表名**: `group_members`

**字段说明**:
- `_id`: 记录ID，主键，自动生成
- `group_id`: 群组ID，关联groups表
- `user_id`: 用户ID，关联users表
- `role`: 角色 (creator: 创建者, admin: 管理员, member: 成员)
- `join_time`: 加入时间

**索引**:
- `group_id`: 普通索引
- `user_id`: 普通索引
- `group_id + user_id`: 复合唯一索引

### 4. 相册表 (albums)

**表名**: `albums`

**字段说明**:
- `_id`: 相册ID，主键，自动生成
- `group_id`: 群组ID，关联groups表
- `name`: 相册名称
- `creator_id`: 创建者ID，关联users表
- `photo_count`: 照片数量
- `created_at`: 创建时间
- `updated_at`: 更新时间

**索引**:
- `group_id`: 普通索引
- `creator_id`: 普通索引

### 5. 照片表 (photos)

**表名**: `photos`

**字段说明**:
- `_id`: 照片ID，主键，自动生成
- `album_id`: 相册ID，关联albums表
- `uploader_id`: 上传者ID，关联users表
- `file_url`: 文件URL
- `location`: 拍摄地点
- `created_at`: 上传时间

**索引**:
- `album_id`: 普通索引
- `uploader_id`: 普通索引
- `created_at`: 普通索引

### 6. 打卡点表 (checkin_points)

**表名**: `checkin_points`

**字段说明**:
- `_id`: 打卡点ID，主键，自动生成
- `group_id`: 群组ID，关联groups表
- `name`: 打卡点名称
- `latitude`: 纬度
- `longitude`: 经度
- `address`: 详细地址
- `created_at`: 创建时间

**索引**:
- `group_id`: 普通索引
- `latitude + longitude`: 复合索引

### 7. 打卡记录表 (checkin_records)

**表名**: `checkin_records`

**字段说明**:
- `_id`: 记录ID，主键，自动生成
- `point_id`: 打卡点ID，关联checkin_points表
- `user_id`: 用户ID，关联users表
- `latitude`: 打卡纬度
- `longitude`: 打卡经度
- `photo_url`: 打卡照片URL
- `checkin_time`: 打卡时间

**索引**:
- `point_id`: 普通索引
- `user_id`: 普通索引
- `checkin_time`: 普通索引

## 云函数列表

### 1. login - 用户登录
- 功能：微信授权登录，用户信息管理
- 文件：`cloudfunctions/login/index.js`

### 2. users - 用户管理
- 功能：用户信息的增删改查
- 文件：`cloudfunctions/users/index.js`
- 操作：create, update, get, list

### 3. groups - 群组管理
- 功能：群组的增删改查，成员管理
- 文件：`cloudfunctions/groups/index.js`
- 操作：create, update, get, list, join, leave

### 4. albums - 相册管理
- 功能：相册的增删改查
- 文件：`cloudfunctions/albums/index.js`
- 操作：create, update, get, list, delete

### 5. photos - 照片管理
- 功能：照片的上传、查询、删除
- 文件：`cloudfunctions/photos/index.js`
- 操作：upload, get, list, delete

### 6. checkin - 打卡管理
- 功能：打卡点和打卡记录的管理
- 文件：`cloudfunctions/checkin/index.js`
- 操作：createPoint, updatePoint, getPoint, listPoints, deletePoint, checkin, getRecords

## 数据关系图

```
users (用户)
├── groups (群组) - creator_id
├── group_members (群组成员) - user_id
├── albums (相册) - creator_id
├── photos (照片) - uploader_id
├── checkin_points (打卡点) - 通过groups关联
└── checkin_records (打卡记录) - user_id

groups (群组)
├── group_members (群组成员) - group_id
├── albums (相册) - group_id
├── checkin_points (打卡点) - group_id
└── checkin_records (打卡记录) - 通过checkin_points关联

albums (相册)
└── photos (照片) - album_id

checkin_points (打卡点)
└── checkin_records (打卡记录) - point_id
```

## 部署说明

1. **创建数据库集合**：
   - 在微信开发者工具中创建上述7个集合
   - 设置相应的索引

2. **部署云函数**：
   - 上传并部署所有云函数
   - 确保云函数权限配置正确

3. **数据迁移**：
   - 将现有本地存储数据迁移到云数据库
   - 更新前端代码以使用云函数

## 注意事项

1. **数据安全**：
   - 所有敏感操作都需要用户身份验证
   - 使用云函数进行权限控制

2. **性能优化**：
   - 合理设置索引
   - 使用分页查询避免大量数据加载

3. **数据一致性**：
   - 使用事务确保数据一致性
   - 定期备份重要数据
