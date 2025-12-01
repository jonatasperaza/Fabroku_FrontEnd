<template>
  <v-container>
    <h1 class="text-h4 mb-6">Dashboard</h1>

    <!-- Loading -->
    <v-progress-linear v-if="loading" class="mb-4" indeterminate />

    <!-- Stats Cards -->
    <v-row class="mb-6">
      <v-col cols="12" md="3" sm="6">
        <v-card class="text-center pa-4" color="primary" variant="tonal">
          <v-icon class="mb-2" size="48">mdi-folder-multiple</v-icon>
          <div class="text-h4">{{ stats.projects }}</div>
          <div class="text-body-2">Projetos</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3" sm="6">
        <v-card class="text-center pa-4" color="success" variant="tonal">
          <v-icon class="mb-2" size="48">mdi-application</v-icon>
          <div class="text-h4">{{ stats.apps }}</div>
          <div class="text-body-2">Apps</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3" sm="6">
        <v-card class="text-center pa-4" color="info" variant="tonal">
          <v-icon class="mb-2" size="48">mdi-check-circle</v-icon>
          <div class="text-h4">{{ stats.running }}</div>
          <div class="text-body-2">Em Execução</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3" sm="6">
        <v-card class="text-center pa-4" color="error" variant="tonal">
          <v-icon class="mb-2" size="48">mdi-alert-circle</v-icon>
          <div class="text-h4">{{ stats.errors }}</div>
          <div class="text-body-2">Com Erro</div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- Projetos Recentes -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span>Projetos Recentes</span>
            <v-btn
              color="primary"
              size="small"
              :to="'/projects'"
              variant="text"
            >
              Ver todos
            </v-btn>
          </v-card-title>
          <v-list v-if="recentProjects.length > 0">
            <v-list-item
              v-for="project in recentProjects"
              :key="project.id"
              :to="`/projects/${project.id}`"
            >
              <template #prepend>
                <v-icon>mdi-folder</v-icon>
              </template>
              <v-list-item-title>{{ project.name }}</v-list-item-title>
              <v-list-item-subtitle>
                Criado em {{ formatDate(project.created_at) }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <v-card-text v-else class="text-center text-grey">
            <v-icon class="mb-2" size="48">mdi-folder-outline</v-icon>
            <p>Nenhum projeto ainda</p>
            <v-btn class="mt-2" color="primary" to="/projects">
              Criar Projeto
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Apps Recentes -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Apps Recentes</v-card-title>
          <v-list v-if="recentApps.length > 0">
            <v-list-item
              v-for="app in recentApps"
              :key="app.id"
              :to="`/projects/${app.project}/${app.id}`"
            >
              <template #prepend>
                <v-icon :color="getStatusColor(app.status)">
                  {{ getStatusIcon(app.status) }}
                </v-icon>
              </template>
              <v-list-item-title>{{ app.name }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ app.git }}
              </v-list-item-subtitle>
              <template #append>
                <v-chip :color="getStatusColor(app.status)" size="x-small">
                  {{ app.status || "stopped" }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
          <v-card-text v-else class="text-center text-grey">
            <v-icon class="mb-2" size="48">mdi-application-outline</v-icon>
            <p>Nenhum app ainda</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-card class="mt-6">
      <v-card-title>Ações Rápidas</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4" sm="6">
            <v-btn
              block
              color="primary"
              prepend-icon="mdi-plus"
              size="large"
              to="/projects"
              variant="tonal"
            >
              Novo Projeto
            </v-btn>
          </v-col>
          <v-col cols="12" md="4" sm="6">
            <v-btn
              block
              color="success"
              prepend-icon="mdi-source-repository"
              size="large"
              variant="tonal"
              @click="showRepos = true"
            >
              Conectar Repositório
            </v-btn>
          </v-col>
          <v-col cols="12" md="4" sm="6">
            <v-btn
              block
              color="info"
              prepend-icon="mdi-file-document"
              size="large"
              to="/documentation"
              variant="tonal"
            >
              Documentação
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Dialog Repositórios -->
    <v-dialog v-model="showRepos" max-width="600">
      <RepoSelector @cancel="showRepos = false" @select="handleRepoSelect" />
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import type { GitRepo } from '@/interfaces'

  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'

  import RepoSelector from '@/components/git/RepoSelector.vue'
  import { useAppStore, useProjectStore } from '@/stores'

  const router = useRouter()
  const projectStore = useProjectStore()
  const appStore = useAppStore()

  const loading = ref(true)
  const showRepos = ref(false)

  const stats = computed(() => ({
    projects: projectStore.projects.length,
    apps: appStore.apps.length,
    running: appStore.apps.filter(a => a.status === 'running').length,
    errors: appStore.apps.filter(a => a.status === 'error').length,
  }))

  const recentProjects = computed(() => {
    const sorted = [...projectStore.projects]
    sorted.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      return dateB - dateA
    })
    return sorted.slice(0, 5)
  })

  const recentApps = computed(() => {
    const sorted = [...appStore.apps]
    sorted.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      return dateB - dateA
    })
    return sorted.slice(0, 5)
  })

  onMounted(async () => {
    try {
      await Promise.all([projectStore.fetchProjects(), appStore.fetchApps()])
    } finally {
      loading.value = false
    }
  })

  function formatDate (dateString?: string) {
    if (!dateString) {
      return '-'
    }
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  function getStatusColor (status?: string) {
    const colors: Record<string, string> = {
      running: 'success',
      stopped: 'grey',
      error: 'error',
      starting: 'warning',
    }
    return colors[status || 'stopped'] || 'grey'
  }

  function getStatusIcon (status?: string) {
    const icons: Record<string, string> = {
      running: 'mdi-check-circle',
      stopped: 'mdi-stop-circle',
      error: 'mdi-alert-circle',
      starting: 'mdi-loading',
    }
    return icons[status || 'stopped'] || 'mdi-circle'
  }

  function handleRepoSelect (repo: GitRepo) {
    showRepos.value = false
    // Redireciona para criar projeto com o repo selecionado
    router.push({
      path: '/projects',
      query: { repo: repo.clone_url, name: repo.name },
    })
  }
</script>
