// ROS Bridge 配置管理
class RosConfig {
  constructor() {
    this.defaultUrl = import.meta.env.VITE_ROS_BRIDGE_URL
    this.loadUserConfig()
  }

  loadUserConfig() {
    try {
      const savedUrl = localStorage.getItem('ros_bridge_url')
      if (savedUrl) {
        this.userUrl = savedUrl
      } else {
        this.userUrl = this.defaultUrl
      }
    } catch (error) {
      console.warn('加载ROS配置失败，使用默认配置:', error)
      this.userUrl = this.defaultUrl
    }
  }

  saveUserConfig() {
    try {
      localStorage.setItem('ros_bridge_url', this.userUrl)
    } catch (error) {
      console.error('保存ROS配置失败:', error)
    }
  }

  getUrl() {
    return this.userUrl
  }

  setUrl(url) {
    if (!this.isValidUrl(url)) {
      throw new Error('URL格式无效，请使用 ws:// 或 wss:// 协议')
    }
    this.userUrl = url
    this.saveUserConfig()
  }

  resetToDefault() {
    this.userUrl = this.defaultUrl
    this.saveUserConfig()
  }

  isValidUrl(url) {
    try {
      const urlObj = new URL(url)
      return ['ws:', 'wss:'].includes(urlObj.protocol)
    } catch {
      return false
    }
  }

  getDefaultUrl() {
    return this.defaultUrl
  }
}

// 创建全局实例
const rosConfig = new RosConfig()

export default rosConfig
export { RosConfig }
