import React, { useEffect, useImperativeHandle, useState } from 'react'
import { Image, Button, Modal, Popover, Typography } from 'antd'
import './index.scss'
import Plug from '../../assets/images/plug.svg'
import Stoic from '../../assets/images/stoic.png'
import Dfinity from '../../assets/images/dfinity.png'
import Logout from '../../assets/images/logout.svg'
import { principalToAccountId } from '../../util'
import { Principal } from '@dfinity/principal'
import { DFINITY_TYPE, PLUG_TYPE, STOIC_TYPE } from '../../api/constants'
import { requestInitLoginStates, requestLogin, requestLoginOut } from './store/actions'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'

const { Paragraph } = Typography

var hasAdd = false;

const AuthButton = (props) => {
  const dispatch = useDispatch()
  const [loginChoose, setLoginChoose] = useState(false)
  const [loginType, setLoginType] = useState(null)
  
  const { isAuth, authToken } = useSelector((state) => {
    console.log(state.auth.getIn(['authToken']),"authToken");
    
    window.postMessage({
      type : "auth", 
      auth :state.auth.getIn(['authToken'])
    },"*")
    console.log(state.auth.getIn(['authToken']))
    return {
      isAuth: state.auth.getIn(['isAuth']) || false,
      authToken: state.auth.getIn(['authToken']) || ''
    }
  }, shallowEqual)

  const setShowLoginModal = ()=>{
    setLoginChoose(true)
  }
  const handleLogout = async () => {
    dispatch(requestLoginOut())
  }

  const handleLogin = async (type) => {
    if (loginType === type) {
      return
    } 
    setLoginType(type)
    dispatch(
      requestLogin(type, (res) => {
        if (res.error === 'noplug') {
          window.open('https://plugwallet.ooo/', '_blank')
        }
        setLoginType(null)
      })
    )
  }

  useEffect(()=>{
    dispatch(requestInitLoginStates())
  }, [dispatch])
 
  useEffect(() => {
    if (isAuth) {
      setLoginType(null)
    }
    if(hasAdd == false)
    {
      hasAdd = true
      window.addEventListener("message",function(e){
        if(e.data == PLUG_TYPE || e.data == STOIC_TYPE)
        {
          handleLogin(e.data)
        }
  
        if(e.data == "ShareLink")
        {
          console.log("ShareLink");
          navigator.clipboard.writeText(this.location.href);
          alert("Link copied!");
        }
      })
    }

  }, [isAuth, authToken])

  return (
    <div></div>
  )
}

export default AuthButton
