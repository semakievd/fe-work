// export * from './web2qt.js'
// export * from './qt2web.js'

import * as WEB2QT from './web2qt.js'
import * as QT2WEB from './qt2web.js'


export default {
  ...WEB2QT,
  ...QT2WEB
}

export { WEB2QT_API } from './web2qt.js'
export { QT2WEB_API } from './qt2web.js'
