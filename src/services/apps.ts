import type { App, Response, TaskStatus } from '@/interfaces'

import apiClient from '@/plugins/axios'

class AppsService {
  async getApps (): Promise<Response<App>> {
    const response = await apiClient.get('/apps/apps/')
    return response.data
  }

  async getAppsByProject (projectId: string): Promise<Response<App>> {
    const response = await apiClient.get('/apps/apps/', {
      params: { project: projectId },
    })
    return response.data
  }

  async getApp (id: string): Promise<App> {
    const response = await apiClient.get(`/apps/apps/${id}/`)
    return response.data
  }

  async createApp (data: Partial<App>): Promise<App> {
    const response = await apiClient.post('/apps/apps/', data)
    return response.data
  }

  async updateApp (id: string, data: Partial<App>): Promise<App> {
    const response = await apiClient.put(`/apps/apps/${id}/`, data)
    return response.data
  }

  async patchApp (id: string, data: Partial<App>): Promise<App> {
    const response = await apiClient.patch(`/apps/apps/${id}/`, data)
    return response.data
  }

  async deleteApp (id: string): Promise<void> {
    await apiClient.delete(`/apps/apps/${id}/`)
  }

  async getAppStatus (id: string): Promise<TaskStatus> {
    const response = await apiClient.get(`/apps/apps/${id}/get_app_status/`)
    return response.data
  }
}

export default new AppsService()
