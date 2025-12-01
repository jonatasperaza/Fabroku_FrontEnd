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
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon class="mr-2" color="primary">mdi-folder</v-icon>
              {{ project.name }}
            </div>
            <v-btn
              color="error"
              icon
              size="small"
              variant="text"
              @click.stop="openDeleteDialog(project)"
            >
              <v-icon>mdi-delete</v-icon>
              <v-tooltip activator="parent" location="top">
                Deletar projeto
              </v-tooltip>
            </v-btn>
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
          <v-icon
            class="mb-4"
            color="grey"
            size="64"
          >mdi-folder-outline</v-icon>
          <h3 class="text-h6 mb-2">Nenhum projeto ainda</h3>
          <p class="text-grey mb-4">Crie seu primeiro projeto para começar</p>
          <v-btn color="primary" @click="dialogCreate = true">
            Criar Projeto
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog Criar Projeto -->
    <v-dialog v-model="dialogCreate" max-width="600">
      <v-card>
        <v-card-title>Novo Projeto</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newProject.name"
            autofocus
            class="mb-4"
            label="Nome do Projeto"
            required
            variant="outlined"
          />

          <!-- Seleção de Equipe -->
          <div class="mb-2 text-subtitle-2">Equipe do Projeto</div>

          <!-- Usuário atual (sempre incluído) -->
          <v-chip
            v-if="authStore.user"
            class="mb-3"
            color="primary"
            prepend-icon="mdi-account-check"
          >
            <v-avatar size="24" start>
              <v-img :src="authStore.user.avatar_url" />
            </v-avatar>
            {{ authStore.user.login }} (você)
          </v-chip>

          <!-- Busca de usuários -->
          <v-autocomplete
            v-model="selectedUsers"
            v-model:search="searchQuery"
            chips
            clearable
            closable-chips
            hide-no-data
            hide-selected
            item-title="username"
            item-value="id"
            :items="searchResults"
            label="Adicionar membros (buscar por username do GitHub)"
            :loading="searching"
            multiple
            placeholder="Digite o username do GitHub..."
            return-object
            variant="outlined"
            @update:search="handleSearch"
          >
            <template #chip="{ item, props: chipProps }">
              <v-chip v-bind="chipProps">
                <v-avatar size="24" start>
                  <v-img :src="item.raw.avatar_url" />
                </v-avatar>
                {{ item.raw.username }}
              </v-chip>
            </template>
            <template #item="{ item, props: itemProps }">
              <v-list-item v-bind="itemProps">
                <template #prepend>
                  <v-avatar size="32">
                    <v-img :src="item.raw.avatar_url" />
                  </v-avatar>
                </template>
                <v-list-item-title>{{ item.raw.username }}</v-list-item-title>
                <v-list-item-subtitle v-if="item.raw.name">
                  {{ item.raw.name }}
                </v-list-item-subtitle>
              </v-list-item>
            </template>
            <template #no-data>
              <v-list-item v-if="searchQuery && searchQuery.length >= 2">
                <v-list-item-title>
                  Nenhum usuário encontrado para "{{ searchQuery }}"
                </v-list-item-title>
              </v-list-item>
              <v-list-item v-else>
                <v-list-item-title>
                  Digite pelo menos 2 caracteres para buscar
                </v-list-item-title>
              </v-list-item>
            </template>
          </v-autocomplete>

          <v-alert
            class="mt-2"
            density="compact"
            icon="mdi-information"
            type="info"
            variant="tonal"
          >
            Você será adicionado automaticamente ao projeto.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Cancelar</v-btn>
          <v-btn
            color="primary"
            :disabled="!newProject.name.trim()"
            :loading="creating"
            @click="handleCreateProject"
          >
            Criar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Confirmar Exclusão de Projeto -->
    <v-dialog v-model="dialogDelete" max-width="450">
      <v-card>
        <v-card-title class="text-error">
          <v-icon class="mr-2">mdi-alert</v-icon>
          Confirmar Exclusão
        </v-card-title>
        <v-card-text>
          <p class="mb-2">
            Tem certeza que deseja deletar o projeto
            <strong>{{ projectToDelete?.name }}</strong>?
          </p>
          <v-alert
            class="mt-3"
            color="error"
            density="compact"
            icon="mdi-alert-circle"
            variant="tonal"
          >
            <strong>Atenção:</strong> Todos os apps deste projeto também serão
            deletados. Esta ação não pode ser desfeita.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog">Cancelar</v-btn>
          <v-btn color="error" :loading="deleting" @click="handleDeleteProject">
            Deletar Projeto
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import type { Project, User } from '@/interfaces'

  import { onMounted, ref } from 'vue'

  import { UsersService } from '@/services'
  import { useAuthStore, useProjectStore } from '@/stores'

  const projectStore = useProjectStore()
  const authStore = useAuthStore()

  const dialogCreate = ref(false)
  const dialogDelete = ref(false)
  const creating = ref(false)
  const deleting = ref(false)
  const searching = ref(false)
  const searchQuery = ref('')
  const searchResults = ref<User[]>([])
  const selectedUsers = ref<User[]>([])
  const searchTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
  const projectToDelete = ref<Project | null>(null)

  const newProject = ref({
    name: '',
  })

  onMounted(() => {
    projectStore.fetchProjects()
  })

  function formatDate (dateString?: string) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  async function handleSearch (query: string) {
    // Limpa o timeout anterior
    if (searchTimeout.value) {
      clearTimeout(searchTimeout.value)
    }

    // Precisa de pelo menos 2 caracteres
    if (!query || query.length < 2) {
      searchResults.value = []
      return
    }

    // Debounce de 300ms
    searchTimeout.value = setTimeout(async () => {
      searching.value = true
      try {
        const results = await UsersService.searchByUsername(query)
        // Filtra o usuário atual da lista de resultados
        searchResults.value = results.filter(u => u.id !== authStore.user?.id)
      } catch (error_) {
        console.error('Erro ao buscar usuários:', error_)
        searchResults.value = []
      } finally {
        searching.value = false
      }
    }, 300)
  }

  function closeDialog () {
    dialogCreate.value = false
    newProject.value.name = ''
    selectedUsers.value = []
    searchQuery.value = ''
    searchResults.value = []
  }

  async function handleCreateProject () {
    if (!newProject.value.name.trim()) return

    creating.value = true
    try {
      // Monta a lista de IDs: usuário atual + selecionados
      const userIds: number[] = []

      // Adiciona o usuário atual primeiro
      if (authStore.user?.id) {
        userIds.push(authStore.user.id)
      }

      // Adiciona os usuários selecionados
      for (const user of selectedUsers.value) {
        if (user.id && !userIds.includes(user.id)) {
          userIds.push(user.id)
        }
      }

      await projectStore.createProject({
        name: newProject.value.name,
        users: userIds,
      })

      closeDialog()
    } catch (error_) {
      console.error('Erro ao criar projeto:', error_)
    } finally {
      creating.value = false
    }
  }

  function openDeleteDialog (project: Project) {
    projectToDelete.value = project
    dialogDelete.value = true
  }

  function closeDeleteDialog () {
    dialogDelete.value = false
    projectToDelete.value = null
  }

  async function handleDeleteProject () {
    if (!projectToDelete.value?.id) return

    deleting.value = true
    try {
      await projectStore.deleteProject(projectToDelete.value.id)
      closeDeleteDialog()
    } catch (error_) {
      console.error('Erro ao deletar projeto:', error_)
    } finally {
      deleting.value = false
    }
  }
</script>
