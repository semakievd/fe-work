<template>
  <div class="ros-demo">
    <div class="header-section">
      <h2>ROS2 Bridge Test</h2>

      <div class="server-config">
        <h3 class="mb-2">ROS桥接服务器配置
          <el-tag :type="getConnectionStatusType()">
            {{ getConnectionStatusText() }}
          </el-tag>
        </h3>
        <el-form inline>
          <el-form-item label="服务器地址:">
            <el-input
              v-model="serverUrl"
              placeholder="ws://localhost:9090"
              style="width: 300px"
              :disabled="isConnected"
            ></el-input>
          </el-form-item>
          <el-form-item>
            <el-button @click="updateServerUrl"
                       type="info"
                       :disabled="isConnected">
              更新地址
            </el-button>
            <el-button @click="resetServerUrl"
                       type="warning"
                       :disabled="isConnected">
              重置默认
            </el-button>
          </el-form-item>
        </el-form>

        <div class="connection-status">
          <span v-if="connectionInfo.reconnectAttempts > 0" class="reconnect-info">
            (重连次数: {{ connectionInfo.reconnectAttempts }})
          </span>

          <el-button v-if="!isConnected"
                     @click="connectRos"
                     type="primary"
                     :loading="connecting"
                     :disabled="!serverUrl">
            连接ROS
          </el-button>
          <el-button v-else @click="disconnect" type="danger">断开连接</el-button>
          <el-button @click="refreshConnectionInfo" type="info">刷新状态</el-button>
        </div>
      </div>
    </div>

    <div v-if="isConnected" class="system-info">
      <h3 class="mb-2 mr-2">ROS系统信息
        <el-button @click="refreshAllSystemInfo">刷新
        </el-button>
      </h3>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card>
            <template #header>Topic / Msg</template>
            <el-scrollbar height="200px">
              <div v-for="item in systemInfo.topics" :key="item.topic" class="info-item flex-row">
                {{ item.topic }}
                <el-tag type="primary" @click="showMessageDetails(item.msg)">{{ item.msg }}</el-tag>
              </div>
            </el-scrollbar>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card>
            <template #header>Service</template>
            <el-scrollbar height="200px">
              <div v-for="service in systemInfo.services" :key="service" class="info-item">
                {{ service }}
              </div>
            </el-scrollbar>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card>
            <template #header>Node</template>
            <el-scrollbar height="200px">
              <div v-for="node in systemInfo.nodes" :key="node" class="info-item">
                {{ node }}
              </div>
            </el-scrollbar>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="publish-section">
      <h3 class="mb-2">发布消息</h3>
      <el-form inline>
        <el-form-item label="话题名:">
          <el-input v-model="publishTopic" placeholder="/chatter"></el-input>
        </el-form-item>
        <el-form-item label="消息类型:">
          <el-input v-model="publishMsgType" placeholder="std_msgs/String"></el-input>
        </el-form-item>
        <el-row>
          <el-form-item label="消息内容:" class="w-full">
            <div class="json-input-container w-full">
              <el-input v-model="publishMessage" class="mb-2"
                        placeholder="Hello ROS!"
                        type="textarea" />
              <div class="json-controls">
                <el-button @click="publishMsg" type="primary" :disabled="!isConnected">发布
                </el-button>
                <el-button @click="formatPublishMessageJson" type="info">格式化JSON</el-button>
                <el-button @click="clearPublishForm" type="info">清空</el-button>
              </div>
            </div>
          </el-form-item>
        </el-row>
      </el-form>

      <div class="message-templates">
        <el-tag>快速模板:</el-tag>
        <el-button v-for="template in messageTemplates"
                   :key="template.name"
                   @click="useTemplate(template)"
                   type="info">
          {{ template.name }}
        </el-button>
      </div>
    </div>

    <div class="subscribe-section">
      <h3 class="mb-2">订阅消息</h3>
      <el-form inline>
        <el-form-item label="话题名:">
          <el-input v-model="subscribeTopic" placeholder="/chatter"></el-input>
        </el-form-item>
        <el-form-item label="消息类型:">
          <el-input v-model="subscribeMsgType" placeholder="std_msgs/String"></el-input>
        </el-form-item>
        <el-form-item label="限流频率:">
          <el-input-number v-model="throttleRate"
                           :min="0"
                           :max="1000"
                           placeholder="可选，ms" />
        </el-form-item>
        <el-form-item>
          <el-button @click="subscribeToTopic" type="success" :disabled="!isConnected">
            订阅
          </el-button>
          <el-button @click="unsubscribeFromTopic" type="warning" :disabled="!isConnected">
            取消订阅
          </el-button>
          <el-button @click="clearMessages" type="info">
            清空消息
          </el-button>
        </el-form-item>
      </el-form>

      <div class="messages">
        <div class="messages-header">
          <h4>接收到的消息 ({{ receivedMessages.length }}条):</h4>
          <div class="messages-controls">
            <el-switch v-model="autoScroll" class="mr-4"
                       active-text="自动滚动"
                       inactive-text="" />
            <el-button @click="clearMessages" type="danger">
              清空消息
            </el-button>
          </div>
        </div>
        <el-scrollbar max-height="300px" class="p-2 box-msgs" ref="messageScrollbar">
          <div v-if="receivedMessages.length === 0" class="no-messages">
            暂无消息
          </div>
          <div v-for="(msg, index) in receivedMessages" :key="index" class="message-item">
            <div class="message-header">
              <el-tag>{{ msg.timestamp }}</el-tag>
              <el-tag type="info">{{ msg.topic }}</el-tag>
            </div>
            <pre class="message-content">{{ formatMessage(msg.content) }}</pre>
          </div>
        </el-scrollbar>
      </div>
    </div>

    <div class="service-section">
      <h3 class="mb-2">调用服务</h3>
      <el-form label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="服务名:">
              <el-input v-model="serviceName" placeholder="/add_two_ints"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="服务类型:">
              <el-input v-model="serviceType"
                        placeholder="example_interfaces/AddTwoInts"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="请求数据:">
          <div class="json-input-container w-full">
            <el-input v-model="serviceRequest" class="mb-2"
                      placeholder='{"a": 3, "b": 5}'
                      type="textarea" />
            <div class="json-controls">
              <el-button @click="formatServiceRequestJson" type="info">格式化JSON
              </el-button>
              <el-button @click="clearServiceForm" type="warning">清空</el-button>
            </div>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button @click="callRosService" type="primary" :disabled="!isConnected"
                     :loading="serviceLoading">
            调用服务
          </el-button>
        </el-form-item>
      </el-form>

      <div v-if="serviceResult" class="service-result">
        <h4>服务调用结果:</h4>
        <el-alert :title="`服务 ${serviceName} 调用${serviceResult.success ? '成功' : '失败'}`"
                  :type="serviceResult.success ? 'success' : 'error'"
                  show-icon>
          <pre>{{ formatMessage(serviceResult.data) }}</pre>
        </el-alert>
      </div>
    </div>

    <div class="param-section">
      <h3 class="mb-2">参数操作</h3>
      <el-form label-width="100px">
        <el-form-item label="参数名:">
          <el-input v-model="paramName" placeholder="/my_param"></el-input>
        </el-form-item>

        <el-form-item label="参数值:">
          <div class="json-input-container w-full">
            <el-input v-model="paramValue" class="mb-2"
                      placeholder="参数值"
                      type="textarea"
                      :rows="4" />
            <div class="json-controls">
              <el-button @click="formatParamValueJson" type="info">格式化JSON</el-button>
              <el-button @click="clearParamForm" type="warning">清空</el-button>
            </div>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button @click="getRosParam" type="info" :disabled="!isConnected">
            获取参数
          </el-button>
          <el-button @click="setRosParam" type="success" :disabled="!isConnected">
            设置参数
          </el-button>
          <el-button @click="deleteRosParam" type="danger" :disabled="!isConnected">
            删除参数
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="log-section">
      <h3 class="mb-2">连接日志</h3>
      <el-scrollbar max-height="200px" class="p-2 box-msgs">
        <div v-for="(log, index) in connectionLogs" :key="index" class="log-item">
          <el-tag :type="log.type">{{ log.timestamp }}</el-tag>
          <span :class="`log-${log.level}`">{{ log.message }}</span>
        </div>
      </el-scrollbar>
      <el-button @click="clearLogs" type="warning" style="margin-top: 10px">
        清空日志
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { useRos } from '@/composables/useRos.js'
import { ElMessage } from 'element-plus'
import { useJsonFormatter } from '@/utils/index.js'

