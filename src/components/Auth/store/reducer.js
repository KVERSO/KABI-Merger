import { fromJS } from 'immutable'

const initState = fromJS({
  isAuth: false,
  authToken: ''
})

const reducer = (state = initState, action) => {
  if (action.type) return state.set(action.type, action.value)
  return state
}

export default reducer
