interface Response<T = any> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

interface User {
  id?: number
  username?: string
  email: string
  name?: string | null
  avatar_url?: string | null
}

interface Project {
  id?: string
  name: string
  users: User['id'][]
  created_at?: string
  updated_at?: string
}

interface App {
  id?: number
  name: string
  git: string
  branch?: string
  project: Project['id']
  created_at?: string
  updated_at?: string
  status?: 'stopped' | 'running' | 'error' | 'starting'
  domain?: string | null
  port?: number | null
  variables?: Record<string, string> | object
  task_id?: string | null
  name_dokku?: string | null
}

type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'DOKKU'
type LogCategory
  = | 'SYSTEM'
    | 'CREATE'
    | 'DEPLOY'
    | 'CONFIG'
    | 'GIT'
    | 'DATABASE'
    | 'DOMAIN'
    | 'SSL'

interface AppLog {
  id?: number
  app: number
  task_id?: string | null
  message: string
  level: LogLevel
  level_display?: string
  category: LogCategory
  category_display?: string
  metadata?: Record<string, any>
  progress?: number
  created_at?: string
}

interface GitRepo {
  id: number
  name: string
  full_name: string
  html_url: string
  description?: string | null
  private: boolean
  default_branch: string
  clone_url: string
  ssh_url: string
}

export type {
  App,
  AppLog,
  GitRepo,
  LogCategory,
  LogLevel,
  Project,
  Response,
  User,
}
