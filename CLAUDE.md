# Qt6WebBridgeTest 项目说明

这是一个基于 Vue 3 + Element Plus 的 Qt6 Web 桥接测试项目，集成了 ROS2 Bridge 功能，提供了一个完整的 Web 界面来测试和操作 ROS2 系统。

## 主要功能

### Qt 桥接功能
- 实现了基于 QWebChannel 的 Qt 和 Web 前端的双向通信
- 提供了完整的 API 封装和类型定义

### [ROS2](https://fishros.org/doc/ros2/humble/index.html) Bridge 功能

1. **ROS 连接管理**
   - 支持 WebSocket 连接到 ROS Bridge Server
   - 实时显示连接状态
   - 支持自动重连
   - 连接日志记录

2. **Topic 操作**
   - 发布消息到指定 Topic
   - 订阅 Topic 消息
   - 支持消息限流
   - 提供常用消息模板

3. **Service 调用**
   - 支持调用 ROS Service
   - JSON 格式化请求数据
   - 显示服务调用结果

4. **参数操作**
   - 获取 ROS 参数
   - 设置 ROS 参数
   - 删除 ROS 参数

5. **系统信息查看**
   - 显示所有 Topics 列表
   - 显示所有 Services 列表
   - 显示所有 Nodes 列表
   - 支持刷新系统信息

### 用户界面特性

- 与 ROS2 项目交互
- JSON 数据自动格式化
- 消息自动滚动
- 实时状态显示
- 完整的错误处理和提示

## 技术栈

- Vue 3
- Vite
- [Element Plus](https://element-plus.org/zh-CN/)
- UnoCSS
- SCSS
- WebSocket
- QWebChannel
- ROS2 Bridge（[rosbridge_suit](https://robotwebtools.github.io/roslibjs/Ros.html)）

## 开发环境要求

- Node.js 16+
- pnpm
- Qt@6.8.3
- ROS2
- rosbridge_server

## 配置说明

环境变量配置在 `.env` 文件中：

```env
VITE_ROS_BRIDGE_URL=ws://localhost:9090  # ROS Bridge Server 地址
```

## 使用说明

1. 安装依赖：
    ```bash
    pnpm install
    ```

2. 开发模式：
    ```bash
    pnpm dev
    ```

3. 构建：
    ```bash
    pnpm build
    ```

## 注意事项

1. 确保 ROS Bridge Server 已正确启动
2. WebEngine 环境下可能存在图标闪烁问题
3. 大量数据传输时注意性能问题
4. 注意处理网络断开重连情况

## 代码结构

```
src/
├── api/          # API 接口定义
├── composables/  # 组合式函数
├── plugins/      # 插件配置
├── utils/        # 工具函数
├── views/        # 页面组件
└── styles/       # 样式文件
```

