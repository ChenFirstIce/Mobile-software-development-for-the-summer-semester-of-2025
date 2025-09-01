# Mobile-software-development-for-the-summer-semester-of-2025
OUC-2025夏季学期《移动软件开发》课程的六个实验以及个人项目的课程报告以及代码。主要是使用微信小程序开发工具开发微信小程序，并涉及到一点鸿蒙系统。

## 实验一

### 项目概述
本项目是一个简单的微信小程序，主要功能为展示用户头像和昵称，用户可通过点击按钮获取并显示自己的微信头像与昵称信息。

### 项目结构
```
test1-main/
├── app.js              # 小程序入口文件
├── app.json            # 全局配置文件
├── app.wxss            # 全局样式文件（未在代码中展示）
├── project.config.json # 项目配置文件
├── project.private.config.json # 项目私有配置文件
├── sitemap.json        # 小程序站点地图配置
└── pages/
    └── index/
        ├── index.js    # 首页逻辑文件
        ├── index.json  # 首页配置文件
        ├── index.wxml  # 首页布局文件
        └── index.wxss  # 首页样式文件
```

### 主要功能说明
1. **首页展示**：默认显示预设图片和"Hello world"文本
2. **用户信息获取**：点击"点击获取头像和昵称"按钮，可获取并展示当前微信用户的头像和昵称

### 核心代码解析

#### 页面布局（index.wxml）
- 使用`container`容器进行布局，包含图片、文本和按钮三个元素
- 图片通过`src`属性绑定数据源，展示头像
- 文本通过`{{name}}`绑定昵称数据
- 按钮通过`bindtap`绑定`getMyInfo`事件处理函数

#### 页面逻辑（index.js）
- `data`中定义了初始数据：默认图片路径、默认昵称、用户信息状态及API兼容性判断
- `getMyInfo`方法：调用`wx.getUserProfile`接口获取用户信息，成功后更新页面数据
- 包含完整的页面生命周期函数（onLoad、onReady等），目前均为默认实现

## 开发环境
- 微信小程序基础库版本：1.06 win64
- 开发者工具版本：建议使用最新稳定版
