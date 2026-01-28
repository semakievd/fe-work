import { getGlobalQtApiManager } from '@/utils/apiQtManager.js'

const getApiManager = () => getGlobalQtApiManager()

export const web2qt_webButtonClick = (data) => {
  return getApiManager().sendToQt('web2qt_webButtonClick', {
    type: 'webButtonClick',
    ...data
  })
}

export const web2qt_customWebEvent = (data) => {
  return getApiManager().sendToQt('web2qt_customWebEvent', {
    type: 'web2qt_customWebEvent',
    ...data
  })
}

export const web2qt_userAction = (data) => {
  return getApiManager().sendToQt('web2qt_userAction', {
    type: 'web2qt_userAction',
    ...data
  })
}


export const WEB2QT_API = {
  web2qt_webButtonClick,
  web2qt_customWebEvent,
  web2qt_userAction
}
