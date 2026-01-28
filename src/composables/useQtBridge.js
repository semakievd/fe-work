import { getCurrentInstance, inject, onUnmounted, ref } from 'vue'

export function useQtBridge() {
    const qtBridge = inject('qtBridge')
    const instance = getCurrentInstance()
    const componentId = instance?.uid
    const isReady = ref(false)

    if (!qtBridge) {
        throw new Error('useQtBridge必须在安装了qtBridge插件的组件中使用')
    }

    qtBridge.waitForInit().then(() => {
        isReady.value = true
    }).catch(error => {
        console.error('Qt桥接初始化失败:', error)
    })

    // 注册Qt到Web的事件监听
    const connectQt2WebEv = (evName, callback) => {
        if (qtBridge.isInitialized()) {
            qtBridge.onQt2Web(componentId, evName, callback)
        } else {
            qtBridge.waitForInit().then(() => {
                qtBridge.onQt2Web(componentId, evName, callback)
            })
        }
    }

    const emitWeb2Qt = (evName, data = {}) => {
        if (qtBridge.isInitialized()) {
            qtBridge.emitWeb2Qt(evName, data)
        } else {
            qtBridge.waitForInit().then(() => {
                qtBridge.emitWeb2Qt(evName, data)
            })
        }
    }

    const bind2QtEv = (evName, eventHandler) => {
        return () => {
            const sendEvent = () => {
                if (typeof eventHandler === 'function') {
                    const result = eventHandler()
                    // 如果事件处理器返回数据，将其作为事件数据发送
                    emitWeb2Qt(evName, result || {
                        timestamp: new Date().toLocaleString(),
                        componentId
                    })
                } else {
                    emitWeb2Qt(evName, {
                        timestamp: new Date().toLocaleString(),
                        componentId
                    })
                }
            }

            if (qtBridge.isInitialized()) {
                sendEvent()
            } else {
                qtBridge.waitForInit().then(sendEvent)
            }
        }
    }

    // 组件卸载时清理本组件监听器
    onUnmounted(() => {
        qtBridge.cleanup(componentId)
    })

    return {
        connectQt2WebEv,
        emitWeb2Qt,
        bind2QtEv,
        isReady
    }
}
