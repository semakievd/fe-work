import { ref, inject, onUnmounted, getCurrentInstance } from 'vue'

export function useRos() {
  const $ROS = inject('$ROS')
  const instance = getCurrentInstance()
  const componentId = instance?.uid

  if (!$ROS) {
    throw new Error('useRos必须在安装了ROS插件的组件中使用')
  }

  const isConnected = ref($ROS.isConnected)
  const topics = ref(new Set())
  const subscribers = ref([])

  const connect = async (url = import.meta.env.VITE_ROS_BRIDGE_URL) => {
    try {
      await $ROS.connect(url)
      isConnected.value = true
    } catch (error) {
      console.error('ROS连接失败:', error)
      isConnected.value = false
      throw error
    }
  }

  const disconnect = () => {
    $ROS.disconnect()
    isConnected.value = false
  }

  const publish = (topicName, messageType, message) => {
    if (!isConnected.value) {
      console.warn('ROS未连接，无法发布消息')
      return
    }
    $ROS.msg.publish(topicName, messageType, message)
  }

  const subscribe = (topicName, messageType, callback, throttleRate = null) => {
    if (!isConnected.value) {
      console.warn('ROS未连接，无法订阅话题')
      return null
    }

    const topic = $ROS.msg.subscribe(topicName, messageType, callback, throttleRate)
    if (topic) {
      subscribers.value.push({ topicName, messageType, topic })
      topics.value.add(topicName)
    }
    return topic
  }

  const unsubscribe = (topicName, messageType) => {
    $ROS.msg.unsubscribe(topicName, messageType)

    const index = subscribers.value.findIndex(
      sub => sub.topicName === topicName && sub.messageType === messageType
    )
    if (index !== -1) {
      subscribers.value.splice(index, 1)
    }

    const hasOtherSubs = subscribers.value.some(sub => sub.topicName === topicName)
    if (!hasOtherSubs) {
      topics.value.delete(topicName)
    }
  }

  const callService = async (serviceName, serviceType, request) => {
    if (!isConnected.value) {
      throw new Error('ROS未连接，无法调用服务')
    }
    return await $ROS.srv.call(serviceName, serviceType, request)
  }

  const getParam = async (paramName) => {
    if (!isConnected.value) {
      throw new Error('ROS未连接，无法获取参数')
    }
    return await $ROS.param.get(paramName)
  }

  const setParam = async (paramName, value) => {
    if (!isConnected.value) {
      throw new Error('ROS未连接，无法设置参数')
    }
    return await $ROS.param.set(paramName, value)
  }

  const createActionClient = (actionName, actionType) => {
    if (!isConnected.value) {
      console.warn('ROS未连接，无法创建Action客户端')
      return null
    }
    return $ROS.action.createClient(actionName, actionType)
  }

  onUnmounted(() => {
    subscribers.value.forEach(({ topicName, messageType }) => {
      unsubscribe(topicName, messageType)
    })
  })

  return {
    isConnected,
    topics,
    subscribers,

    connect,
    disconnect,

    publish,
    subscribe,
    unsubscribe,

    callService,

    getParam,
    setParam,

    createActionClient,

    $ROS
  }
}
