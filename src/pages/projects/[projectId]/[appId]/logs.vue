<template>
  <v-container>
    <v-btn
      class="mb-4"
      prepend-icon="mdi-arrow-left"
      variant="text"
      @click="$router.push(`/projects/${projectId}/${appId}`)"
    >
      Voltar para App
    </v-btn>

    <!-- Loading -->
    <v-progress-linear v-if="loading && !appStore.currentApp" indeterminate />

    <template v-if="appStore.currentApp">
      <div class="d-flex align-center justify-space-between mb-4">
        <div>
          <h1 class="text-h4">Logs - {{ appStore.currentApp.name }}</h1>
          <p class="text-grey">
            Task ID: {{ appStore.currentApp.task_id || "Nenhuma tarefa ativa" }}
          </p>
        </div>
        <v-btn
          color="primary"
          prepend-icon="mdi-refresh"
          variant="tonal"
          @click="refreshLogs"
        >
          Atualizar
        </v-btn>
      </div>

      <LogViewer
        :has-more="logStore.hasMore"
        :loading="logStore.loading"
        :logs="logStore.logs"
        :task-id="appStore.currentApp.task_id || undefined"
        title="Logs da Aplicação"
        @load-more="loadMoreLogs"
        @stream-logs="handleStreamLogs"
      />
    </template>
  </v-container>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import LogViewer from '@/components/logs/LogViewer.vue'
  import { useAppStore, useLogStore } from '@/stores'

  const route = useRoute()
  const projectId = (route.params as { projectId: string }).projectId || ''
  const appId = (route.params as { appId: string }).appId || ''

  const appStore = useAppStore()
  const logStore = useLogStore()
  const loading = ref(true)

  onMounted(async () => {
    try {
      await appStore.fetchApp(appId)
      if (appStore.currentApp?.id) {
        await logStore.fetchLogsByApp(Number(appStore.currentApp.id))
      }
    } finally {
      loading.value = false
    }
  })

  async function refreshLogs () {
    if (appStore.currentApp?.id) {
      await logStore.fetchLogsByApp(Number(appStore.currentApp.id))
    }
  }

  async function loadMoreLogs () {
    if (appStore.currentApp?.id) {
      await logStore.loadMore({ app: Number(appStore.currentApp.id) })
    }
  }

  async function handleStreamLogs (taskId: string, afterId?: number) {
    await logStore.streamLogs(taskId, afterId)
  }
</script>
