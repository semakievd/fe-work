export class QtEventManager {
  constructor() {
    this.qt2webListeners = new Map()
    this.componentListeners = new Map()
    this.initialized = false
    this.initPromise = null
    this.channel = null
    this.webBridge = null
  }

  init() {
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (this.initialized) {
        resolve()
        return
      }

      // 检查是否在Qt环境中
      if (typeof window.qt === 'undefined') {
        console.warn('Qt环境未检测到')
        // this.createMockWebBridge()
        resolve()
        return
      }

      // 检查QWebChannel是否可用
      if (typeof window.QWebChannel === 'undefined') {
        console.error('QWebChannel未检测到，请确保已引入qwebchannel.js')
        reject(new Error('QWebChannel not available'))
        return
      }

      try {
        // 创建QWebChannel连接
        this.channel = new window.QWebChannel(window.qt.webChannelTransport, (channel) => {
          console.log('QWebChannel初始化成功', { qt: window.qt, channel })

          this.webBridge = channel.objects.WebBridgeChannel
          window.WebBridge = this.webBridge

          if (this.webBridge) {
            this.webBridge.sig_qt2web?.connect((evName, msg) => {
              console.log('收到QT事件:', evName, msg)
              this.handleQt2Web(evName, msg)
            })

            this.initialized = true
            console.log('WebBridge初始化完成')
            resolve()
          } else {
            console.error('WebBridgeChannel对象未找到，请检查Qt端registerObject注册')
            reject(new Error('WebBridgeChannel not found'))
          }
        })
      } catch (error) {
        console.error('QWebChannel初始化失败:', error)
        reject(error)
      }
    })

    return this.initPromise
  }

  createMockWebBridge() {
    window.WebBridge = {
      on_web2qt: (evName, payload) => {
        console.log('on_web2qt:', evName, payload)
        this.handleQt2Web(evName, payload)
      },
      sig_qt2web: {
        connect: () => console.log('WebBridge.sig_qt2web.connect')
      }
    }

    this.webBridge = window.WebBridge
    this.initialized = true
  }

  handleQt2Web(evName, payload) {
    const listeners = this.qt2webListeners.get(evName)
    if (listeners && listeners.size > 0) {
      try {
        let data
        if (typeof payload === 'string') {
          try {
            data = JSON.parse(payload)
          } catch {
            data = payload // 如果不是JSON，直接使用字符串
          }
        } else {
          data = payload
        }

        listeners.forEach(callback => {
          try {
            callback(data)
          } catch (error) {
            console.error(`Qt2Web事件处理错误 [${evName}]:`, error)
          }
        })
      } catch (error) {
        console.error(`Qt2Web事件解析错误 [${evName}]:`, error, payload)
      }
    }
  }

  onQt2Web(componentId, evName, callback) {
    console.log('onQt2Web', { componentId, evName, callback })

    if (!this.qt2webListeners.has(evName)) {
      this.qt2webListeners.set(evName, new Set())
    }

    this.qt2webListeners.get(evName).add(callback)

    // 记录组件级监听器，用于清理
    if (!this.componentListeners.has(componentId)) {
      this.componentListeners.set(componentId, new Set())
    }
    this.componentListeners.get(componentId).add({ evName, callback })
  }

  emitWeb2Qt(evName, data) {
    if (!this.webBridge || !this.webBridge.on_web2qt) {
      console.warn('WebBridge未初始化或on_web2qt方法不可用')
      return
    }

    try {
      const payload = typeof data === 'string' ? data : JSON.stringify(data)
      console.log('发送Web2Qt事件:', evName, payload)
      this.webBridge.on_web2qt(evName, payload)
    } catch (error) {
      console.error(`Web2Qt事件发送错误 [${evName}]:`, error)
    }
  }

  cleanup(componentId) {
    const listeners = this.componentListeners.get(componentId)
    listeners?.forEach(({ evName, callback }) => {
      const eventListeners = this.qt2webListeners.get(evName)
      if (eventListeners) {
        eventListeners.delete(callback)
        if (eventListeners.size === 0) {
          this.qt2webListeners.delete(evName)
        }
      }
    })
    this.componentListeners.delete(componentId)
  }

  isInitialized() {
    return this.initialized
  }

  waitForInit() {
    return this.initPromise || Promise.resolve()
  }
}

import { ApiQtManager, setGlobalQtApiManager } from '@/utils/apiQtManager.js'

const qtEventManager = new QtEventManager()

export default {
  install(app) {
    app.config.globalProperties.$qtBridge = qtEventManager

    app.provide('qtBridge', qtEventManager)

    const apiManager = new ApiQtManager(qtEventManager)
    setGlobalQtApiManager(apiManager)

    app.config.globalProperties.$qtApi = apiManager
    app.provide('qtApi', apiManager)

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        qtEventManager.init().catch(error => {
          console.error('QtEventManager初始化失败:', error)
        })
      })
    } else {
      qtEventManager.init().catch(error => console.error('QtEventManager初始化失败:', error))
    }
  }
}
