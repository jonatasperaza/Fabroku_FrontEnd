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
          <p>
            <strong>Criado em:</strong>
            {{ formatDate(projectStore.currentProject.created_at) }}
          </p>
          <p>
            <strong>Atualizado em:</strong>
            {{ formatDate(projectStore.currentProject.updated_at) }}
          </p>
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
        <v-col v-for="app in projectApps" :key="app.id" cols="12" md="4">
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
                {{ app.status || "stopped" }}
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
            <v-icon
              class="mb-4"
              color="grey"
              size="64"
            >mdi-application-outline</v-icon>
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
    <v-dialog v-model="dialogCreate" max-width="600">
      <v-card>
        <v-card-title>Novo App</v-card-title>
        <v-card-text>
          <v-tabs v-model="createTab" class="mb-4">
            <v-tab value="manual">Manual</v-tab>
            <v-tab value="github">GitHub</v-tab>
          </v-tabs>

          <v-tabs-window v-model="createTab">
            <v-tabs-window-item value="manual">
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
              <v-text-field
                v-model="newApp.branch"
                class="mt-4"
                hint="Deixe vazio para usar a branch padrão"
                label="Branch"
                variant="outlined"
              />

              <!-- Variáveis de Ambiente -->
              <v-divider class="my-4" />

              <div class="d-flex justify-space-between align-center mb-2">
                <h3 class="text-subtitle-1">Variáveis de Ambiente (Opcional)</h3>
                <div class="d-flex gap-2">
                  <v-btn
                    color="secondary"
                    prepend-icon="mdi-file-import"
                    size="small"
                    variant="text"
                    @click="dialogImportEnv = true"
                  >
                    Importar .env
                  </v-btn>
                  <v-btn
                    color="primary"
                    prepend-icon="mdi-plus"
                    size="small"
                    variant="text"
                    @click="addEnvVarToNewApp"
                  >
                    Adicionar
                  </v-btn>
                </div>
              </div>

              <!-- Lista de variáveis -->
              <v-list v-if="newAppEnvVars.length > 0" density="compact">
                <v-list-item
                  v-for="(envVar, index) in newAppEnvVars"
                  :key="index"
                >
                  <template #prepend>
                    <v-icon size="small">mdi-variable</v-icon>
                  </template>
                  <v-list-item-title>
                    <code>{{ envVar.key }}</code> = <code>{{ envVar.value }}</code>
                  </v-list-item-title>
                  <template #append>
                    <v-btn
                      color="error"
                      icon
                      size="x-small"
                      variant="text"
                      @click="removeEnvVarFromNewApp(index)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                </v-list-item>
              </v-list>

              <p v-else class="text-caption text-grey text-center py-2">
                Nenhuma variável adicionada
              </p>
            </v-tabs-window-item>

            <v-tabs-window-item value="github">
              <RepoSelector
                @cancel="dialogCreate = false"
                @select="handleRepoSelect"
              />
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card-text>
        <v-card-actions v-if="createTab === 'manual'">
          <v-spacer />
          <v-btn variant="text" @click="dialogCreate = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="creating" @click="handleCreateApp">
            Criar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Adicionar Variável -->
    <v-dialog v-model="dialogAddEnvVar" max-width="500">
      <v-card>
        <v-card-title>Adicionar Variável</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="tempEnvVar.key"
            autofocus
            class="mb-4"
            hint="Ex: DATABASE_URL, API_KEY"
            label="Chave"
            placeholder="DATABASE_URL"
            variant="outlined"
          />
          <v-text-field
            v-model="tempEnvVar.value"
            hint="Ex: postgres://..., sk-..."
            label="Valor"
            placeholder="postgres://..."
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogAddEnvVar = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            :disabled="!tempEnvVar.key || !tempEnvVar.value"
            @click="confirmAddEnvVar"
          >
            Adicionar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Importar .env -->
    <v-dialog v-model="dialogImportEnv" max-width="600">
      <v-card>
        <v-card-title>Importar Variáveis do .env</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="envFileContent"
            autofocus
            hint="Cole o conteúdo do seu arquivo .env aqui"
            label="Conteúdo do .env"
            placeholder="DATABASE_URL=postgres://...
