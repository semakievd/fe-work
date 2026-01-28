import ROSLIB from 'roslib'

export class RosBridgeManager {
  constructor() {
    this.ros = null
    this.topics = new Map()
    this.services = new Map()
    this.actions = new Map()
    this.params = new Map()
    this.listeners = new Map()
    this.isConnected = false
    this.connectionUrl = null

    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }


  connect(url = import.meta.env.VITE_ROS_BRIDGE_URL) {

    if (this.isConnected) {
      console.warn('ROS已经连接')
      return Promise.resolve()
    }

    this.connectionUrl = url

    return new Promise((resolve, reject) => {
      try {
        this.ros = new ROSLIB.Ros({
          url: url
        })

        this.ros.on('connection', () => {
          console.log('ROS桥接连接成功')
          this.isConnected = true
          this.notifyConnectionChange(true)
          resolve()
        })

        this.ros.on('error', (error) => {
          console.error('ROS桥接连接错误:', error)
          this.isConnected = false
          this.notifyConnectionChange(false)
          reject(error)
        })

        this.ros.on('close', () => {
          console.log('ROS桥接连接关闭')
          this.isConnected = false
          this.notifyConnectionChange(false)
        })
      } catch (error) {
        console.error('创建ROS连接失败:', error)
        reject(error)
      }
    })
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('达到最大重连次数，停止重连')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * this.reconnectAttempts

    console.log(`${delay}ms后进行第${this.reconnectAttempts}次重连...`)

    this.reconnectTimer = setTimeout(() => {
      if (!this.isConnected && this.connectionUrl) {
        console.log(`执行第${this.reconnectAttempts}次重连`)
        this.connect(this.connectionUrl).catch(error => {
          console.error(`第${this.reconnectAttempts}次重连失败:`, error)
        })
      }
    }, delay)
  }

