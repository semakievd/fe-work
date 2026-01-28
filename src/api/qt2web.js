import { getGlobalQtApiManager } from '@/utils/apiQtManager.js'

const getApiManager = () => getGlobalQtApiManager()

export const qt2web_qtButClicked = (componentId, callback) => {
  const type = 'qt2web_qtButClicked'
  return getApiManager().listenFromQt(componentId, type, (data) => {
    callback({
      type,
      ...data
    })
  })
}

export const qt2web_statusUpdate = (componentId, callback) => {
  const type = 'qt2web_statusUpdate'
  return getApiManager().listenFromQt(componentId, type, (data) => {
    callback({
      type,
      ...data
    })
  })
}

export const qt2web_customQtEvent = (componentId, callback) => {
  const type = 'qt2web_customQtEvent'
  return getApiManager().listenFromQt(componentId, type, (data) => {
    callback({
      type,
      ...data
    })
  })
}


export const QT2WEB_API = {
  qt2web_qtButClicked,
  qt2web_statusUpdate,
  qt2web_customQtEvent
}
