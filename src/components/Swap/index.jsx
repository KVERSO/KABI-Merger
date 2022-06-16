import React, { useState, useEffect, useCallback } from 'react'
import { useSelector, shallowEqual, useDispatch } from 'react-redux'
import { Row, Col, InputNumber, Button, Form, Input, message, Modal, Image, notification } from 'antd'
import BigNumber from 'bignumber.js'
import { requestWICPBalance, requestICPBalance } from '../Auth/store/actions'
import { transferIcp2WIcp, transferWIcp2WIcp, transferIcp2Icp, transferWIcp2Icp } from '../../api/canApi'
import requestCanister from '../../api/http'
import {getValueDivide8} from '../../util'

import DfinityLogo from   '../../assets/images/dfinity.png'
import TransferIcon from '../../assets/images/transfer.webp'
import WicpIconImg from '../../assets/images/logo.png'
import SwapImg from '../../assets/images/swap.webp'
import { principalToAccountId } from '../../util'
import { Principal } from '@dfinity/principal'
import  './index.scss'
import AuthButton from '../Auth'

const { Item } = Form
const TRANS_TYPE_ICP_ICP = 1
const TRANS_TYPE_WICP_WICP = 2
const TRANS_TYPE_ICP_WICP = 3
const TRANS_TYPE_WICP_ICP = 4

