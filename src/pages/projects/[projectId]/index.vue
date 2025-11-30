<template>
  <v-container>
    <v-btn
      class="mb-4"
      prepend-icon="mdi-arrow-left"
      variant="text"
      @click="$router.push('/projects')"
    >
      Voltar para Projetos
    </v-btn>

    <!-- Loading -->
    <v-progress-linear v-if="loading" indeterminate />

    <template v-if="projectStore.currentProject">
      <h1 class="text-h4 mb-4">{{ projectStore.currentProject.name }}</h1>

      <v-card class="mb-6">
        <v-card-title>Detalhes do Projeto</v-card-title>
        <v-card-text>
          <p><strong>ID:</strong> {{ projectStore.currentProject.id }}</p>
          <p><strong>Criado em:</strong> {{ formatDate(projectStore.currentProject.created_at) }}</p>
          <p><strong>Atualizado em:</strong> {{ formatDate(projectStore.currentProject.updated_at) }}</p>
        </v-card-text>
      </v-card>

      <div class="d-flex justify-space-between align-center mb-4">
        <h2 class="text-h5">Apps deste Projeto</h2>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="dialogCreate = true"
        >
          Novo App
        </v-btn>
      </div>

      <!-- Loading Apps -->
      <v-progress-linear v-if="appStore.loading" indeterminate />

      <v-row v-if="!appStore.loading">
        <!-- Lista de apps do projeto -->
        <v-col
          v-for="app in projectApps"
          :key="app.id"
          cols="12"
          md="4"
        >
          <v-card
            class="h-100"
            hover
            @click="$router.push(`/projects/${projectId}/${app.id}`)"
          >
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2" :color="getStatusColor(app.status)">
                {{ getStatusIcon(app.status) }}
              </v-icon>
              {{ app.name }}
            </v-card-title>
            <v-card-subtitle>{{ app.git }}</v-card-subtitle>
            <v-card-text>
              <v-chip :color="getStatusColor(app.status)" size="small">
                {{ app.status || 'stopped' }}
              </v-chip>
              <span v-if="app.domain" class="ml-2 text-caption">
                {{ app.domain }}
              </span>
            </v-card-text>
            <v-card-actions>
              <v-btn
                color="primary"
                :to="`/projects/${projectId}/${app.id}`"
                variant="text"
              >
                Abrir App
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <!-- Empty State -->
        <v-col v-if="projectApps.length === 0" cols="12">
          <v-card class="text-center pa-8">
            <v-icon class="mb-4" color="grey" size="64">mdi-application-outline</v-icon>
            <h3 class="text-h6 mb-2">Nenhum app neste projeto</h3>
            <p class="text-grey mb-4">Crie seu primeiro app para começar</p>
            <v-btn color="primary" @click="dialogCreate = true">
              Criar App
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Dialog Criar App -->
    <v-dialog v-model="dialogCreate" max-width="500">
      <v-card>
        <v-card-title>Novo App</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newApp.name"
            autofocus
            class="mb-4"
            label="Nome do App"
            required
            variant="outlined"
          />
          <v-text-field
            v-model="newApp.git"
            hint="Ex: https://github.com/user/repo.git"
            label="URL do Repositório Git"
            required
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogCreate = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            :loading="creating"
            @click="handleCreateApp"
          >
            Criar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { useAppStore, useProjectStore } from '@/stores'

  const route = useRoute()
  const projectId = (route.params as { projectId: string }).projectId || ''

  const projectStore = useProjectStore()
  const appStore = useAppStore()

  const loading = ref(true)
  const dialogCreate = ref(false)
  const creating = ref(false)
  const newApp = ref({
    name: '',
    git: '',
  })

  // Filtra apps pelo projeto atual
  const projectApps = computed(() => appStore.fetchAppsByProject(projectId))

  onMounted(async () => {
    try {
      await projectStore.fetchProject(projectId)
      await appStore.fetchApps()
    } finally {
      loading.value = false
    }
  })

  function formatDate (dateString?: string) {
    if (!dateString) return '-'
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

  async function handleCreateApp () {
    if (!newApp.value.name.trim() || !newApp.value.git.trim()) return

    creating.value = true
    try {
      await appStore.createApp({
        name: newApp.value.name,
        git: newApp.value.git,
        project: projectId,
      })
      dialogCreate.value = false
      newApp.value.name = ''
      newApp.value.git = ''
    } catch (error_) {
      console.error('Erro ao criar app:', error_)
    } finally {
      creating.value = false
    }
  }
</script>