  disconnect() {
    if (this.ros && this.isConnected) {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }

      this.reconnectAttempts = this.maxReconnectAttempts

      this.topics.forEach(topic => topic.unsubscribe())
      this.topics.clear()
      this.services.clear()
      this.actions.clear()

      this.ros.close()
      this.ros = null
      this.isConnected = false
      this.connectionUrl = null
      this.notifyConnectionChange(false)
      console.log('ROS连接已断开')
    }
  }

  getConnectionStatus() {return this.isConnected}

  notifyConnectionChange(connected, error = null) {
    if (this.onConnectionChange) {
      this.onConnectionChange({
        connected,
        url: this.connectionUrl,
        error,
        timestamp: new Date().toLocaleString(),
        reconnectAttempts: this.reconnectAttempts
      })
    }
  }

  setConnectionChangeCallback(callback) {
    this.onConnectionChange = callback
  }

  publishMessage(topicName, messageType, message) {
    if (!this.ensureConnection()) return

    let topic = this.topics.get(topicName)
    if (!topic) {
      topic = new ROSLIB.Topic({
        ros: this.ros,
        name: topicName,
        messageType: messageType
      })
      this.topics.set(topicName, topic)
    }

    const rosMessage = new ROSLIB.Message(message)
    topic.publish(rosMessage)

    console.log(`发布消息到 ${topicName}:`, message)
  }

  subscribeTopic(topicName, messageType, callback, throttleRate = null) {
    if (!this.ensureConnection()) return null

    const topicKey = `${topicName}_${messageType}`
    let topic = this.topics.get(topicKey)

    if (!topic) {
      const topicOptions = {
        ros: this.ros,
        name: topicName,
        messageType: messageType
      }

      if (throttleRate) {
        topicOptions.throttle_rate = throttleRate
      }

      topic = new ROSLIB.Topic(topicOptions)
      this.topics.set(topicKey, topic)
    }

    topic.subscribe(callback)

    console.log(`订阅话题 ${topicName} (${messageType})`)
    return topic
  }

  unsubscribeTopic(topicName, messageType) {
    const topicKey = `${topicName}_${messageType}`
    const topic = this.topics.get(topicKey)
    if (topic) {
      topic.unsubscribe()
      this.topics.delete(topicKey)
      console.log(`取消订阅话题 ${topicName}`)
    }
  }

  callService(serviceName, serviceType, request) {
    if (!this.ensureConnection()) return Promise.reject(new Error('ROS未连接'))

    return new Promise((resolve, reject) => {
      const service = new ROSLIB.Service({
        ros: this.ros,
        name: serviceName,
        serviceType: serviceType
      })

      const serviceRequest = new ROSLIB.ServiceRequest(request)

      service.callService(serviceRequest, (result) => {
        console.log(`服务 ${serviceName} 调用成功:`, result)
        resolve(result)
      }, (error) => {
        console.error(`服务 ${serviceName} 调用失败:`, error)
        reject(error)
      })
    })
  }

  getParam(paramName) {
    if (!this.ensureConnection()) return Promise.reject(new Error('ROS未连接'))

    return new Promise((resolve, reject) => {
      const param = new ROSLIB.Param({
        ros: this.ros,
        name: paramName
      })

      param.get((value) => {
        console.log(`获取参数 ${paramName}:`, value)
        resolve(value)
      }, (error) => {
        console.error(`获取参数 ${paramName} 失败:`, error)
        reject(error)
      })
    })
  }

  setParam(paramName, value) {
    if (!this.ensureConnection()) return Promise.reject(new Error('ROS未连接'))

    return new Promise((resolve, reject) => {
      const param = new ROSLIB.Param({
        ros: this.ros,
        name: paramName
      })

      param.set(value, () => {
        console.log(`设置参数 ${paramName}:`, value)
        resolve()
      }, (error) => {
        console.error(`设置参数 ${paramName} 失败:`, error)
        reject(error)
      })
    })
  }

  deleteParam(paramName) {
    if (!this.ensureConnection()) return Promise.reject(new Error('ROS未连接'))

    return new Promise((resolve, reject) => {
      const param = new ROSLIB.Param({
        ros: this.ros,
        name: paramName
      })

      param.delete(() => {
        console.log(`删除参数 ${paramName}`)
        resolve()
      }, (error) => {
        console.error(`删除参数 ${paramName} 失败:`, error)
        reject(error)
      })
    })
  }

  createActionClient(actionName, actionType) {
    if (!this.ensureConnection()) return null

    const actionClient = new ROSLIB.ActionClient({
      ros: this.ros,
      serverName: actionName,
      actionName: actionType
    })

    return actionClient
  }

  ensureConnection() {
    if (!this.isConnected || !this.ros) {
      console.warn('ROS未连接，请先连接到ROS桥接服务器')
      return false
    }
    return true
  }

  getTopics() {
    if (!this.ensureConnection()) return Promise.reject(new Error('ROS未连接'))

    return new Promise((resolve, reject) => {
      this.ros.getTopics((topics) => {
        console.log('获取话题列表:', topics)
        resolve(topics)
      }, (error) => {
        console.error('获取话题列表失败:', error)
        reject(error)
      })
    })
  }

  async getMessageDetails(msgName) {
    if (!this.ensureConnection()) return Promise.reject(new Error('ROS未连接'))

    return new Promise((resolve, reject) => {
      this.ros.getMessageDetails(msgName, (result) => {
        console.log(`msg ${msgName} 的定义:`, result)
        resolve(result)
      }, (error) => {
        console.error(`获取message定义失败:`, error)
        reject(error)
      })
    })
  }

  getServices() {
    if (!this.ensureConnection()) return Promise.reject(new Error('ROS未连接'))

    return new Promise((resolve, reject) => {
      this.ros.getServices((services) => {
        console.log('获取服务列表:', services)
        resolve(services)
      }, (error) => {
        console.error('获取服务列表失败:', error)
        reject(error)
      })
    })
  }

  getNodes() {
    if (!this.ensureConnection()) return Promise.reject(new Error('ROS未连接'))

    return new Promise((resolve, reject) => {
      this.ros.getNodes((nodes) => {
        console.log('获取节点列表:', nodes)
        resolve(nodes)
      }, (error) => {
        console.error('获取节点列表失败:', error)
        reject(error)
      })
    })
  }
}
