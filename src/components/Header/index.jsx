import React, { useEffect, useImperativeHandle, useState } from 'react'
import { Layout, Image, Button } from 'antd'
import './index.scss'
import '../Header/style-mobile.6e9cd.css'
import AuthButton from '../Auth'
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics , logEvent} from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries


const { Header } = Layout

const CHeader = (props) => {

  useEffect(() => {
    initDone()
  })

  const initDone = () => {

    // Your web app's Firebase configuration
    // For Firebase JS SDK v7.20.0 and later, measurementId is optional
    const firebaseConfig = {
      apiKey: "AIzaSyD8EgkORf4wV-LTrordZ8QwhUTRm7378BE",
      authDomain: "kversoicpkabimerger.firebaseapp.com",
      projectId: "kversoicpkabimerger",
      storageBucket: "kversoicpkabimerger.appspot.com",
      messagingSenderId: "864739373359",
      appId: "1:864739373359:web:cabb3660d0d1385f28b1da",
      measurementId: "G-006RJVXXPG"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);
    logEvent(analytics, 'notification_received');

    if (!window._CCSettings) {
      window.location.reload()
    }

    var debug = window._CCSettings && window._CCSettings.debug
    console.log("debug", debug)
    var splash = document.getElementById('splash');
    splash.style.display = 'block';

    function loadScript(moduleName, cb) {
      function scriptLoaded() {
        document.body.removeChild(domScript);
        domScript.removeEventListener('load', scriptLoaded, false);
        cb && cb();
      };
      var domScript = document.createElement('script');
      domScript.async = true;
      domScript.src = moduleName;
      console.log(moduleName);
      domScript.addEventListener('load', scriptLoaded, false);
      document.body.appendChild(domScript);
    }

    loadScript(debug ? 'cocos2d-js.js' : 'cocos2d-js-min.0c2df.js', function () {
      let CC_PHYSICS_BUILTIN = false
      let CC_PHYSICS_CANNON = true
      if (CC_PHYSICS_BUILTIN || CC_PHYSICS_CANNON) {
        loadScript(debug ? 'physics.js' : 'physics-min.ce5ee.js', window.boot);
      }
      else {
        window.boot();
      }
    });

  }

  const CallLogin = async (type) => {
    window.postMessage(type);
  }


  const [link] = useState([
    { title: 'Homepage', url: '/index' },
    { title: 'WHAT IS WICP?', url: '/wicp' },
    { title: 'DOCUMENTATION', url: 'https://c3-protocol.github.io/wicp_docs', type: 'outlink' }
  ])
  const scrollTop = (e) => {
    document.querySelector('body').scrollIntoView({
      block: 'start',
      behavior: 'smooth'
    })
  }
  return (
    <>
      <div className="right-space">
        <div className='margin-left90'>
          <AuthButton />
        </div>
      </div>
      <div
        id="GameDiv"
        style={{ width: "100%", height: "calc(100vh)" }}
      >
        <canvas id="GameCanvas" width="100%" height="100%" />
        <div id="splash">
          <div className="progress-bar stripes">
            <span style={{ width: "0%" }} />
          </div>
        </div>
      </div>

    </>
  )
}

export default CHeader
