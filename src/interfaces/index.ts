interface User {
  id: number
  username: string
  email: string
  avatar_url?: string
}

interface Project {
  id: string
  name: string
  users: User['id'][]
  created_at?: string
  updated_at?: string
}

interface App {
  id: string
  name: string
  git: string
  project: Project['id']
  created_at?: string
  updated_at?: string
  status: 'stopped' | 'running' | 'error' | 'starting'
  dommain: string | null
  port?: number | null
  variables?: Record<string, string> | {}
  task_id?: string | null
  name_dokku?: string | null
}

export type { App, Project, User }
