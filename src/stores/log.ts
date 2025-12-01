import type { AppLog, LogCategory, LogLevel } from '@/interfaces'

import { defineStore } from 'pinia'
import { ref } from 'vue'

import LogsService from '@/services/logs'

interface LogFilters {
  app?: number
  task_id?: string
  level?: LogLevel
  category?: LogCategory
  progress?: number
  page?: number
}

export const useLogStore = defineStore('log', () => {
  const logs = ref<AppLog[]>([])
  const currentLog = ref<AppLog | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const totalCount = ref(0)
  const currentPage = ref(1)
  const hasMore = ref(false)

  // Buscar logs com filtros
  const fetchLogs = async (filters?: LogFilters) => {
    loading.value = true
    error.value = null
    try {
      const response = await LogsService.getLogs(filters)
      logs.value = response.results
      totalCount.value = response.count
      hasMore.value = !!response.next
      currentPage.value = filters?.page || 1
      return logs.value
    } catch (error_) {
      error.value = 'Erro ao carregar logs'
      console.error('Erro ao buscar logs:', error_)
      throw error_
    } finally {
      loading.value = false
    }
  }

  // Buscar log específico
  const fetchLog = async (logId: number) => {
    loading.value = true
    error.value = null
    try {
      currentLog.value = await LogsService.getLog(logId)
      return currentLog.value
    } catch (error_) {
      error.value = 'Erro ao carregar log'
      console.error('Erro ao buscar log:', error_)
      throw error_
    } finally {
      loading.value = false
    }
  }

  // Stream de logs em tempo real (polling)
  const streamLogs = async (taskId: string, afterId?: number) => {
    try {
      const newLogs = await LogsService.streamLogs(taskId, afterId)
      // Adiciona novos logs ao final
      if (newLogs.length > 0) {
        logs.value = [...logs.value, ...newLogs]
      }
      return newLogs
    } catch (error_) {
      console.error('Erro no stream de logs:', error_)
      throw error_
    }
  }

  // Buscar logs por app
  const fetchLogsByApp = async (appId: number, page?: number) => {
    return fetchLogs({ app: appId, page })
  }

  // Buscar logs por task
  const fetchLogsByTask = async (taskId: string, page?: number) => {
    return fetchLogs({ task_id: taskId, page })
  }

  // Carregar mais logs (próxima página)
  const loadMore = async (filters?: Omit<LogFilters, 'page'>) => {
    if (!hasMore.value || loading.value) {
      return
    }
    return fetchLogs({ ...filters, page: currentPage.value + 1 })
  }

  // Limpar logs
  const clearLogs = () => {
    logs.value = []
    currentLog.value = null
    totalCount.value = 0
    currentPage.value = 1
    hasMore.value = false
  }

  return {
    logs,
    currentLog,
    loading,
    error,
    totalCount,
    currentPage,
    hasMore,
    fetchLogs,
    fetchLog,
    streamLogs,
    fetchLogsByApp,
    fetchLogsByTask,
    loadMore,
    clearLogs,
  }
})
