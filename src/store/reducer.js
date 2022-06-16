import { combineReducers } from 'redux'

import { reducer as authReducer } from '../components/Auth/store'

export default combineReducers({
  auth: authReducer
})
