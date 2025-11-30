import type { App, Response } from '@/interfaces'
import apiClient from '@/plugins/axios'

class AppsService {
  async getApps (): Promise<Response<App>> {
    const response = await apiClient.get('/apps/apps/')
    return response.data
  }

  async getApp (id: string): Promise<App> {
    const response = await apiClient.get(`/apps/apps/${id}/`)
    return response.data
  }

  async createApp (data: any): Promise<App> {
    const response = await apiClient.post('/apps/apps/', data)
    return response.data
  }

  async updateApp (id: string, data: any): Promise<App> {
    const response = await apiClient.put(`/apps/apps/${id}/`, data)
    return response.data
  }

  async deleteApp (id: string) {
    const response = await apiClient.delete(`/apps/apps/${id}/`)
    return response.data
  }
}

export default new AppsService()
