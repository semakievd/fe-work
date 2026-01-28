<template>
  <h1 color="$ep-color-primary">
    hello
  </h1>

  <div class="mb-4">
    <el-button size="large" @click="toast">
      El Message
    </el-button>

    <MessageBoxDemo />
  </div>

  <div class="my-2 flex flex-wrap items-center justify-center text-center">
    <el-button @click="count++">
      count is: {{ count }}
    </el-button>
    <el-button type="primary" @click="count++">
      count is: {{ count }}
    </el-button>
    <el-button type="success" @click="count++">
      count is: {{ count }}
    </el-button>
    <el-button type="warning" @click="count++">
      count is: {{ count }}
    </el-button>
    <el-button type="danger" @click="count++">
      count is: {{ count }}
    </el-button>
    <el-button type="info" @click="count++">
      count is: {{ count }}
    </el-button>
  </div>

  <div>
    <el-tag class="m-1" type="success">
      Tag 1
    </el-tag>
    <el-tag class="m-1" type="warning">
      Tag 1
    </el-tag>
    <el-tag class="m-1" type="danger">
      Tag 1
    </el-tag>
    <el-tag class="m-1" type="info">
      Tag 1
    </el-tag>
  </div>

  <div>
    <el-switch v-model="value1" />
    <el-switch
      v-model="value1"
      class="m-2"
      style="--ep-switch-on-color: black; --ep-switch-off-color: gray;"
    />
  </div>

  <div class="my-2">
    <el-input v-model="input" class="m-2" style="width: 200px" />
    <el-date-picker
      v-model="curDate"
      class="m-2"
      placeholder="Pick a day"
      type="date"
    />
  </div>

  <p>
    Edit
    <code>components/HelloWorld.vue</code> to test components.
  </p>
  <p>
    Edit
    <code>styles/element/var.scss</code> to test scss variables.
  </p>

  <p>
    Full Example:
    <a
      href="https://github.com/element-plus/element-plus-vite-starter"
      target="_blank"
    >element-plus-vite-starter</a>
    | On demand Example:
    <a
      href="https://github.com/element-plus/unplugin-element-plus"
      target="_blank"
    >unplugin-element-plus/examples/vite</a>
  </p>
</template>

<script lang="js" setup>
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import MessageBoxDemo from '@/components/MessageBoxDemo.vue'

const count = ref(0)
const input = ref('hello world')

const curDate = ref('')

function toast() {
  ElMessage.success('Hello')
}

const value1 = ref(true)
</script>

<style lang="scss" scoped>
.ep-button {
  margin: 4px;
}

.ep-button + .ep-button {
  margin-left: 0;
  margin: 4px;
}
</style>