const {
  isConnected,
  connect,
  disconnect,
  publish,
  subscribe,
  unsubscribe,
  callService,
  getParam,
  setParam,
  $ROS
} = useRos()

const serverUrl = ref('')
const connecting = ref(false)
const connectionInfo = ref({
  connected: false,
  reconnectAttempts: 0
})

// 系统信息加载状态
const systemInfoLoading = ref(false)

// 接口类型相关
const interfaces = ref({
  messages: [],
  services: [],
  actions: []
})
// const activeInterfaceTab = ref('messages')
// const interfaceDetailsDialog = ref(false)
// const selectedInterfaceDetails = ref(null)
// const activeDetailsTab = ref('fields')

const messageTypes = ref([])

const systemInfo = ref({
  topics: [],
  services: [],
  nodes: []
})

const createFormatterFor = (targetRef) => {
  const formatter = useJsonFormatter(targetRef)
  return () => {
    try {
      formatter()
    } catch (error) {
      console.error(error)
    }
  }
}


const connectRos = async () => {
  if (!serverUrl.value.trim()) {
    ElMessage.error('请输入ROS服务器地址')
    return
  }

  connecting.value = true
  try {
    await connect(serverUrl.value.trim())
    ElMessage.success('ROS连接成功')
    addLog('success', `成功连接到 ${serverUrl.value}`)
    connectionInfo.value.reconnectAttempts = 0

    await loadSystemInfo()
  } catch (error) {
    ElMessage.error(`ROS连接失败: ${error.message}`)
    addLog('error', `连接失败: ${error.message}`)
  } finally {
    connecting.value = false
  }
}

