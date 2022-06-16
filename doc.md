## import \*.did.js

```javascript
import { Actor, HttpAgent } from '@dfinity/agent'
import { STORAGE_EMAIL_CID } from '@/candid/id'
import { idlFactory as SubscribeEmailDIL } from '@/candid/subscribe.did'
```

## create http agent and canister

```javascript
export default class CanManager {
  fetchSubscribeEmail = null

  constructor() {}

  async createCanister(idl, id) {
    const host = 'https://ic0.app/'
    const agent = new HttpAgent({ host })
    return Actor.createActor(idl, {
      agent,
      canisterId: id
    })
  }

  async getEmailFactory() {
    if (!this.fetchSubscribeEmail) this.fetchSubscribeEmail = await this.createCanister(SubscribeEmailDIL, STORAGE_EMAIL_CID)
    return this.fetchSubscribeEmail
  }
}
```

## Api.js

```javascript
import CanManager from './canManager'

const canManager = new CanManager()

export const fetchSubscribe = async ({ data }) => {
  const { email } = data
  const fetch = await canManager.getEmailFactory()
  const res = await fetch.add_subscriber(email)
  return res
}
```

## requestCanister.js

```javascript
const errorMessage = {
  network: 'The network is not good, please refresh the page!',
  Other: 'storageCanister is null'
}
const requestCanister = async (reqFunc, params) => {
  const { success, fail, close } = params
  try {
    const res = await reqFunc(params)
    if (res?.ok) {
      close && close()
      success && success(res?.ok)
    } else {
      console.warn('customo response error: ', res?.err)
      fail && fail(errorMessage[res?.err])
      close && close()
    }
  } catch (err) {
    close && close()
    console.error('catch error:', err)
  }
}

export default requestCanister
```

## page

```javascript
import requestCanister from '@/api/http'
import { fetchSubscribe } from '@/api/canApi'

const handleSubscribeEmail = async () => {
  setLoading(true)
  const params = {
    data: { email },
    success(res) {
      // do something
    },
    fail(err) {
      console.log('fail:', err)
      message.warn(err, 5)
    },
    close() {
      setLoading(false)
    }
  }
  await requestCanister(fetchSubscribe, params)
}
```
