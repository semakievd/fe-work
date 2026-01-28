import { RosBridgeManager } from '~/utils/rosBridgeManager.js'
import rosConfig from '~/utils/rosConfig.js'

class RosGlobalAPI {
  constructor(rosBridgeManager) {
    this.bridge = rosBridgeManager
    this.msg = new RosMessageAPI(rosBridgeManager)
    this.srv = new RosServiceAPI(rosBridgeManager)
    this.action = new RosActionAPI(rosBridgeManager)
    this.param = new RosParamAPI(rosBridgeManager)
    this.config = rosConfig
  }

  async connect(url = null) {
    const targetUrl = url || this.config.getUrl()
    return await this.bridge.connect(targetUrl)
  }

  disconnect() {
    this.bridge.disconnect()
  }

  get isConnected() {
    return this.bridge.isConnected
  }

  getConnectionStatus() {
    return this.bridge.getConnectionStatus()
  }

  onConnectionChange(callback) {
    this.bridge.setConnectionChangeCallback(callback)
  }

  async getTopics() {
    return await this.bridge.getTopics()
  }

  async getServices() {
    return await this.bridge.getServices()
  }

  async getNodes() {
    return await this.bridge.getNodes()
  }

  setServerUrl(url) {
    this.config.setUrl(url)
  }

  getServerUrl() {
    return this.config.getUrl()
  }

  isValidUrl(url) {
    return this.config.isValidUrl(url)
  }
}

class RosMessageAPI {
  constructor(rosBridgeManager) {
    this.bridge = rosBridgeManager
  }

  publish(topicName, messageType, message) {
    this.bridge.publishMessage(topicName, messageType, message)
  }

  async getMessageDetails(messageType) {
    return await this.bridge.getMessageDetails(messageType)
  }

  async getMessageTypes() {
    return await this.bridge.getMessageTypes()
  }

  subscribe(topicName, messageType, callback, throttleRate = null) {
    return this.bridge.subscribeTopic(topicName, messageType, callback, throttleRate)
  }

  unsubscribe(topicName, messageType) {
    this.bridge.unsubscribeTopic(topicName, messageType)
  }
}

class RosServiceAPI {
  constructor(rosBridgeManager) {
    this.bridge = rosBridgeManager
  }

  async call(serviceName, serviceType, request) {
    return await this.bridge.callService(serviceName, serviceType, request)
  }
}

class RosActionAPI {
  constructor(rosBridgeManager) {
    this.bridge = rosBridgeManager
  }

  createClient(actionName, actionType) {
    return this.bridge.createActionClient(actionName, actionType)
  }
}

class RosParamAPI {
  constructor(rosBridgeManager) {
    this.bridge = rosBridgeManager
  }

  async get(paramName) {
    return await this.bridge.getParam(paramName)
  }

  async set(paramName, value) {
    return await this.bridge.setParam(paramName, value)
  }

  async delete(paramName) {
    return await this.bridge.deleteParam(paramName)
  }
}

let globalRosAPI = null

export default {
  install(app, options = {}) {
    const rosBridgeManager = new RosBridgeManager()

    globalRosAPI = new RosGlobalAPI(rosBridgeManager)

    app.config.globalProperties.$ROS = globalRosAPI
    app.provide('$ROS', globalRosAPI)

    if (typeof window !== 'undefined') {
      window.$ROS = globalRosAPI
    }

    console.log('ROS Bridge插件已安装，默认服务器地址:', globalRosAPI.getServerUrl())
  }
}

export function useROS() {
  return globalRosAPI
}
