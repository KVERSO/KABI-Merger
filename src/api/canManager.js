/**
 * create agent
 */
import { Actor, HttpAgent } from '@dfinity/agent'
import { AuthClient } from '@dfinity/auth-client'
import { Storage, principalToAccountId } from '../util'
import { Principal } from '@dfinity/principal'
import Plug from './plug'
import { StoicIdentity } from 'ic-stoic-identity'
import { DFINITY_TYPE, PLUG_TYPE, STOIC_TYPE } from './constants'

import { STORAGE_EMAIL_CID, WICP_INFO_CID, LEDGER_CANISTER_ID, II_LOCAL_URL } from '../candid/id'
import { idlFactory as SubscribeEmailDIL } from '../candid/subscribe.did'
import { idlFactory as WicpInfoDIL } from '../candid/wicpInfo.did'
import LedgerCanisterDIL from '../candid/ledger.did.js'
const EXPIRED_TIME = 24 * 60 * 60 * 1000 //一天 24 * 60 * 60 * 1000ms

const NFTFactoryInfos = {
  ledger: [LEDGER_CANISTER_ID, LedgerCanisterDIL],
  email: [STORAGE_EMAIL_CID, SubscribeEmailDIL],
  wicpInfo: [WICP_INFO_CID, WicpInfoDIL]
}

class CanManager {
  constructor() {
    this.canisterMap = new Map()
    this.plug = new Plug()
    this.loginType = null
  }

  getNFTFacotryIdByType(type) {
    let info = NFTFactoryInfos[type]
    if (info) {
      return info[0]
    }
  }

  // factor canister
  async getNftFactoryByType(type, isAuth) {
    let key = type
    if (isAuth) {
      key += '-auth'
    } else {
      key += '-noAuth'
    }
    let canister = this.canisterMap.get(key)
    if (!canister) {
      let info = NFTFactoryInfos[type]
      if (info) {
        canister = await this.createCanister(info[1], info[0], isAuth)
        this.canisterMap.set(key, canister)
      } else {
        throw `NFTFactorytype: ${type} not exist `
      }
    }
    return canister
  }

  async getAuthClient() {
    if (!this.authClient) {
      this.authClient = await AuthClient.create()
      this.identity = await this.authClient.getIdentity()
    }
    return this.authClient
  }

  async getIdentity() {
    if (!this.identity) {
      await this.getAuthClient()
    }
    return this.identity
  }

  async getIdentityAgent() {
    const identity = await this.getIdentity()
    let args = { identity }
    if (process.env.CANISTER !== 'local' && process.env.NODE_ENV === 'development') args['host'] = 'https://boundary.ic0.app/'
    if (!this.identityAgent) this.identityAgent = new HttpAgent(args)
    return this.identityAgent
  }

  async getStoicIdentityAgent() {
    if (!this.stoicIdentity) {
      return null
    }
    const identity = this.stoicIdentity
    let args = { identity }
    if (process.env.CANISTER !== 'local' && process.env.NODE_ENV === 'development') args['host'] = 'https://boundary.ic0.app/'
    if (!this.stoicIdentityAgent) {
      this.stoicIdentityAgent = new HttpAgent(args)
    }
    return this.stoicIdentityAgent
  }

  async dealWithDfinityIdentityInfo(callback) {
    if (this.loginType !== DFINITY_TYPE) {
      return
    }
    let authClient = await this.getAuthClient()
    let isLogin = await authClient.isAuthenticated()
    let identity = await authClient.getIdentity()
    let principal = identity.getPrincipal()
    let prinId = principal.toText()
    if (isLogin && prinId && prinId !== '2vxsx-fae') {
      let time = Storage.get('dfinityLoginTime')
      if (time) {
        let now = new Date().getTime()
        if (now - time > EXPIRED_TIME) {
          await authClient.logout()
          this.updateIdentity()
          this.loginType = null
          Storage.set('loginType', null)
          callback({ ok: { status: isLogin, accountId: '', prinId: '' } })
          return
        }
      }
      this.loginType = DFINITY_TYPE
      Storage.set('loginType', DFINITY_TYPE)
      let accountId = principalToAccountId(principal)
      callback({ ok: { status: isLogin, accountId: accountId, prinId: prinId } })
    } else {
      this.loginType = null
      Storage.set('loginType', null)
      callback({ ok: { status: isLogin, accountId: '', prinId: '' } })
    }
    return isLogin
  }

