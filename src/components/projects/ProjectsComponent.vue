<template>
  <v-container>
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4">Meus Projetos</h1>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="dialogCreate = true"
      >
        Novo Projeto
      </v-btn>
    </div>

    <!-- Loading -->
    <v-progress-linear v-if="projectStore.loading" indeterminate />

    <!-- Error -->
    <v-alert v-if="projectStore.error" class="mb-4" type="error">
      {{ projectStore.error }}
    </v-alert>

    <!-- Lista de Projetos -->
    <v-row v-if="!projectStore.loading">
      <v-col
        v-for="project in projectStore.projects"
        :key="project.id"
        cols="12"
        md="4"
      >
        <v-card
          class="h-100"
          hover
          @click="$router.push(`/projects/${project.id}`)"
        >
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="primary">mdi-folder</v-icon>
            {{ project.name }}
          </v-card-title>
          <v-card-subtitle>
            Criado em: {{ formatDate(project.created_at) }}
          </v-card-subtitle>
          <v-card-text>
            <v-chip class="mr-1" size="small">
              <v-icon size="small" start>mdi-account-multiple</v-icon>
              {{ project.users?.length || 0 }} usuários
            </v-chip>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="primary"
              :to="`/projects/${project.id}`"
              variant="text"
            >
              Abrir
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Empty State -->
      <v-col v-if="projectStore.projects.length === 0" cols="12">
        <v-card class="text-center pa-8">
          <v-icon class="mb-4" color="grey" size="64">mdi-folder-outline</v-icon>
          <h3 class="text-h6 mb-2">Nenhum projeto ainda</h3>
          <p class="text-grey mb-4">Crie seu primeiro projeto para começar</p>
          <v-btn color="primary" @click="dialogCreate = true">
            Criar Projeto
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog Criar Projeto -->
    <v-dialog v-model="dialogCreate" max-width="500">
      <v-card>
        <v-card-title>Novo Projeto</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newProject.name"
            autofocus
            label="Nome do Projeto"
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
            @click="handleCreateProject"
          >
            Criar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useProjectStore } from '@/stores'

  const projectStore = useProjectStore()

  const dialogCreate = ref(false)
  const creating = ref(false)
  const newProject = ref({
    name: '',
    users: [],
  })

  onMounted(() => {
    projectStore.fetchProjects()
  })

  function formatDate (dateString?: string) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  async function handleCreateProject () {
    if (!newProject.value.name.trim()) return

    creating.value = true
    try {
      await projectStore.createProject({
        name: newProject.value.name,
        users: [],
      })
      dialogCreate.value = false
      newProject.value.name = ''
    } catch (error_) {
      console.error('Erro ao criar projeto:', error_)
    } finally {
      creating.value = false
    }
  }
</script>
