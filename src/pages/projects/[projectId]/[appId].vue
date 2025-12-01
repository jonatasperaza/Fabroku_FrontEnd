<template>
  <v-container>
    <v-btn
      class="mb-4"
      prepend-icon="mdi-arrow-left"
      variant="text"
      @click="$router.push(`/projects/${projectId}`)"
    >
      Voltar para Projeto
    </v-btn>

    <!-- Loading -->
    <v-progress-linear v-if="loading" indeterminate />

    <template v-if="appStore.currentApp">
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="d-flex align-center">
          <v-icon
            class="mr-3"
            :color="getStatusColor(appStore.currentApp.status)"
            size="32"
          >
            {{ getStatusIcon(appStore.currentApp.status) }}
          </v-icon>
          <div>
            <h1 class="text-h4">{{ appStore.currentApp.name }}</h1>
            <v-chip
              class="mt-1"
              :color="getStatusColor(appStore.currentApp.status)"
              size="small"
            >
              {{ appStore.currentApp.status || "stopped" }}
            </v-chip>
          </div>
        </div>
        <v-btn
          color="primary"
          :loading="refreshing"
          prepend-icon="mdi-refresh"
          variant="tonal"
          @click="refreshStatus"
        >
          Atualizar Status
        </v-btn>
      </div>

      <v-row>
        <v-col cols="12" md="8">
          <v-card class="mb-4">
            <v-card-title>Detalhes do App</v-card-title>
            <v-card-text>
              <v-list>
                <v-list-item>
                  <template #prepend>
                    <v-icon>mdi-identifier</v-icon>
                  </template>
                  <v-list-item-title>ID</v-list-item-title>
                  <v-list-item-subtitle>{{
                    appStore.currentApp.id
                  }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template #prepend>
                    <v-icon>mdi-git</v-icon>
                  </template>
                  <v-list-item-title>Repositório</v-list-item-title>
                  <v-list-item-subtitle>
                    <a :href="appStore.currentApp.git" target="_blank">
                      {{ appStore.currentApp.git }}
                    </a>
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="appStore.currentApp.branch">
                  <template #prepend>
                    <v-icon>mdi-source-branch</v-icon>
                  </template>
                  <v-list-item-title>Branch</v-list-item-title>
                  <v-list-item-subtitle>{{
                    appStore.currentApp.branch
                  }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="appStore.currentApp.domain">
                  <template #prepend>
                    <v-icon>mdi-web</v-icon>
                  </template>
                  <v-list-item-title>Domínio</v-list-item-title>
                  <v-list-item-subtitle>
                    <a
                      :href="`https://${appStore.currentApp.domain}`"
                      target="_blank"
                    >
                      {{ appStore.currentApp.domain }}
                      <v-icon size="small">mdi-open-in-new</v-icon>
                    </a>
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="appStore.currentApp.port">
                  <template #prepend>
                    <v-icon>mdi-numeric</v-icon>
                  </template>
                  <v-list-item-title>Porta</v-list-item-title>
                  <v-list-item-subtitle>{{
                    appStore.currentApp.port
                  }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="appStore.currentApp.name_dokku">
                  <template #prepend>
                    <v-icon>mdi-server</v-icon>
                  </template>
                  <v-list-item-title>Nome Dokku</v-list-item-title>
                  <v-list-item-subtitle>{{
                    appStore.currentApp.name_dokku
                  }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="appStore.currentApp.task_id">
                  <template #prepend>
                    <v-icon>mdi-clipboard-list</v-icon>
                  </template>
                  <v-list-item-title>Task ID</v-list-item-title>
                  <v-list-item-subtitle>{{
                    appStore.currentApp.task_id
                  }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template #prepend>
                    <v-icon>mdi-calendar</v-icon>
                  </template>
                  <v-list-item-title>Criado em</v-list-item-title>
                  <v-list-item-subtitle>{{
                    formatDate(appStore.currentApp.created_at)
                  }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template #prepend>
                    <v-icon>mdi-calendar-edit</v-icon>
                  </template>
                  <v-list-item-title>Atualizado em</v-list-item-title>
                  <v-list-item-subtitle>{{
                    formatDate(appStore.currentApp.updated_at)
                  }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <!-- Variáveis de Ambiente -->
          <v-card class="mb-4">
            <v-card-title class="d-flex justify-space-between align-center">
              <span>Variáveis de Ambiente</span>
              <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                size="small"
                variant="tonal"
                @click="dialogEnvVar = true"
              >
                Adicionar
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-table
                v-if="
                  appStore.currentApp.variables &&
                    Object.keys(appStore.currentApp.variables).length > 0
                "
                density="compact"
              >
                <thead>
                  <tr>
                    <th>Chave</th>
                    <th>Valor</th>
                    <th width="80">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(value, key) in appStore.currentApp.variables"
                    :key="key"
                  >
                    <td>
                      <code>{{ key }}</code>
                    </td>
                    <td>
                      <code>{{ showSecrets ? value : "••••••••" }}</code>
                    </td>
                    <td>
                      <v-btn
                        color="error"
                        icon
                        size="small"
                        variant="text"
                        @click="removeEnvVar(String(key))"
                      >
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>
              <div v-else class="text-center py-4 text-grey">
                <v-icon class="mb-2" size="32">mdi-variable</v-icon>
                <p>Nenhuma variável configurada</p>
              </div>
              <v-switch
                v-if="
                  appStore.currentApp.variables &&
                    Object.keys(appStore.currentApp.variables).length > 0
                "
                v-model="showSecrets"
                class="mt-2"
                density="compact"
                hide-details
                label="Mostrar valores"
              />
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <!-- Ações -->
          <v-card class="mb-4">
            <v-card-title>Ações</v-card-title>
            <v-card-text>
              <v-btn
                block
                class="mb-2"
                color="success"
                :disabled="
                  appStore.currentApp.status === 'running' ||
                    appStore.currentApp.status === 'starting'
                "
                prepend-icon="mdi-rocket-launch"
              >
                Deploy
              </v-btn>
              <v-btn
                block
                class="mb-2"
                color="warning"
                :disabled="appStore.currentApp.status !== 'running'"
                prepend-icon="mdi-restart"
              >
                Restart
              </v-btn>
              <v-btn
                block
                class="mb-2"
                :disabled="appStore.currentApp.status === 'stopped'"
                prepend-icon="mdi-stop"
                variant="outlined"
              >
                Parar
              </v-btn>
              <v-btn
                block
                class="mb-2"
                prepend-icon="mdi-file-document"
                :to="`/projects/${projectId}/${appId}/logs`"
                variant="outlined"
              >
                Ver Logs
              </v-btn>
              <v-divider class="my-3" />
              <v-btn
                block
                color="error"
                prepend-icon="mdi-delete"
                variant="outlined"
                @click="confirmDelete = true"
              >
                Deletar App
              </v-btn>
            </v-card-text>
          </v-card>

          <!-- Status Card -->
          <v-card v-if="appStore.currentApp.domain">
            <v-card-title>Acesso Rápido</v-card-title>
            <v-card-text>
              <v-btn
                block
                color="primary"
                :href="`https://${appStore.currentApp.domain}`"
                prepend-icon="mdi-open-in-new"
                target="_blank"
                variant="tonal"
              >
                Abrir App
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Dialog Adicionar Variável -->
    <v-dialog v-model="dialogEnvVar" max-width="500">
      <v-card>
        <v-card-title>Nova Variável de Ambiente</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newEnvVar.key"
            autofocus
            class="mb-4"
            label="Chave"
            placeholder="DATABASE_URL"
            variant="outlined"
          />
          <v-text-field
            v-model="newEnvVar.value"
            label="Valor"
            placeholder="postgres://..."
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogEnvVar = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            :disabled="!newEnvVar.key || !newEnvVar.value"
            :loading="savingEnvVar"
            @click="addEnvVar"
          >
            Adicionar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Confirmar Exclusão -->
    <v-dialog v-model="confirmDelete" max-width="400">
      <v-card>
        <v-card-title class="text-error">
          <v-icon class="mr-2">mdi-alert</v-icon>
          Confirmar Exclusão
        </v-card-title>
        <v-card-text>
          Tem certeza que deseja deletar o app
          <strong>{{ appStore.currentApp?.name }}</strong>?
          <br>
          <span class="text-error">Esta ação não pode ser desfeita.</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmDelete = false">Cancelar</v-btn>
          <v-btn color="error" :loading="deleting" @click="handleDeleteApp">
            Deletar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useAppStore } from '@/stores'

  const route = useRoute()
  const router = useRouter()
  const projectId = (route.params as { projectId: string }).projectId || ''
  const appId = (route.params as { appId: string }).appId || ''

  const appStore = useAppStore()
  const loading = ref(true)
  const refreshing = ref(false)
  const showSecrets = ref(false)
  const dialogEnvVar = ref(false)
  const savingEnvVar = ref(false)
  const confirmDelete = ref(false)
  const deleting = ref(false)
  const newEnvVar = ref({ key: '', value: '' })

  onMounted(async () => {
    try {
      await appStore.fetchApp(appId)
    } finally {
      loading.value = false
    }
  })

  async function refreshStatus () {
    refreshing.value = true
    try {
      await appStore.fetchAppStatus(appId)
    } finally {
      refreshing.value = false
    }
  }

  async function addEnvVar () {
    if (!newEnvVar.value.key || !newEnvVar.value.value) {
      return
    }
    savingEnvVar.value = true
    try {
      const currentVars = appStore.currentApp?.variables || {}
      await appStore.updateApp(appId, {
        variables: {
          ...currentVars,
          [newEnvVar.value.key]: newEnvVar.value.value,
        },
      })
      dialogEnvVar.value = false
      newEnvVar.value = { key: '', value: '' }
    } finally {
      savingEnvVar.value = false
    }
  }

  async function removeEnvVar (key: string) {
    const currentVars = { ...appStore.currentApp?.variables }
    delete currentVars[key]
    await appStore.updateApp(appId, { variables: currentVars })
  }

  async function handleDeleteApp () {
    deleting.value = true
    try {
      await appStore.deleteApp(appId)
      router.push(`/projects/${projectId}`)
    } finally {
      deleting.value = false
    }
  }

  function formatDate (dateString?: string) {
    if (!dateString) {
      return '-'
    }
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
</script>
