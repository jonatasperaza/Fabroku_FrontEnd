import type { Response, Service, TaskStatus } from '@/interfaces'

import apiClient from '@/plugins/axios'

class ServicesService {
  async getServicesByApp (appId: number): Promise<Response<Service>> {
    const response = await apiClient.get('/apps/services/', {
      params: { app: appId },
    })
    return response.data
  }

  async getServicesByProject (projectId: string): Promise<Response<Service>> {
    const response = await apiClient.get('/apps/services/', {
      params: { project: projectId },
    })
    return response.data
  }

  async createService (data: {
    app?: number
    project?: number | string
    service_type: string
    name?: string
  }): Promise<Service> {
    const response = await apiClient.post('/apps/services/', data)
    return response.data
  }

  async deleteService (id: number): Promise<void> {
    await apiClient.delete(`/apps/services/${id}/`)
  }

  async linkService (serviceId: number, appId: number): Promise<{ task_id: string }> {
    const response = await apiClient.post(`/apps/services/${serviceId}/link/`, {
      app_id: appId,
    })
    return response.data
  }

  async unlinkService (serviceId: number): Promise<{ task_id: string }> {
    const response = await apiClient.post(`/apps/services/${serviceId}/unlink/`)
    return response.data
  }

  async getServiceStatus (serviceId: number): Promise<TaskStatus> {
    const response = await apiClient.get(`/apps/services/${serviceId}/get_service_status/`)
    return response.data
  }
}

export default new ServicesService()
