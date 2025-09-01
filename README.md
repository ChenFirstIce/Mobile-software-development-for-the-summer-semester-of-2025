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



很好👌，根据你提供的表格信息，我帮你把 **实验二** 和 **实验三** 的说明文档，按照 `README.md` 里 **实验一** 的风格仿写出来了：

------

## 实验二 天气查询小程序

### 项目概述

本项目是一个微信小程序，主要功能为查询并展示天气信息，包括温度、天气状况、气压、能见度、湿度、风速、风力等数据，通过调用天气 API 实现数据获取与展示。

### 项目结构

```
weather-applet/
├── app.js                      # 小程序入口文件
├── app.json                    # 全局配置文件
├── app.wxss                    # 全局样式文件
├── project.config.json          # 项目配置文件
├── project.private.config.json  # 项目私有配置文件
├── sitemap.json                # 小程序站点地图配置
├── images/                     # 天气图标等图片资源
└── pages/
    └── index/
        ├── index.js            # 天气查询页面逻辑
        ├── index.json          # 页面配置
        ├── index.wxml          # 页面布局
        └── index.wxss          # 页面样式
```

### 主要功能说明

1. **天气信息展示**：显示温度、天气图标、气压、能见度、湿度、风速、风力等数据
2. **动态更新**：通过 API 获取天气数据并实时更新页面展示

### 核心代码解析

- **布局**：
  - 使用 `container` 容器进行整体布局，采用 flex 布局实现元素排列
  - 通过 `view`、`image`、`text` 组件构建页面结构，`image` 展示天气图标，`text` 显示天气信息
  - 使用 `class` 定义样式类（如 `.bar`、`.box`）实现多列数据展示
- **逻辑**：
  - `index.js` 中通过 API 调用获取天气数据，存入 `data` 中
  - 利用数据绑定（`{{}}`）将 `data` 中的数据动态渲染到页面
  - 处理 API 返回结果，更新页面展示的天气相关数据

### 开发环境

- 微信小程序基础库版本：1.06 win64
- 开发者工具版本：建议使用最新稳定版

------

## 实验三 微信小程序云开发（垃圾分类小程序）

### 项目概述

本项目是一个基于微信小程序云开发的垃圾分类查询工具，学习云开发基础知识，实现垃圾分类的文本搜索功能，同时尝试图像识别垃圾分类（依赖云函数和第三方 API）。

### 项目结构

```
garbage-sorting-applet/
├── app.js                      # 小程序入口文件
├── app.json                    # 全局配置文件
├── app.wxss                    # 全局样式文件
├── project.config.json          # 项目配置文件
├── project.private.config.json  # 项目私有配置文件
├── sitemap.json                # 小程序站点地图配置
├── cloudfunctions/             # 云函数目录
│   ├── getAccessToken/         # 获取百度 API 令牌的云函数
│   └── imageRecognition/       # 图像识别云函数
├── images/                     # 界面图片资源
└── pages/
    ├── index/                  # 首页
    │   ├── index.js
    │   ├── index.json
    │   ├── index.wxml
    │   └── index.wxss
    ├── search/                 # 搜索页面
    │   ├── search.js
    │   ├── search.json
    │   ├── search.wxml
    │   └── search.wxss
    └── camera/                 # 拍照识别页面
        ├── camera.js
        ├── camera.json
        ├── camera.wxml
        └── camera.wxss
```

### 主要功能说明

1. **首页展示**：显示垃圾分类相关入口和热词
2. **文本搜索**：通过输入关键词查询垃圾所属类别
3. **拍照识别**：拍摄垃圾图片，通过云函数调用图像识别 API 判断垃圾类别

### 核心代码解析

- **布局**：
  - 多页面布局（首页、搜索页、相机页），使用 `view`、`input`、`button`、`camera` 等组件构建交互界面
  - 搜索页通过 `input` 组件接收用户输入，相机页使用 `camera` 组件实现拍照功能
- **逻辑**：
  - 云函数（`getAccessToken`、`imageRecognition`）处理 API 调用，获取识别令牌和识别结果
  - 页面逻辑（如 `search.js`、`camera.js`）调用云函数，接收返回结果并更新页面展示
  - 实现文本搜索与图像识别结果的动态渲染

## 开发环境
- 微信小程序基础库版本：1.06 win64
- 开发者工具版本：建议使用最新稳定版
