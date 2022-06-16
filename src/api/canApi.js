/**
 * canister api
 */
import { canManager } from './canManager'
import { Principal } from '@dfinity/principal'
import { principalToAccountId, getSubAccountArray, bignumberToBigInt, getValueDivide8, getValueMultiplied8 } from '../util'
import BigNumber from 'bignumber.js'

export const fetchSubscribe = async ({ data }) => {
  const { email } = data
  const fetch = await canManager.getEmailFactory()
  const res = await fetch.add_subscriber(email)
  return res
}
export const fetchAddQuestion = async ({ data }) => {
  console.log(data)
  const fetch = await canManager.getEmailFactory()
  const res = await fetch.add_question(data)
  return res
}

export const fetchTotalBurn = async () => {
  const fetch = await canManager.getWicpInfoFactory(false)
  const res = await fetch.getUserNumber()
  if (res) {
    return { ok: res }
  } else {
    return { err: 'user number is undefined' }
  }
}
export const fetchTotalMint = async () => {
  const fetch = await canManager.getWicpInfoFactory(false)
  const res = await fetch.totalSupply()
  if (res) {
    return { ok: res }
  } else {
    return { err: 'total supply is undefined' }
  }
}
// get dynamic cid
export const fetchDynamicCid = async () => {
  const fetch = await canManager.getWicpInfoFactory(false)
  const res = await fetch.getStorageCanisterId()
  if (res) {
    return { ok: res }
  } else {
    return { err: 'storage canisterId is undefined' }
  }
}

export async function balanceWICP(data) {
  let { curPrinId } = data
  let fetch = await canManager.getWicpInfoFactory(false)
  let count = await fetch.balanceOf(Principal.fromText(curPrinId))
  return { ok: count || 0 }
}

export async function balanceICP(data) {
  let { curPrinId } = data
  let account = principalToAccountId(Principal.fromText(curPrinId))
  let ledgercanister = await canManager.getLedgerCanister(false)
  let icpBalance = await ledgercanister.account_balance_dfx({ account: account })
  console.log('balanceICP', icpBalance)
  return { ok: icpBalance ? icpBalance.e8s : 0 }
}

export async function transferIcp2Icp(data) {
  let { amount, address } = data
  let transAmount = new BigNumber(amount).multipliedBy(Math.pow(10, 8)).minus(10000)
  let subaccount = [getSubAccountArray(0)]
  let toAddr = address
  let args = {
    from_subaccount: subaccount,
    to: toAddr,
    amount: { e8s: bignumberToBigInt(transAmount) },
    fee: { e8s: 10000 },
    memo: 0,
    created_at_time: []
  }
  let ledgercanister = await canManager.getLedgerCanister(true)
  let blockHeight = await ledgercanister.send_dfx(args)
  return { ok: blockHeight }
}

export async function transferWIcp2WIcp(data) {
  let { amount, address } = data
  let fetch = await canManager.getWicpInfoFactory(true)
  let res = await fetch.transfer(Principal.fromText(address), parseInt(getValueMultiplied8(amount)))
  return res
}

export async function transferWIcp2Icp(data) {
  let { amount } = data
  let fetch = await canManager.getWicpInfoFactory(true)
  let res = await fetch.burn(parseInt(getValueMultiplied8(amount)))
  return res
}

export async function transferIcp2WIcp(data) {
  let fetch = await canManager.getWicpInfoFactory(true)
  let toAddr = await fetch.getReceiveICPAcc()
  data['address'] = toAddr[0]
  let res = await transferIcp2Icp(data)
  if (res) {
    let blockHeight = res.ok
    console.log('blockHeight =' + blockHeight)
    let subaccount = [getSubAccountArray(0)]
    let result = await fetch.swap({ from_subaccount: subaccount, blockHeight: blockHeight })
    return result
  } else {
    return {err: {Other: null}}
  }
}

export async function addWhiteList(type, prinId) {
  await canManager.getCanvasCanister(type, prinId, true)
}

export function getCurrentLoginType() {
  return canManager.getCurrentLoginType()
}
