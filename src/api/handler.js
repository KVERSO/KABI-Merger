import { canManager } from './canManager'
import { DFINITY_TYPE, PLUG_TYPE, STOIC_TYPE } from './constants'

export async function initLoginStates(callback) {
  return await canManager.initLoginStates(callback)
}

export async function isLogin() {
  return await canManager.isLogin()
}

export async function authLoginOut(callback) {
  await canManager.loginOut(callback)
}

export async function authLogin(type, callback) {
  console.debug('type = ', type, DFINITY_TYPE)
  if (type === DFINITY_TYPE) {
    await canManager.authLogin(callback)
  } else if (type === PLUG_TYPE) {
    await canManager.plugLogin(callback)
  } else if (type === STOIC_TYPE) {
    await canManager.stoicLogin(callback)
  }
}
