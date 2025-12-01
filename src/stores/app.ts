import type { App, TaskStatus } from '@/interfaces'

import { defineStore } from 'pinia'
import { ref } from 'vue'

import AppsService from '@/services/apps'

export const useAppStore = defineStore('app', () => {
  const apps = ref<App[]>([])
  const currentApp = ref<App | null>(null)
  const taskStatus = ref<TaskStatus | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Buscar todos os apps
  const fetchApps = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await AppsService.getApps()
      apps.value = response.results
      return apps.value
    } catch (error_) {
      error.value = 'Erro ao carregar apps'
      console.error('Erro ao buscar apps:', error_)
      throw error_
    } finally {
      loading.value = false
    }
  }

  // Buscar um app específico
  const fetchApp = async (appId: string) => {
    loading.value = true
    error.value = null
    try {
      currentApp.value = await AppsService.getApp(appId)
      return currentApp.value
    } catch (error_) {
      error.value = 'Erro ao carregar app'
      console.error('Erro ao buscar app:', error_)
      throw error_
    } finally {
      loading.value = false
    }
  }

  // Criar novo app
  const createApp = async (
    app: Omit<
      App,
      'id' | 'created_at' | 'updated_at' | 'status' | 'task_id' | 'name_dokku'
    >,
  ) => {
    loading.value = true
    error.value = null
    try {
      const newApp = await AppsService.createApp(app)
      apps.value.push(newApp)
      return newApp
    } catch (error_) {
      error.value = 'Erro ao criar app'
      console.error('Erro ao criar app:', error_)
      throw error_
    } finally {
      loading.value = false
    }
  }

  // Atualizar app
  const updateApp = async (appId: string, data: Partial<App>) => {
    loading.value = true
    error.value = null
    try {
      const updatedApp = await AppsService.updateApp(appId, data)
      const index = apps.value.findIndex(a => String(a.id) === appId)
      if (index !== -1) {
        apps.value[index] = updatedApp
      }
      if (String(currentApp.value?.id) === appId) {
        currentApp.value = updatedApp
      }
      return updatedApp
    } catch (error_) {
      error.value = 'Erro ao atualizar app'
      console.error('Erro ao atualizar app:', error_)
      throw error_
    } finally {
      loading.value = false
    }
  }

  // Deletar app
  const deleteApp = async (appId: string) => {
    loading.value = true
    error.value = null
    try {
      await AppsService.deleteApp(appId)
      apps.value = apps.value.filter(a => String(a.id) !== appId)
      if (String(currentApp.value?.id) === appId) {
        currentApp.value = null
      }
    } catch (error_) {
      error.value = 'Erro ao deletar app'
      console.error('Erro ao deletar app:', error_)
      throw error_
    } finally {
      loading.value = false
    }
  }

  // Buscar status da task do app (progresso de criação/deploy)
  const fetchAppStatus = async (appId: string): Promise<TaskStatus | null> => {
    try {
      const status = await AppsService.getAppStatus(appId)
      taskStatus.value = status
      return status
    } catch (error_) {
      console.error('Erro ao buscar status:', error_)
      taskStatus.value = null
      throw error_
    }
  }

  // Limpar status da task
  const clearTaskStatus = () => {
    taskStatus.value = null
  }

  // Buscar apps por projeto da API
  const fetchAppsByProject = async (projectId: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await AppsService.getAppsByProject(projectId)
      apps.value = response.results
      return apps.value
    } catch (error_) {
      error.value = 'Erro ao carregar apps do projeto'
      console.error('Erro ao buscar apps do projeto:', error_)
      throw error_
    } finally {
      loading.value = false
    }
  }

  // Filtrar apps localmente por projeto (para uso após já ter carregado)
  const getAppsByProject = (projectId: string) => {
    return apps.value.filter(app => app.project === projectId)
  }

  // Limpar apps
  const clearApps = () => {
    apps.value = []
    currentApp.value = null
  }

  return {
    apps,
    currentApp,
    taskStatus,
    loading,
    error,
    fetchApps,
    fetchApp,
    fetchAppStatus,
    clearTaskStatus,
    createApp,
    updateApp,
    deleteApp,
    fetchAppsByProject,
    getAppsByProject,
    clearApps,
  }
})
