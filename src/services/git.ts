import type { GitRepo } from '@/interfaces'

import apiClient from '@/plugins/axios'

class GitService {
  async getRepos (): Promise<GitRepo[]> {
    const response = await apiClient.get('/git/repos')
    return response.data
  }
}

export default new GitService()