const updateServerUrl = () => {
  if (!serverUrl.value.trim()) {
    ElMessage.error('请输入有效的服务器地址')
    return
  }

  if (!$ROS.isValidUrl(serverUrl.value)) {
    return
  }

  $ROS.setServerUrl(serverUrl.value.trim())
  ElMessage.success('服务器地址已更新')
  addLog('info', `更新服务器地址: ${serverUrl.value}`)
}

const resetServerUrl = () => {
  $ROS.config.resetToDefault()
  serverUrl.value = $ROS.getServerUrl()
  ElMessage.success('已重置为默认地址')
}

const refreshConnectionInfo = () => {
  connectionInfo.value = $ROS.getConnectionStatus()
}

const getConnectionStatusType = () => {
  if (isConnected.value) return 'success'
  if (connectionInfo.value.reconnectAttempts > 0) return 'warning'
  return 'danger'
}

const getConnectionStatusText = () => {
  if (isConnected.value) return '已连接'
  if (connecting.value) return '连接中...'
  if (connectionInfo.value.reconnectAttempts > 0) return '重连中'
  return '未连接'
}

const loadSystemInfo = async () => {
  await Promise.all([
    loadTopics(),
    loadServices(),
    loadNodes()
  ])
}

const loadTopics = async () => {
  try {
    const { topics, types: msgs } = await $ROS.getTopics()
    systemInfo.value.topics = topics.map((topic, idx) =>
      ({ topic: topic, msg: msgs[idx] })
    )
  } catch (error) {
    console.error('加载话题列表失败:', error)
  }
}

const loadServices = async () => {
  try {
    systemInfo.value.services = await $ROS.getServices()
  } catch (error) {
    console.error('加载服务列表失败:', error)
  }
}

const loadNodes = async () => {
  try {
    systemInfo.value.nodes = await $ROS.getNodes()
  } catch (error) {
    console.error('加载节点列表失败:', error)
  }
}

const messageTemplates = [
  {
    name: 'String消息',
    topic: '/chatter',
    messageType: 'std_msgs/String',
    message: '{"data": "Hello ROS2!"}'
  },
  {
    name: 'Twist消息',
    topic: '/cmd_vel',
    messageType: 'geometry_msgs/Twist',
    message: '{"linear": {"x": 0.5, "y": 0, "z": 0}, "angular": {"x": 0, "y": 0, "z": 0.5}}'
  },
  {
    name: 'Empty消息',
    topic: '/trigger',
    messageType: 'std_msgs/Empty',
    message: '{}'
  }
]

const publishTopic = ref('/chatter')
const publishMsgType = ref('std_msgs/String')
const publishMessage = ref('{"data": "Hello ROS!"}')
const serviceRequest = ref('{"a": 3, "b": 5}')
const paramName = ref('/my_param')
const paramValue = ref('{"a": 123}')

const formatPublishMessageJson = createFormatterFor(publishMessage)
const formatServiceRequestJson = createFormatterFor(serviceRequest)
const formatParamValueJson = createFormatterFor(paramValue)

const publishMsg = () => {
  try {
    let messageData
    try {
      messageData = JSON.parse(publishMessage.value)
    } catch {
      messageData = { data: publishMessage.value }
    }

    publish(publishTopic.value, publishMsgType.value, messageData)
    ElMessage.success('消息发布成功')
    addLog('info', `发布消息到 ${publishTopic.value}`)
  } catch (error) {
    ElMessage.error(`消息发布失败: ${error.message}`)
    addLog('error', `发布失败: ${error.message}`)
  }
}

