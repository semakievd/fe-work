<template>
  <div class="qt-bridge-demo">
    <el-card class="demo-card">
      <template #header>
        <div class="card-header">
          <span>Qt桥接演示</span>
          <div class="header-tags">
            <el-tag type="info">组件ID: {{ componentId }}</el-tag>
            <el-tag :type="isReady ? 'success' : 'warning'">
              {{ isReady ? 'Qt已连接' : 'Qt连接中...' }}
            </el-tag>
          </div>
        </div>
      </template>

      <div class="demo-section">
        <h4>Web到Qt事件</h4>
        <el-space>
          <el-button type="primary"
                     @click="handleWebToQt">
            发送Web事件到Qt
          </el-button>
          <el-button type="success"
                     @click="handleCustomEvent">
            发送自定义事件1
          </el-button>
          <el-button type="success"
                     @click="testUserAction">
            发送自定义事件2
          </el-button>
        </el-space>
        <p class="event-counter">Web事件发送次数: {{ webEventCount }}</p>
      </div>

      <el-divider></el-divider>

      <div class="demo-section">
        <h4>Qt到Web事件</h4>
        <el-alert v-if="qtMessages.length > 0"
                  :title="'接收到 ' + qtMessages.length + ' 条Qt消息'"
                  type="success"
                  :closable="false">
          <ul class="message-list">
            <li v-for="(msg, index) in qtMessages" :key="index" class="message-item">
              <strong>{{ msg.evName }}:</strong> {{ msg.data }}
              <el-tag  class="time-tag">{{ msg.timestamp }}</el-tag>
            </li>
          </ul>
        </el-alert>
        <el-empty v-else description="等待Qt消息..." />
      </div>

      <el-divider></el-divider>

      <div class="demo-section">
        <h4>事件绑定演示</h4>
        <el-button type="warning"
                   @click="bindEventHandler">
          绑定Web2Qt事件处理器
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { getCurrentInstance, onMounted, ref } from 'vue'
import { useQtBridge } from '@/composables/useQtBridge.js'
import API from '~/api'

const { isReady, bind2QtEv } = useQtBridge()

const instance = getCurrentInstance()
const componentId = instance?.uid || 'unknown'
const webEventCount = ref(0)
const qtMessages = ref([])

// Web到Qt事件处理 - 使用API系统
const handleWebToQt = () => {
  webEventCount.value++
  API.web2qt_webButtonClick({
    message: `Web 按键点击 ${webEventCount.value}`,
    elementId: 'demo-button',
    componentId: componentId
  })
}

// 自定义事件处理 - 使用新的API系统
const handleCustomEvent = () => {
  API.web2qt_customWebEvent({
    message: '通过API发送的自定义事件',
    customData: {
      userId: 123,
      action: 'click',
      element: 'custom-button',
      timestamp: new Date().toLocaleString()
    }
  })
}

const testUserAction = () => {
  API.web2qt_userAction({
    userId: 12345,
    action: 'button_click',
    target: 'test_button',
    metadata: {
      page: 'demo',
      section: 'api_test'
    }
  })
}

const bindEventHandler = bind2QtEv('qt2web_customQtEvent', () => {
  console.log('绑定的事件处理器被触发')
  return {
    handlerType: 'qt2web_customQtEvent',
    message: '这是通过 bind2QtEv 绑定的事件'
  }
})

onMounted(() => {
  API.qt2web_qtButClicked(instance.uid, (data) => {
    qtMessages.value.unshift({
      evName: 'qt2web_qtButClicked',
      data: typeof data === 'string' ? data : JSON.stringify(data),
      timestamp: new Date().toLocaleString()
    })
  })

  API.qt2web_customQtEvent(instance.uid, (data) => {
    console.log({data})
    qtMessages.value.unshift({
      evName: 'qt2web_customQtEvent',
      data: typeof data === 'string' ? data : JSON.stringify(data),
      timestamp: new Date().toLocaleString()
    })
  })
})
</script>

<style lang="scss" scoped>
.demo-card {
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-tags {
  display: flex;
  gap: 8px;
  align-items: center;
}

.demo-section {
  margin: 20px 0;
}

.demo-section h4 {
  margin: 0 0 15px 0;
  color: #409eff;
}

.event-counter {
  margin-top: 10px;
  color: #606266;
  font-size: 14px;
}

.message-list {
  margin: 10px 0 0 0;
  padding: 0;
  list-style: none;
  max-height: 200px;
  overflow-y: auto;
}

.message-item {
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.time-tag {
  margin-left: 10px;
}
</style>
