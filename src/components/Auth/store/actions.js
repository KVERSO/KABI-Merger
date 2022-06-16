import * as constants from './constants'
import { authLogin, authLoginOut, initLoginStates } from '../../../api/handler'
import { balanceICP, balanceWICP } from '../../../api/canApi'
import requestCanister from '../../../api/http'

export const setAuthStatus = (value) => ({
  type: constants.SET_AUTH_STATUS,
  value
})

export const setAuthToken = (text) => ({
  type: constants.SET_AUTH_TOKEN,
  value: text
})

export const setICPBalance = (text) => ({
  type: constants.SET_AUTH_ICP_BALANCE,
  value: text
})

export const setWICPBalance = (text) => ({
  type: constants.SET_AUTH_WICP_BALANCE,
  value: text
})

const dealWithResult = (dispatch, res, callback) => {
  if (res.ok) {
    dispatch(setAuthStatus(res.ok.status))
    dispatch(setAuthToken(res.ok.prinId))
    if (!res.ok.status) {
      dispatch(setICPBalance(0))
      dispatch(setWICPBalance(0))
    }
  }
  callback && callback(res)
}

export const requestLogin = (type, callback) => {
  return (dispatch) => {
    //发送网络请求
    authLogin(type, (res) => {
      dealWithResult(dispatch, res, callback)
    })
  }
}

export const requestLoginOut = (error) => {
  return (dispatch) => {
    //发送网络请求
    authLoginOut((res) => {
      dealWithResult(dispatch, res, error)
    })
  }
}

export const requestInitLoginStates = (error) => {
  return (dispatch) => {
    //发送网络请求
    initLoginStates((res) => {
      dealWithResult(dispatch, res, error)
    })
  }
}

export const requestICPBalance = (curPrinId) => {
  if (!curPrinId || curPrinId === '2vxsx-fae')
    return (dispatch) => {
      dispatch(setICPBalance(0))
    }
  return async (dispatch) => {
    await requestCanister(balanceICP, {
      curPrinId,
      success: (res) => {
        dispatch(setICPBalance(res))
      }
    })
  }
}

export const requestWICPBalance = (curPrinId) => {
  if (!curPrinId || curPrinId === '2vxsx-fae') {
    return (dispatch) => {
      dispatch(setWICPBalance(0))
    }
  }
  return async (dispatch) => {
    await requestCanister(balanceWICP, {
      curPrinId,
      success: (res) => {
        dispatch(setWICPBalance(res))
      }
    })
  }
}
