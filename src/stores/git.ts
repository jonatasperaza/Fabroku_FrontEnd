import type { GitRepo } from '@/interfaces'

import { defineStore } from 'pinia'
import { ref } from 'vue'

import GitService from '@/services/git'

export const useGitStore = defineStore('git', () => {
  const repos = ref<GitRepo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Buscar repositórios do GitHub do usuário
  const fetchRepos = async () => {
    loading.value = true
    error.value = null
    try {
      repos.value = await GitService.getRepos()
      return repos.value
    } catch (error_) {
      error.value = 'Erro ao carregar repositórios'
      console.error('Erro ao buscar repositórios:', error_)
      throw error_
    } finally {
      loading.value = false
    }
  }

  // Limpar repositórios
  const clearRepos = () => {
    repos.value = []
  }

  return {
    repos,
    loading,
    error,
    fetchRepos,
    clearRepos,
  }
})