const useTemplate = (template) => {
  publishTopic.value = template.topic
  publishMsgType.value = template.messageType
  publishMessage.value = template.message
}

const clearPublishForm = () => {
  publishTopic.value = ''
  publishMsgType.value = ''
  publishMessage.value = ''
}

const subscribeTopic = ref('/chatter')
const subscribeMsgType = ref('std_msgs/String')
const throttleRate = ref(null)
const receivedMessages = ref([])
const autoScroll = ref(true)
const messageScrollbar = ref(null)

const subscribeToTopic = () => {
  try {
    const throttle = throttleRate.value > 0 ? throttleRate.value : null

    subscribe(subscribeTopic.value, subscribeMsgType.value, (message) => {
      const newMessage = {
        timestamp: new Date().toLocaleString(),
        topic: subscribeTopic.value,
        content: message
      }

      receivedMessages.value.unshift(newMessage)

      if (receivedMessages.value.length > 100) {
        receivedMessages.value = receivedMessages.value.slice(0, 100)
      }

      if (autoScroll.value) {
        nextTick(() => {
          messageScrollbar.value?.setScrollTop(0)
        })
      }
    }, throttle)

    ElMessage.success(`已订阅话题 ${subscribeTopic.value}`)
    addLog('info', `订阅话题 ${subscribeTopic.value}`)
  } catch (error) {
    ElMessage.error(`订阅失败: ${error.message}`)
    addLog('error', `订阅失败: ${error.message}`)
  }
}

const unsubscribeFromTopic = () => {
  try {
    unsubscribe(subscribeTopic.value, subscribeMsgType.value)
    ElMessage.success(`已取消订阅话题 ${subscribeTopic.value}`)
    addLog('info', `取消订阅话题 ${subscribeTopic.value}`)
  } catch (error) {
    ElMessage.error(`取消订阅失败: ${error.message}`)
    addLog('error', `取消订阅失败: ${error.message}`)
  }
}

const clearMessages = () => {
  receivedMessages.value = []
}

const serviceName = ref('/add_two_ints')
const serviceType = ref('example_interfaces/AddTwoInts')
const serviceResult = ref(null)
const serviceLoading = ref(false)

const callRosService = async () => {
  serviceLoading.value = true
  try {
    let request
    try {
      request = JSON.parse(serviceRequest.value)
    } catch {
      console.error('请求数据格式错误，请使用有效的JSON格式')
    }

    const result = await callService(serviceName.value, serviceType.value, request)
    serviceResult.value = {
      success: true,
      data: result
    }
    ElMessage.success('服务调用成功')
    addLog('info', `服务调用成功: ${serviceName.value}`)
  } catch (error) {
    serviceResult.value = {
      success: false,
      data: error.message
    }
    ElMessage.error(`服务调用失败: ${error.message}`)
    addLog('error', `服务调用失败: ${error.message}`)
  } finally {
    serviceLoading.value = false
  }
}

const getRosParam = async () => {
  try {
    const value = await getParam(paramName.value)
    paramValue.value = JSON.stringify(value, null, 2)
    ElMessage.success(`参数获取成功`)
    addLog('info', `获取参数: ${paramName.value}`)
  } catch (error) {
    ElMessage.error(`获取参数失败: ${error.message}`)
    addLog('error', `获取参数失败: ${error.message}`)
  }
}

const setRosParam = async () => {
  try {
    let value = paramValue.value
    try {
      value = JSON.parse(paramValue.value)
    } catch (err) {
      ElMessage.error('JSON格式无效，无法格式化')
      console.error(err)
    }

    await setParam(paramName.value, value)
    ElMessage.success('参数设置成功')
    addLog('info', `设置参数: ${paramName.value}`)
  } catch (error) {
    ElMessage.error(`设置参数失败: ${error.message}`)
    addLog('error', `设置参数失败: ${error.message}`)
  }
}

const deleteRosParam = async () => {
  try {
    await $ROS.param.delete(paramName.value)
    ElMessage.success('参数删除成功')
    addLog('info', `删除参数: ${paramName.value}`)
  } catch (error) {
    ElMessage.error(`删除参数失败: ${error.message}`)
    addLog('error', `删除参数失败: ${error.message}`)
  }
}

const connectionLogs = ref([])

const addLog = (level, message) => {
  const log = {
    timestamp: new Date().toLocaleString(),
    level,
    type: level === 'error' ? 'danger' : level === 'success' ? 'success' : 'info',
    message
  }
  connectionLogs.value.unshift(log)

  if (connectionLogs.value.length > 50) {
    connectionLogs.value = connectionLogs.value.slice(0, 50)
  }
}

