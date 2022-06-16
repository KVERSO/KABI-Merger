import axios from 'axios'

// 创建axios实例
const service = axios.create({
  baseURL: 'https://web-backend.c3-protocol.com/api/v1/ccc',
  timeout: 50 * 1000 // 请求超时时间
})

// request拦截器
service.interceptors.request.use(
  (config) => config,
  (error) => {
    return Promise.reject(error)
  }
)

// response 拦截器
service.interceptors.response.use(
  (response) => {
    const res = response.data
    // console.log('res:', res)
    return res
  },
  (error) => {
    console.log('error:', error)
    return Promise.reject(error)
  }
)

// 将axios 的 get 方法
export function $get(url, params) {
  return new Promise((resolve, reject) => {
    service
      .get(url, {
        params: params
      })
      .then((res) => {
        resolve(res) // 返回请求成功的数据 data
      })
      .catch((err) => {
        reject(err)
      })
  })
}

// 将axios 的 post 方法
export function $post(url, params) {
  return new Promise((resolve, reject) => {
    service
      .post(url, params)
      .then((res) => {
        resolve(res)
      })
      .catch((err) => {
        reject(err)
      })
  })
}
