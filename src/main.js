import './assets/main.css'
import 'virtual:uno.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import ElementPlus from 'element-plus'

import '@/styles/index.scss'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'
import qtBridgePlugin from './plugins/qtBridge.js'
import rosBridgePlugin from './plugins/rosBridge.js'

const app = createApp(App)

app.use(createPinia())
app.use(router).use(ElementPlus)
app.use(qtBridgePlugin)
app.use(rosBridgePlugin)


for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')