  async dealWithPlugIdentityInfo(callback) {
    if (!window.ic || !window.ic.plug) {
      callback({ error: 'noplug' })
      return
    }
    if (this.loginType !== PLUG_TYPE) {
      return
    }
    let connected = await this.plug.isConnected()
    if (connected) {
      this.loginType = PLUG_TYPE
      Storage.set('loginType', PLUG_TYPE)
      const plugPId = Storage.get('plugPrinId')
      if (plugPId) {
        const accountId = principalToAccountId(Principal.fromText(plugPId))
        callback({ ok: { status: connected, accountId: accountId, prinId: plugPId } })
      }
    } else {
      this.loginType = null
      Storage.set('loginType', null)
      Storage.set('plugPrinId', null)
      callback({ ok: { status: connected, accountId: '', prinId: '' } })
    }
  }
  async dealWithStoicIdentityInfo(identity, callback) {
    if (this.loginType !== STOIC_TYPE) {
      return
    }
    if (identity !== false) {
      //ID is a already connected wallet!
      if (identity._publicKey._der instanceof Object) {
        let res = []
        for (let key in identity._publicKey._der) {
          res.push(identity._publicKey._der[key])
        }
        let array = new Uint8Array(res, 0, res.length)
        identity._publicKey._der = array
      }
      this.updateIdentity()
      this.stoicIdentity = identity
      let principal = identity.getPrincipal()
      let prinId = principal.toText()
      const accountId = principalToAccountId(principal)
      identity.accounts().then((accs) => {
        console.log('accs ', accs, accountId)
      })
      this.loginType = STOIC_TYPE
      Storage.set('loginType', STOIC_TYPE)
      callback({ ok: { status: true, accountId: accountId, prinId: prinId } })
    } else {
      this.loginType = null
      this.stoicIdentity = null
      Storage.set('loginType', null)
      callback({ ok: { status: false, accountId: '', prinId: '' } })
    }
  }

  async dealWithStoicStatus(callback) {
    StoicIdentity.load().then(async (identity) => {
      this.dealWithStoicIdentityInfo(identity, callback)
    })
  }

  async initLoginStates(callback) {
    let loginType = Storage.get('loginType') || this.loginType
    if (!loginType) {
      //之前没有登陆
      callback({ ok: { status: false, accountId: '', prinId: '' } })
    } else {
      this.loginType = loginType
      if (loginType === DFINITY_TYPE) {
        this.dealWithDfinityIdentityInfo(callback)
      } else if (loginType === PLUG_TYPE) {
        let res = await this.plug.verifyConnectionAndAgent()
        res && this.dealWithPlugIdentityInfo(callback)
      } else if (loginType === STOIC_TYPE) {
        this.dealWithStoicStatus(callback)
      }
    }
  }

  async isLogin() {
    if (this.loginType === DFINITY_TYPE) {
      let authClient = await this.getAuthClient()
      const boolean = await authClient.isAuthenticated()
      return boolean
    } else if (this.loginType === PLUG_TYPE) {
      let res = await this.plug.isConnected()
      return res
    } else if (this.loginType === STOIC_TYPE) {
      let res = this.stoicIdentity ? true : false
      return res
    } else {
      return false
    }
  }

  async loginOut(callback) {
    callback({ ok: { status: false, accountId: '', prinId: '' } })
    if (this.loginType === PLUG_TYPE) {
      await this.plugLogout(callback)
    } else if (this.loginType === DFINITY_TYPE) {
      await this.authLoginOut(callback)
    } else if (this.loginType === STOIC_TYPE) {
      await this.stoicLogout(callback)
    }
    this.updateIdentity()
    Storage.set('loginType', null)
    this.loginType = null
  }

  async authLoginOut(callback) {
    let authClient = await this.getAuthClient()
    await authClient.logout()
  }

