import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // IMPORTANTE: envia cookies automaticamente em cada requisição
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

function processQueue (error: Error | null) {
  for (const prom of failedQueue) {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve()
    }
  }
  failedQueue = []
}

// Com cookies httpOnly, não precisa de interceptor de request para adicionar token
// O browser envia o cookie automaticamente graças ao withCredentials: true

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (
      !error.response
      || error.response.status !== 401
      || originalRequest._retry
    ) {
      throw error
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(() => apiClient(originalRequest))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      // Chama endpoint de refresh - o backend vai ler o refresh_token do cookie
      // e setar um novo access_token também via cookie
      await apiClient.post('/auth/refresh/')
      processQueue(null)

      // Repete a requisição original - agora com o novo cookie
      return apiClient(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError as Error)

      // Se o refresh falhar, redireciona para login
      window.location.href = '/login'

      throw refreshError
    } finally {
      isRefreshing = false
    }
  },
)

export default apiClient
