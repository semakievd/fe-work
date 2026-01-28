<template>
  <el-button plain @click="open">
    Click to open the Message Box
  </el-button>
</template>

<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'

function open() {
  ElMessageBox.alert('This is a message', 'Title', {
    // if you want to disable its autofocus
    // autofocus: false,
    confirmButtonText: 'OK',
    callback: (action) => {
      ElMessage({
        type: 'info',
        message: `action: ${action}`,
      })
    },
  })
}
</script>