  async authLogin(callback) {
    this.loginType = DFINITY_TYPE
    let authClient = await this.getAuthClient()
    authClient.login({
      maxTimeToLive: BigInt(EXPIRED_TIME * 1000000), //24 * 60 * 60
      //maxTimeToLive: BigInt(null), //24 * 60 * 60
      identityProvider: II_LOCAL_URL,
      onSuccess: () => {
        if (this.loginType === DFINITY_TYPE) {
          Storage.set('dfinityLoginTime', new Date().getTime())
          this.updateIdentity()
          this.dealWithDfinityIdentityInfo(callback)
          setTimeout(() => {
            this.updateIdentity()
            this.dealWithDfinityIdentityInfo(callback)
          }, EXPIRED_TIME)
        }
      },
      onError: (error) => {
        console.error('login error ', error)
      }
    })
  }

  sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time))
  }

  getCurrentLoginType() {
    return this.loginType
  }

  async plugLogin(callback) {
    if (!window.ic || !window.ic.plug) {
      callback({ error: 'noplug' })
      return
    }

    this.loginType = PLUG_TYPE
    try {
      let res = await this.plug.requestConnect()
      if (res) {
        const maxTryTime = 300
        let times = 1
        let connected = await this.plug.isConnected()
        while (!connected && times < maxTryTime) {
          connected = await this.plug.isConnected()
          await this.sleep(100)
          times++
        }
        if (times >= maxTryTime) {
          throw 'timeout'
        }
        if (this.loginType === PLUG_TYPE) {
          this.updateIdentity()
          this.dealWithPlugIdentityInfo(callback)
        }
      } else {
        if (this.loginType === PLUG_TYPE) {
          this.loginType = null
          Storage.set('loginType', null)
        }
        this.plug.resetRequest()
        callback({ ok: { status: false, accountId: '', prinId: '' } })
      }
    } catch (err) {
      if (this.loginType === PLUG_TYPE) {
        this.loginType = null
        Storage.set('loginType', null)
      }
      this.plug.resetRequest()
      callback({ ok: { status: false, accountId: '', prinId: '' } })
      console.log('plugLogin error', err)
    }
  }

  plugLogout(callback) {}

  async stoicLogin(callback) {
    this.loginType = STOIC_TYPE
    let identity = await StoicIdentity.connect()
    if (this.loginType === STOIC_TYPE) {
      this.dealWithStoicIdentityInfo(identity, callback)
    }
  }

  async stoicLogout(callback) {
    await StoicIdentity.disconnect()
  }

  async createCanister(idl, id, needIdentity) {
    if (this.loginType === PLUG_TYPE && needIdentity) {
      return await this.plug.createActor(idl, id)
    }
    let agent
    if (this.loginType === STOIC_TYPE && needIdentity) {
      agent = await this.getStoicIdentityAgent()
    } else {
      agent = await this.getIdentityAgent()
    }
    if (agent) {
      if (process.env.NODE_ENV === 'development') {
        await agent.fetchRootKey()
      }
      return Actor.createActor(idl, {
        agent,
        canisterId: id
      })
    }
  }

  async getCurrentPrinId() {
    if (this.loginType === DFINITY_TYPE) {
      return (await this.getIdentity()).getPrincipal()
    } else if (this.loginType === PLUG_TYPE) {
      const plugPId = Storage.get('plugPrinId')
      if (plugPId) return Principal.fromText(plugPId)
    } else if (this.loginType === STOIC_TYPE) {
      if (this.stoicIdentity) return await this.stoicIdentity.getPrincipal()
    }
    return null
  }

  async getLedgerCanister(isAuth) {
    return this.getNftFactoryByType('ledger', isAuth)
  }

  async getEmailFactory() {
    return this.getNftFactoryByType('email', false)
  }

  async getWicpInfoFactory(isAuth) {
    return this.getNftFactoryByType('wicpInfo', isAuth)
  }

  updateIdentity() {
    this.identity = null
    this.authClient = null
    this.identityAgent = null
    this.interntIdentity = null
    this.stoicIdentity = null
    this.stoicIdentityAgent = null
    this.canisterMap.clear()
  }
}

export const canManager = new CanManager()
