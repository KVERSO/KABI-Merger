// import { message } from 'antd'
import ErrorMessage from './errorCode'

const errorMessage = {
  network: 'The network is not good, please refresh the page!',
  Other: 'storageCanister is null'
}
const requestCanister = async (reqFunc, params) => {
  const { success, fail, close } = params
  try {
    const res = await reqFunc(params)
    if (res?.ok !== null && res?.ok !== undefined) {
      close && close()
      success && success(res?.ok)
    } else {
      console.warn('customo response error: ', res?.err)
      if (res?.err){
        let message
        for (let key in res.err){
          if (res.err[key] === null){
            message = ErrorMessage[key]
            break
          }
        }
        if (message){
          fail && fail(message)
          close && close()
        }else{
           fail && fail(res?.err)
          close && close()
        }
      }
    }
  } catch (err) {
    close && close()
    console.error('catch error:', err)
  }
}

export default requestCanister