const clearLogs = () => {
  connectionLogs.value = []
}

const loadMessageTypes = async () => {
  try {
    console.log({ $ROS })
    messageTypes.value = await $ROS.getMessageTypes()
    console.log('messageTypes.value', messageTypes.value)
    addLog('info', `加载到 ${messageTypes.value.length} 种消息类型`)
  } catch (error) {
    console.error('加载消息类型失败:', error)
    addLog('warning', '消息类型列表加载失败，但不影响其他功能')
  }
}

// 显示消息详情
const showMessageDetails = async (messageType) => {
  try {
    const result = await $ROS.msg.getMessageDetails(messageType)
    console.log(result)
  } catch (error) {
    ElMessage.error(`获取消息详情失败: ${error.message}`)
  }
}

const refreshAllSystemInfo = async () => {
  systemInfoLoading.value = true
  try {
    await Promise.all([
      loadTopics(),
      loadServices(),
      loadNodes(),
      loadMessageTypes()
    ])
    ElMessage.success('系统信息刷新完成')
    addLog('success', '系统信息已全部刷新')
  } catch (error) {
    ElMessage.error(`刷新系统信息失败: ${error.message}`)
    addLog('error', `刷新系统信息失败: ${error.message}`)
  } finally {
    systemInfoLoading.value = false
  }
}


// 清空表单功能
const clearServiceForm = () => {
  serviceRequest.value = ''
}

const clearParamForm = () => {
  paramValue.value = ''
}

const formatMessage = (data) => {
  if (typeof data === 'string') return data
  return JSON.stringify(data, null, 2)
}

onMounted(() => {
  serverUrl.value = import.meta.env.VITE_ROS_BRIDGE_URL

  $ROS.onConnectionChange((info) => {
    connectionInfo.value = info
    if (info.connected) {
      addLog('success', `连接成功: ${info.url}`)
    } else if (info.error) {
      addLog('error', `连接错误: ${info.error.message || info.error}`)
    } else {
      addLog('info', '连接已断开')
    }
  })

  addLog('info', 'ROS测试平台已加载')
})

onUnmounted(() => {
  if (isConnected.value) {
    disconnect()
  }
})
</script>

<style lang="scss" scoped>
.ros-demo {
  padding: 20px;
  margin: 0 auto;
}

.header-section {
  margin-bottom: 30px;

  .server-config {
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 20px;

    h3 {
      margin-top: 0;
    }
  }
}

.connection-status {
  margin-top: 15px;
  display: flex;
  align-items: center;
  gap: 10px;

  .reconnect-info {
    color: #909399;
    font-size: 12px;
  }
}

.system-info {
  margin-bottom: 30px;

  .info-item {
    padding: 4px 0;
    font-size: 12px;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }
  }
}

.server-config,
.publish-section,
.subscribe-section,
.service-section,
.param-section,
.log-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background-color: #fff;

  h3 {
    margin-top: 0;
    color: #409eff;
  }
}

.message-templates {
  margin-top: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.messages {
  margin-top: 15px;

  .messages-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    h4 {
      margin: 0;
    }
  }
}

.message-item {
  margin-bottom: 10px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;

  .message-header {
    display: flex;
    gap: 10px;
    margin-bottom: 8px;
  }

  .message-content {
    margin: 0;
    font-size: 12px;
    max-height: 100px;
    overflow-y: auto;
    background-color: #fff;
    padding: 8px;
    border-radius: 4px;
  }
}

.service-result {
  margin-top: 15px;

  pre {
    margin: 10px 0 0 0;
    font-size: 12px;
  }
}

.log-section {
  .log-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 0;
    font-size: 12px;

    .log-success {
      color: #67c23a;
    }

    .log-error {
      color: #f56c6c;
    }

    .log-info {
      color: #409eff;
    }
  }
}

.interface-tabs {
  .el-tabs__content {
    padding: 8px 0;
  }

  .el-tab-pane {
    height: 120px;
  }
}

.interface-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;

  h4 {
    margin: 0;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }
}

.example-section {
  .example-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    span {
      font-weight: 500;
    }
  }
}

.json-example, .raw-definition {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 16px;
  font-size: 13px;
  line-height: 1.5;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow-y: auto;
}

.no-fields {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.box-msgs {
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
}

@media (max-width: 768px) {
  .ros-demo {
    padding: 10px;
  }

  .el-form--inline .el-form-item {
    display: block;
    margin-bottom: 10px;
  }

  .connection-status {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
