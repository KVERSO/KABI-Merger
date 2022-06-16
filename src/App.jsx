import React from 'react'
import { HashRouter, Route, Redirect } from 'react-router-dom'
import { Layout } from 'antd'
import './App.scss'
import CHeader from './components/Header'
import store from './store'
import { Provider } from 'react-redux'

const { Content } = Layout

const App = (props) => {
  return (
    <Provider store={store}>
      <Layout className="layout">
        <CHeader />
        {/* <Content className="site-layout">
          <div className="site-layout-background">
            <HashRouter>
              <Route exact path="/">
                <Redirect to="/home" />
              </Route>
              <Route path="/home" component={Dashbord} />
            </HashRouter>
          </div>
        </Content> */}
      </Layout>
    </Provider>
  )
}

export default App
