# 数据库表结构设计

## 主要表结构

### 1. 用户表 (users)
- id: 用户ID，主键
- openid: 微信OpenID
- unionid: 微信UnionID  
- nick_name: 用户昵称
- avatar_url: 头像URL
- gender: 性别
- phone: 手机号
- status: 状态
- created_at: 创建时间

### 2. 群组表 (groups)
- id: 群组ID，主键
- name: 群组名称
- description: 群组描述
- creator_id: 创建者ID
- type: 群组类型
- max_members: 最大成员数
- member_count: 当前成员数
- verification_type: 验证方式
- invite_code: 邀请码
- status: 状态

### 3. 群组成员表 (group_members)
- id: 记录ID，主键
- group_id: 群组ID
- user_id: 用户ID
- role: 角色
- join_time: 加入时间

### 4. 相册表 (albums)
- id: 相册ID，主键
- group_id: 群组ID
- name: 相册名称
- creator_id: 创建者ID
- photo_count: 照片数量

### 5. 照片表 (photos)
- id: 照片ID，主键
- album_id: 相册ID
- uploader_id: 上传者ID
- file_url: 文件URL
- location: 拍摄地点
- created_at: 上传时间

### 6. 打卡点表 (checkin_points)
- id: 打卡点ID，主键
- group_id: 群组ID
- name: 打卡点名称
- latitude: 纬度
- longitude: 经度
- address: 详细地址

### 7. 打卡记录表 (checkin_records)
- id: 记录ID，主键
- point_id: 打卡点ID
- user_id: 用户ID
- latitude: 打卡纬度
- longitude: 打卡经度
- photo_url: 打卡照片
- checkin_time: 打卡时间

### 8. 随机转盘表 (wheels)
- id: 转盘ID，主键
- group_id: 群组ID
- name: 转盘名称
- creator_id: 创建者ID
- status: 状态

### 9. 转盘项目表 (wheel_items)
- id: 项目ID，主键
- wheel_id: 转盘ID
- user_id: 用户ID
- content: 项目内容
- color: 显示颜色

### 10. 转盘结果表 (wheel_results)
- id: 结果ID，主键
- wheel_id: 转盘ID
- item_id: 中奖项目ID
- user_id: 中奖用户ID
- content: 中奖内容
- spin_time: 转动时间

### 11. 价格投票表 (price_votes)
- id: 投票ID，主键
- group_id: 群组ID
- name: 投票名称
- creator_id: 创建者ID
- is_anonymous: 是否匿名
- status: 状态

### 12. 价格投票项目表 (price_vote_items)
- id: 项目ID，主键
- vote_id: 投票ID
- user_id: 用户ID
- min_price: 最低价
- max_price: 最高价

### 13. 价格投票结果表 (price_vote_results)
- id: 结果ID，主键
- vote_id: 投票ID
- participant_count: 参与人数
- min_highest: 最低价最高值
- min_lowest: 最低价最低值
- min_average: 最低价平均值
- max_highest: 最高价最高值
- max_lowest: 最高价最低值
- max_average: 最高价平均值

### 14. 酒店搜索记录表 (hotel_searches)
- id: 记录ID，主键
- user_id: 用户ID
- destination: 目的地
- check_in: 入住日期
- check_out: 退房日期
- rooms: 房间数
- guests: 入住人数

### 15. 酒店收藏表 (hotel_favorites)
- id: 收藏ID，主键
- user_id: 用户ID
- hotel_name: 酒店名称
- hotel_address: 酒店地址
- lowest_price: 最低价格
- platform: 最低价平台