API_KEY=sk-...
PORT=3000"
            rows="10"
            variant="outlined"
          />
          <v-alert
            v-if="importError"
            class="mt-2"
            closable
            color="error"
            type="error"
            @click:close="importError = ''"
          >
            {{ importError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogImportEnv = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            :disabled="!envFileContent"
            @click="importEnvFile"
          >
            Importar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import type { GitRepo } from '@/interfaces'

  import { computed, onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'

  import RepoSelector from '@/components/git/RepoSelector.vue'
  import { useAppStore, useProjectStore } from '@/stores'

  const route = useRoute()
  const projectId = (route.params as { projectId: string }).projectId || ''

  const projectStore = useProjectStore()
  const appStore = useAppStore()

  const loading = ref(true)
  const dialogCreate = ref(false)
  const creating = ref(false)
  const createTab = ref('manual')
  const newApp = ref({
    name: '',
    git: '',
    branch: '',
  })

  // Estado para variáveis de ambiente
  const newAppEnvVars = ref<Array<{ key: string, value: string }>>([])
  const dialogAddEnvVar = ref(false)
  const tempEnvVar = ref({ key: '', value: '' })
  const dialogImportEnv = ref(false)
  const envFileContent = ref('')
  const importError = ref('')

  // Apps do projeto atual
  const projectApps = computed(() => appStore.apps)

  onMounted(async () => {
    try {
      await projectStore.fetchProject(projectId)
      await appStore.fetchAppsByProject(projectId)
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
      RUNNING: 'success',
      STOPPED: 'grey',
      ERROR: 'error',
      STARTING: 'warning',
      DELETING: 'pink',
    }
    return colors[status || 'STOPPED'] || 'grey'
  }

  function getStatusIcon (status?: string) {
    const icons: Record<string, string> = {
      RUNNING: 'mdi-check-circle',
      STOPPED: 'mdi-stop-circle',
      ERROR: 'mdi-alert-circle',
      STARTING: 'mdi-loading',
      DELETING: 'mdi-delete-clock',
    }
    return icons[status || 'STOPPED'] || 'mdi-circle'
  }

  // Funções para gerenciar variáveis de ambiente
  function addEnvVarToNewApp () {
    tempEnvVar.value = { key: '', value: '' }
    dialogAddEnvVar.value = true
  }

  function confirmAddEnvVar () {
    if (!tempEnvVar.value.key || !tempEnvVar.value.value) {
      return
    }

    newAppEnvVars.value.push({
      key: tempEnvVar.value.key,
      value: tempEnvVar.value.value,
    })

    dialogAddEnvVar.value = false
    tempEnvVar.value = { key: '', value: '' }
  }

  function removeEnvVarFromNewApp (index: number) {
    newAppEnvVars.value.splice(index, 1)
  }

  function importEnvFile () {
    importError.value = ''

    if (!envFileContent.value.trim()) {
      importError.value = 'Por favor, cole o conteúdo do arquivo .env'
      return
    }

    try {
      const lines = envFileContent.value.split('\n')
      let importedCount = 0

      for (const line of lines) {
        const trimmed = line.trim()

        // Ignora linhas vazias e comentários
        if (!trimmed || trimmed.startsWith('#')) {
          continue
        }

        // Procura por KEY=VALUE
        const equalIndex = trimmed.indexOf('=')
        if (equalIndex === -1) {
          continue
        }

        const key = trimmed.slice(0, equalIndex).trim()
        let value = trimmed.slice(equalIndex + 1).trim()

        // Remove aspas do valor se existirem
        if ((value.startsWith('\'') && value.endsWith('\''))
          || (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1)
        }

        if (key && value) {
          // Verifica se já existe
          const existingIndex = newAppEnvVars.value.findIndex(v => v.key === key)
          if (existingIndex === -1) {
            // Adiciona nova
            newAppEnvVars.value.push({ key, value })
          } else {
            // Atualiza existente
            const existing = newAppEnvVars.value[existingIndex]
            if (existing) {
              existing.value = value
            }
          }
          importedCount++
        }
      }

      if (importedCount === 0) {
        importError.value = 'Nenhuma variável válida encontrada no formato KEY=VALUE'
        return
      }

      // Sucesso - fecha dialog e limpa
      dialogImportEnv.value = false
      envFileContent.value = ''
    } catch (error_) {
      importError.value = 'Erro ao processar arquivo .env'
      console.error('Erro ao importar .env:', error_)
    }
  }

  async function handleCreateApp () {
    if (!newApp.value.name.trim() || !newApp.value.git.trim()) {
      return
    }

    creating.value = true
    try {
      // Converter array de variáveis para objeto
      const variables: Record<string, string> = {}
      for (const envVar of newAppEnvVars.value) {
        variables[envVar.key] = envVar.value
      }

      await appStore.createApp({
        name: newApp.value.name,
        git: newApp.value.git,
        branch: newApp.value.branch || undefined,
        project: projectId,
        variables: Object.keys(variables).length > 0 ? variables : undefined,
      })
      dialogCreate.value = false
      newApp.value = { name: '', git: '', branch: '' }
      newAppEnvVars.value = []
    } catch (error_) {
      console.error('Erro ao criar app:', error_)
    } finally {
      creating.value = false
    }
  }

  async function handleRepoSelect (repo: GitRepo) {
    creating.value = true
    try {
      // Converter array de variáveis para objeto
      const variables: Record<string, string> = {}
      for (const envVar of newAppEnvVars.value) {
        variables[envVar.key] = envVar.value
      }

      await appStore.createApp({
        name: repo.name,
        git: repo.clone_url,
        branch: repo.default_branch,
        project: projectId,
        variables: Object.keys(variables).length > 0 ? variables : undefined,
      })
      dialogCreate.value = false
      newAppEnvVars.value = []
    } catch (error_) {
      console.error('Erro ao criar app:', error_)
    } finally {
      creating.value = false
    }
  }
</script>