const Swap = (props) => {

  const { isAuth, authToken, icpBalance, wicpBalance } = useSelector((state) => {
    return {
      isAuth: state.auth.getIn(['isAuth']) || false,
      authToken: state.auth.getIn(['authToken']) || '',
      icpBalance: state.auth.getIn(['icpBalance']) || 0,
      wicpBalance :state.auth.getIn(['wicpBalance']) || 0
    }
  }, shallowEqual)
  
  const dispatch = useDispatch()
  const [wicpInputValue, setWicpInputValue] = useState(0)
  const [icpInputValue, setIcpInputValue] = useState(0)
  const [transAddress, setTransAddress] = useState('')
  const [transAmount, setTransAmount] = useState(0)
  const [transActuallyAmount, setTransActuallyAmount] = useState('0')
  const [transType, setTransType] = useState(-1) //1:icp2icp,2、wicp2wicp,3、icp2wicp,4、wicp2icp
  const [transSymbol, setTransSymbol] = useState('')
  const [actuallySymbol, setActuallySymbol] = useState('')
  const [sendVisible, setSendVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [wrap, setWrap] = useState(1) //1 wrap, -1unwrap
  const [transModalTitle, setTransModalTitle] = useState('')
  const [transferLoading, setTransferLoading] = useState(false)
  const handlerClose = () => {
    setTransType(-1)
    setTransAmount(0)
    setTransActuallyAmount(0)
    setTransAddress('')
  }
  const handleCancleSendModal = () => {
    if (transferLoading) {
      return
    }
    setSendVisible(false)
    handlerClose()
  }
  const setTransInfos = (type) => {
    setTransType(type)
    let ret = 'Transfer'
    let fee = 0.0
    switch (type) {
      case TRANS_TYPE_ICP_ICP:
        ret = 'Transfer'
        setTransSymbol('ICP')
        setActuallySymbol('ICP')
        break
      case TRANS_TYPE_WICP_WICP:
        ret = 'Transfer'
        setTransSymbol('WICP')
        setActuallySymbol('WICP')
        break
      case TRANS_TYPE_ICP_WICP:
        ret = 'Wrapped(ICP->WICP)'
        setTransSymbol('ICP')
        setActuallySymbol('WICP')
        break
      case TRANS_TYPE_WICP_ICP:
        ret = 'Unwrapped(WICP->ICP)'
        setTransSymbol('WCP')
        setActuallySymbol('ICP')
        break
      // default:
      //     ret = ''
    }
    setTransModalTitle(ret)
  }
  const showTransferModal = (type) => {
    console.log('showTransferModal:', type)
    setTransInfos(type)
    setSendVisible(true)
  }
  const handleWicpInput = (value) => {
    setWicpInputValue(value)
  }
  const handleIcpInput = (value) => {
    setIcpInputValue(value)
  }
  const handleSetToAddress = (e) => {
    setTransAddress(e.target.value)
  }
  const handleSetTransferAmount = (e) => {
    setTransAmount(e - 0)
    // let actuallyAmount = new BigNumber(e - 0).minus(transHandleFee)
    // if (actuallyAmount.lt(0)) {
    //   actuallyAmount = new BigNumber(0)
    // }
    // setTransActuallyAmount(actuallyAmount.toFixed())
  }
  const checkWrapAmount = (_, value) => {
    if (!value) {
      return Promise.reject(new Error('Empty'))
    } else if (new BigNumber(icpInputValue).multipliedBy(Math.pow(10, 8))  > icpBalance) {
      return Promise.reject(new Error('Insufficient ICP'))
    }  else if (icpInputValue <= 0.0001) {
      return Promise.reject(new Error('At least 0.0001 ICP '))
    } else {
      return Promise.resolve()
    }
  }
  const checkUnWrapAmount = (_, value) => {
    if (!value) {
      return Promise.reject(new Error('Empty'))
    } if (new BigNumber(wicpInputValue).multipliedBy(Math.pow(10, 8)) > wicpBalance ) {
      return Promise.reject(new Error('Insufficient WICP'))
    } else if (wicpInputValue < 0.1) {
      return Promise.reject(new Error('At least 0.1 WICP '))
    }  else {
      return Promise.resolve()
    }
  }

  const checkAmount = (_, value) => {
    if (!value) {
      return Promise.reject(new Error('Please input to Amount'))
    } else if (new BigNumber(transAmount).multipliedBy(Math.pow(10, 8)) > icpBalance && (transType === 1 || transType === 3)) {
      return Promise.reject(new Error('Insufficient ICP'))
    } else if (new BigNumber(transAmount).multipliedBy(Math.pow(10, 8)) > wicpBalance && (transType === 2 || transType === 4)) {
      return Promise.reject(new Error('Insufficient WICP'))
    } else if (transAmount <= 0.0001 && (transType === 1 || transType === 3)) {
      return Promise.reject(new Error('At least 0.0001 ICP is required in this transation'))
    } else if (transAmount < 0.1 && transType === 4) {
      return Promise.reject(new Error('At least 0.1 WICP is required in this transation'))
    } else if (transAmount <= 0 && transType === 2) {
      return Promise.reject(new Error('WICP must be greater than 0'))
    } else {
      return Promise.resolve()
    }
  }
  const checkAccount = (_, value) => {
    if (!value) {
      return Promise.reject(new Error('Please input to Account'))
    } else if (transType === 1 ) {
      let accountId = principalToAccountId(Principal.fromText(authToken))
      if (accountId.indexOf('-') >= 0) 
        return Promise.reject(new Error('Illegal Account ID'))
      else if (value === accountId)
        return Promise.reject(new Error('Can not transfer to yourself'))
      return Promise.resolve()
    } else if (transType === 2 ) {
      if (authToken.indexOf('-') === -1) 
        return Promise.reject(new Error('Illegal Principal ID'))
      else if (value === authToken)
        return Promise.reject(new Error('Can not transfer to yourself'))
      return Promise.resolve()
    } else {
      return Promise.resolve()
    }
  }

  const sleep = (time) =>{
    return new Promise((resolve) => setTimeout(resolve, time))
  }

  const requestTransfer = (transAddress, transAmount)=>{
    setTransferLoading(true)
    let address = transAddress.replace(/\s+/g, '')
    let data = {
      amount: parseFloat(transAmount),
      address: address,
      success: async (res) => {
        console.log('trans res:', res)
        if (res) {
          setTransferLoading(false)
          handleCancleSendModal()
          notification.success({
            message: 'successful',
            placement: 'bottomRight'
          })
          if (isAuth && authToken){
            dispatch(requestWICPBalance(authToken))
            const maxTryTime = 10
            let times = 1
            while (times < maxTryTime) {
              await sleep(1500)
              dispatch(requestICPBalance(authToken))
              times++
            }
          }
        }
      },
      fail: (err) => {
        setTransferLoading(false)
        notification.error({
          message: err.toString(),
          placement: 'bottomRight',
          duration: 15
        })
      },
      close: () => {
        setTransferLoading(false)
      }
    }
    transType === 1 && requestCanister(transferIcp2Icp, data)
    transType === 2 && requestCanister(transferWIcp2WIcp, data)
    wrap === 1 && requestCanister(transferIcp2WIcp, data)
    wrap === -1 && requestCanister(transferWIcp2Icp, data)
  }

  const handlerWrapOrUnwrap = ()=>{
    if (wrap === 1 && (!icpInputValue || new BigNumber(icpInputValue).multipliedBy(Math.pow(10, 8)) > icpBalance || icpInputValue < 0.1)) {
      return 
    } 
    if (wrap === -1 && (!wicpInputValue || new BigNumber(wicpInputValue).multipliedBy(Math.pow(10, 8)) > wicpBalance || wicpInputValue < 0.1)) {
      return 
    } 
    requestTransfer('', wrap === 1 ? icpInputValue : wicpInputValue)
  }

  const handlerTransfer = async () => {
    requestTransfer(transAddress, transAmount)
  }

  useEffect(() => {
    let didCancel = true
    if (isAuth && authToken) {
      console.log('requestWICPBalance')
      didCancel && dispatch(requestWICPBalance(authToken))
      didCancel && dispatch(requestICPBalance(authToken))
    }
    return () => {
      didCancel = false
    }
  }, [isAuth, authToken, dispatch])

  const icpLayout = (<div className='balance-item'>
    <div className='sub-item'>
      <div className='balance'>
        <Image src={DfinityLogo} width={40} preview={false} />
        <span>ICP</span>
      </div>
      <img
        src={TransferIcon}
        onClick={(e) => {
          e.stopPropagation()
          if (!transferLoading)
            showTransferModal(TRANS_TYPE_ICP_ICP)
        }}/>
    </div>
    <div className='sub-item2'>
      {wrap === 1 ? 
      <Form>
        <Form.Item name="icp-wrap" rules={[{ validator: checkWrapAmount }]}>
          <InputNumber
            min={0}
            keyboard={false}
            stringMode={true}
            step={0.01}
            placeholder={'0.00'}
            value={icpInputValue}
            onChange={(e) => handleIcpInput(e)} />
        </Form.Item>
      </Form>: <></>}
      <p>
        {`Balance: ${getValueDivide8(icpBalance)}`}
      </p>
    </div>
    
  </div>)

  const wicpLayout = (<div className='balance-item'>
    <div className='sub-item'>
      <div className='balance'>
        <Image src={WicpIconImg} width={40} preview={false} />
        <span>WICP</span>
      </div>
      <img
        src={TransferIcon}
        onClick={(e) => {
          e.stopPropagation()
          if (!transferLoading){
            showTransferModal(TRANS_TYPE_WICP_WICP)
          }
        }}
    />
    </div>
    <div className='sub-item2'>
      {wrap === -1 ? 
      <Form>
        <Form.Item name="transfer-amount" rules={[{ validator: checkUnWrapAmount }]}>
          <InputNumber
            min={0}
            keyboard={false}
            stringMode={true}
            step={0.01}
            placeholder={'0.00'}
            value={wicpInputValue}
            onChange={(e) => handleWicpInput(e)} />
        </Form.Item>
      </Form> : <></> }
      <p>
        {`Balance: ${getValueDivide8(wicpBalance)}`}
      </p>
    </div>
    
  </div>)

  return (
    <div className='wallet-balance-wrap'>
      <h4>{wrap === 1 ? 'Wrap' : 'Unwrap'}</h4>
      {wrap === 1 ? icpLayout : wicpLayout}
      <Form>
        <div className='balance-transfer' onClick={()=>{setWrap(wrap * -1)}}>
          <img src={SwapImg}  />
        </div>
        {wrap === -1 ? icpLayout : wicpLayout}
        <div className='margin-top-20'>
          {isAuth ? <Button htmlType="submit" loading = {transferLoading && transType === -1} onClick={handlerWrapOrUnwrap}>{wrap === 1 ? 'Wrap' : 'Unwrap'}</Button> : <AuthButton/>  }
        </div>
      </Form>
      <div className='margin-top-20 divider'/>
      
      <Modal
        wrapClassName='icp-wicp-transfer'
        title={transModalTitle}
        visible={sendVisible}
        maskClosable={false}
        centered
        footer={null}
        closable={false}
        destroyOnClose={true}
        onCancel={handleCancleSendModal}
      >
        <Form size="large" onFinish={handlerTransfer} autoComplete="off" preserve={false}>
          {transType === 1 || transType === 2 ? (
            <div>
              <Item>
                <div className='transfer-type'>{transSymbol}</div>
                {/* <Input type="text" value={transSymbol} /> */}
              </Item>
              <Item name="address" rules={[{ validator: checkAccount }]}>
                <Input
                  type="text"
                  placeholder={transType === 1 ? 'Enter Account ID' : 'Enter Principal ID'}
                  value={transAddress}
                  onChange={(e) => handleSetToAddress(e)}
                />
              </Item>
            </div>
          ) : (
            <></>
          )}
          <Item name="transfer-amount" rules={[{ validator: checkAmount }]}>
            <InputNumber
              min={0}
              keyboard={false}
              stringMode={true}
              step={0.01}
              placeholder="Amount"
              value={transAmount}
              onChange={(e) => handleSetTransferAmount(e)} />
          </Item>
          <Item>
            <div className='button-layout'>
                <Button block disabled={transferLoading} type='gray' onClick={handleCancleSendModal}>
                  Cancel
                </Button>
                <Button
                  block
                  type="blue"
                  htmlType="submit"
                  loading={transferLoading}
                  disabled={!isAuth}
                  size="large"
                >
                  {isAuth ? (loading ? 'Confirm...' : 'Confirm') : 'Connect'}
                </Button>
              
            </div>
          </Item>
        </Form>
      </Modal>
    </div>
  )
}
export default Swap