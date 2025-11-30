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
      <div class="d-flex align-center mb-4">
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
            {{ appStore.currentApp.status || 'stopped' }}
          </v-chip>
        </div>
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
                  <v-list-item-subtitle>{{ appStore.currentApp.id }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template #prepend>
                    <v-icon>mdi-git</v-icon>
                  </template>
                  <v-list-item-title>Repositório</v-list-item-title>
                  <v-list-item-subtitle>{{ appStore.currentApp.git }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="appStore.currentApp.domain">
                  <template #prepend>
                    <v-icon>mdi-web</v-icon>
                  </template>
                  <v-list-item-title>Domínio</v-list-item-title>
                  <v-list-item-subtitle>
                    <a :href="`https://${appStore.currentApp.domain}`" target="_blank">
                      {{ appStore.currentApp.domain }}
                    </a>
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="appStore.currentApp.port">
                  <template #prepend>
                    <v-icon>mdi-numeric</v-icon>
                  </template>
                  <v-list-item-title>Porta</v-list-item-title>
                  <v-list-item-subtitle>{{ appStore.currentApp.port }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template #prepend>
                    <v-icon>mdi-calendar</v-icon>
                  </template>
                  <v-list-item-title>Criado em</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(appStore.currentApp.created_at) }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <!-- Variáveis de Ambiente -->
          <v-card v-if="appStore.currentApp.variables">
            <v-card-title>Variáveis de Ambiente</v-card-title>
            <v-card-text>
              <v-table v-if="Object.keys(appStore.currentApp.variables).length > 0" density="compact">
                <thead>
                  <tr>
                    <th>Chave</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(value, key) in appStore.currentApp.variables" :key="key">
                    <td><code>{{ key }}</code></td>
                    <td><code>{{ value }}</code></td>
                  </tr>
                </tbody>
              </v-table>
              <p v-else class="text-grey">Nenhuma variável configurada</p>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>Ações</v-card-title>
            <v-card-text>
              <v-btn
                block
                class="mb-2"
                color="success"
                :disabled="appStore.currentApp.status === 'running'"
                prepend-icon="mdi-play"
              >
                Deploy
              </v-btn>
              <v-btn
                block
                class="mb-2"
                color="warning"
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
                prepend-icon="mdi-file-document"
                variant="outlined"
              >
                Ver Logs
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { useAppStore } from '@/stores'

  const route = useRoute()
  const projectId = (route.params as { projectId: string }).projectId || ''
  const appId = (route.params as { appId: string }).appId || ''

  const appStore = useAppStore()
  const loading = ref(true)

  onMounted(async () => {
    try {
      await appStore.fetchApp(appId)
    } finally {
      loading.value = false
    }
  })

  function formatDate (dateString?: string) {
    if (!dateString) return '-'
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
