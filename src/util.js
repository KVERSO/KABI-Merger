import moment from 'moment'
import { blobFromUint8Array, blobToHex } from '@dfinity/candid'
import crc32 from 'crc-32'
import { sha224 } from 'js-sha256'
import BigNumber from 'bignumber.js'

const to32bits = (num) => {
  let b = new ArrayBuffer(4)
  new DataView(b).setUint32(0, num)
  return Array.from(new Uint8Array(b))
}

export function principalToAccountId(principal, subaccount) {
  const shaObj = sha224.create()
  shaObj.update('\x0Aaccount-id')
  shaObj.update(principal.toUint8Array())
  shaObj.update(subaccount ? subaccount : new Uint8Array(32))
  const hash = new Uint8Array(shaObj.array())
  const crc = to32bits(crc32.buf(hash))
  const blob = blobFromUint8Array(new Uint8Array([...crc, ...hash]))
  return blobToHex(blob)
}

export function formatDateTime(date, format) {
  format = 'YYYY-MM-DD HH:mm:ss' // global set instead of customize
  return moment(date).format(format)
}

export function getSubAccountArray(s) {
  if (Array.isArray(s)) {
    return s.concat(Array(32 - s.length).fill(0))
  } else {
    //32 bit number only
    return Array(28)
      .fill(0)
      .concat(to32bits(s ? s : 0))
  }
}

export function getValueDivide8(num) {
  let res = new BigNumber(num || 0).dividedBy(Math.pow(10, 8))
  return res.toFixed()
}

export function getValueMultiplied8(num) {
  let res = new BigNumber(parseFloat(num || 0)).multipliedBy(Math.pow(10, 8))
  return res
}

const bignumberFormat = (num) => {
  return num.toFormat(1, { groupSeparator: '', decimalSeparator: '.' }).split('.')[0]
}

export function bignumberToBigInt(num) {
  return BigInt(bignumberFormat(num))
}

export const Storage = {
  set(key, value) {
    if (window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(value))
    }
  },
  get(key) {
    if (window.localStorage) {
      return JSON.parse(window.localStorage.getItem(key))
    }
  },
  remove(key) {
    if (window.localStorage) {
      window.localStorage.removeItem(key)
    }
  }
}
