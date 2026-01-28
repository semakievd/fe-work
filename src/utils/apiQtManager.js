export class ApiQtManager {
  constructor(qtBridge) {
    this.qtBridge = qtBridge
  }

  sendToQt(eventName, payload, options = {}) {
    const defaultOptions = {
      timestamp: new Date().toLocaleString(),
      source: 'web',
      ...options
    }

    const eventData = {
      ...defaultOptions,
      payload
    }

    return this.qtBridge.emitWeb2Qt(eventName, eventData)
  }

  listenFromQt(componentId, eventName, cb) {
    return this.qtBridge.onQt2Web(componentId, eventName, cb)
  }

  batchSendToQt(events) {
    return Promise.all(
      events.map(event =>
        this.sendToQt(event.eventName, event.payload, event.options)
      )
    )
  }

  createSender(eventName, dataProcessor) {
    return (payload, options) => {
      const processedPayload = dataProcessor(payload)
      return this.sendToQt(eventName, processedPayload, options)
    }
  }

  createListener(eventName, dataProcessor) {
    return (componentId, callback) => {
      const wrappedCallback = (data) => {
        const processedData = dataProcessor(data)
        callback(processedData)
      }
      return this.listenFromQt(componentId, eventName, wrappedCallback)
    }
  }
}

let globalApiManager = null

export function setGlobalQtApiManager(apiManager) {
  globalApiManager = apiManager
}

export function getGlobalQtApiManager() {
  if (!globalApiManager) {
    throw new Error('API管理器未初始化，请先调用setGlobalApiManager')
  }
  return globalApiManager
}
