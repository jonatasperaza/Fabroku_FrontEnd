import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import apiClient from '@/plugins/axios'

interface GitHubUser {
  login: string
  name: string
  avatar_url: string
  bio: string
  email: string
  public_repos: number
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<GitHubUser | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Com cookies httpOnly, verificamos autenticação via endpoint /auth/check/
  const isAuthenticated = computed(() => !!user.value)

  // Verifica se está autenticado (chama o backend)
  const checkAuth = async (): Promise<boolean> => {
    loading.value = true
    try {
      const response = await apiClient.get('/auth/check/')
      user.value = response.data.user || response.data
      return true
    } catch {
      user.value = null
      return false
    } finally {
      loading.value = false
    }
  }

  // Redireciona para login do GitHub
  const login = () => {
    const backendUrl
      = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
    window.location.href = `${backendUrl}/auth/github/login/`
  }

  // Logout - remove cookies no backend
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout/')
    } catch (error_) {
      console.error('Erro no logout:', error_)
    } finally {
      user.value = null
      window.location.href = '/'
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    checkAuth,
    logout,
    login,
  }
})
