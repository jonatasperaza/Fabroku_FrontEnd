<template>
  <v-card
    :class="{ 'log-viewer': true, 'log-viewer--dark': dark }"
    :loading="loading"
  >
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-console</v-icon>
        <span>{{ title || "Logs" }}</span>
        <v-chip v-if="logs.length > 0" class="ml-2" size="small">
          {{ logs.length }}
        </v-chip>
      </div>
      <div class="d-flex align-center ga-2">
        <v-btn
          v-if="streaming"
          color="error"
          size="small"
          variant="tonal"
          @click="stopStream"
        >
          <v-icon class="mr-1">mdi-stop</v-icon>
          Parar
        </v-btn>
        <v-btn
          v-else-if="taskId"
          color="success"
          size="small"
          variant="tonal"
          @click="startStream"
        >
          <v-icon class="mr-1">mdi-play</v-icon>
          Ao vivo
        </v-btn>
        <v-btn icon size="small" variant="text" @click="clearLogs">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
        <v-btn icon size="small" variant="text" @click="scrollToBottom">
          <v-icon>mdi-arrow-down</v-icon>
        </v-btn>
      </div>
    </v-card-title>

    <v-divider />

    <!-- Filtros -->
    <v-card-text v-if="showFilters" class="py-2">
      <v-row dense>
        <v-col cols="12" md="4">
          <v-select
            v-model="selectedLevel"
            clearable
            density="compact"
            hide-details
            :items="levelOptions"
            label="Nível"
            variant="outlined"
            @update:model-value="applyFilters"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-select
            v-model="selectedCategory"
            clearable
            density="compact"
            hide-details
            :items="categoryOptions"
            label="Categoria"
            variant="outlined"
            @update:model-value="applyFilters"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="searchQuery"
            clearable
            density="compact"
            hide-details
            label="Buscar"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            @update:model-value="applyFilters"
          />
        </v-col>
      </v-row>
    </v-card-text>

    <v-divider v-if="showFilters" />

    <!-- Área de logs com infinite scroll -->
    <v-infinite-scroll
      ref="logsContainer"
      class="logs-container"
      :empty-text="''"
      :loading="loading"
      mode="intersect"
      side="end"
      @load="handleLoadMore"
    >
      <div
        v-if="filteredLogs.length === 0 && !loading"
        class="text-center py-8 text-grey"
      >
        <v-icon class="mb-2" size="48">mdi-file-document-outline</v-icon>
        <p>Nenhum log encontrado</p>
      </div>

      <div
        v-for="log in filteredLogs"
        :key="log.id"
        class="log-entry"
        :class="`log-entry--${log.level.toLowerCase()}`"
      >
        <span class="log-timestamp">{{ formatTimestamp(log.created_at) }}</span>
        <v-chip
          class="log-level mx-2"
          :color="getLevelColor(log.level)"
          size="x-small"
        >
          {{ log.level }}
        </v-chip>
        <v-chip
          v-if="log.category"
          class="log-category mr-2"
          size="x-small"
          variant="outlined"
        >
          {{ log.category }}
        </v-chip>
        <div class="log-message">
          <template
            v-for="(line, idx) in formatLogMessage(log.message)"
            :key="idx"
          >
            <div
              :class="{
                'log-line-arrow':
                  line.startsWith('----->') || line.startsWith('=====>'),
              }"
            >
              {{ line }}
            </div>
          </template>
        </div>
        <v-progress-linear
          v-if="log.progress !== undefined && log.progress > 0"
          class="mt-1"
          :color="getLevelColor(log.level)"
          height="4"
          :model-value="log.progress"
        />
      </div>

      <template #loading>
        <v-progress-circular class="ma-4" indeterminate size="24" />
      </template>

      <template #empty>
        <div
          v-if="!hasMore && filteredLogs.length > 0"
          class="text-center py-4 text-grey"
        >
          <v-icon size="20">mdi-check-circle</v-icon>
          <span class="ml-2">Todos os logs carregados</span>
        </div>
      </template>
    </v-infinite-scroll>
  </v-card>
</template>

<script setup lang="ts">
  import type { AppLog, LogCategory, LogLevel } from '@/interfaces'
  import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

  interface Props {
    logs: AppLog[]
    loading?: boolean
    title?: string
    dark?: boolean
    taskId?: string
    showFilters?: boolean
    hasMore?: boolean
    autoScroll?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
    title: 'Logs',
    dark: true,
    showFilters: true,
    hasMore: false,
    autoScroll: true,
  })

  const emit = defineEmits<{
    'load-more': []
    'stream-logs': [taskId: string, afterId?: number]
    'stop-stream': []
  }>()

  const logsContainer = ref<HTMLElement | null>(null)
  const streaming = ref(false)
  const streamInterval = ref<number | null>(null)
  const selectedLevel = ref<LogLevel | null>(null)
  const selectedCategory = ref<LogCategory | null>(null)
  const searchQuery = ref('')

  const levelOptions = [
    { title: 'Debug', value: 'DEBUG' },
    { title: 'Info', value: 'INFO' },
    { title: 'Warning', value: 'WARNING' },
    { title: 'Error', value: 'ERROR' },
    { title: 'Success', value: 'SUCCESS' },
    { title: 'Dokku', value: 'DOKKU' },
  ]

  const categoryOptions = [
    { title: 'Sistema', value: 'SYSTEM' },
    { title: 'Criação', value: 'CREATE' },
    { title: 'Deploy', value: 'DEPLOY' },
    { title: 'Config', value: 'CONFIG' },
    { title: 'Git', value: 'GIT' },
    { title: 'Database', value: 'DATABASE' },
    { title: 'Domínio', value: 'DOMAIN' },
    { title: 'SSL', value: 'SSL' },
  ]

  const filteredLogs = computed(() => {
    let filtered = props.logs

    if (selectedLevel.value) {
      filtered = filtered.filter(log => log.level === selectedLevel.value)
    }

    if (selectedCategory.value) {
      filtered = filtered.filter(
        log => log.category === selectedCategory.value,
      )
    }

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(query),
      )
    }

    return filtered
  })

  function getLevelColor (level: string) {
    const colors: Record<string, string> = {
      DEBUG: 'grey',
      INFO: 'info',
      WARNING: 'warning',
      ERROR: 'error',
      SUCCESS: 'success',
      DOKKU: 'purple',
    }
    return colors[level] || 'grey'
  }

  function formatTimestamp (timestamp?: string) {
    if (!timestamp) {
      return ''
    }
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  function formatLogMessage (message: string): string[] {
    // Remove caracteres de controle ANSI como [1G
    const cleaned = message.replace(/\[1G/g, '')

    // Quebra pelos marcadores do Dokku (-----> e =====>)
    // Mantém o marcador junto com a linha
    const lines = cleaned
      .split(/(----->|=====>)/)
      .reduce((acc: string[], part, index, arr) => {
        const trimmed = part.trim()
        if (!trimmed) return acc

        // Se é um marcador, junta com a próxima parte
        if (trimmed === '----->' || trimmed === '=====>') {
          const nextPart = arr[index + 1]?.trim() || ''
          if (nextPart) {
            acc.push(`${trimmed} ${nextPart}`)
          }
        } else if (
          index === 0
          || (arr[index - 1] !== '----->' && arr[index - 1] !== '=====>')
        ) {
          // Se não é precedido por um marcador, adiciona como linha separada
          acc.push(trimmed)
        }
        return acc
      }, [])

    // Se não conseguiu quebrar, retorna como uma única linha
    return lines.length > 0 ? lines : [message]
  }

  function scrollToBottom () {
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight
    }
  }

  function clearLogs () {
  // Emitir evento para o pai limpar os logs
  }

  function applyFilters () {
  // Filtros são reativos via computed
  }

  function handleLoadMore ({
    done,
  }: {
    done: (status: 'ok' | 'empty' | 'error') => void
  }) {
    if (!props.hasMore) {
      done('empty')
      return
    }

    emit('load-more')

    // O componente pai vai atualizar hasMore quando não houver mais dados
    // Usamos um pequeno delay para permitir que a prop seja atualizada
    setTimeout(() => {
      done(props.hasMore ? 'ok' : 'empty')
    }, 500)
  }

  function getLastLogId (): number | undefined {
    if (props.logs.length === 0) {
      return undefined
    }
    const lastIndex = props.logs.length - 1
    return props.logs[lastIndex]?.id
  }

  function startStream () {
    if (!props.taskId) {
      return
    }
    streaming.value = true
    emit('stream-logs', props.taskId, getLastLogId())

    // Polling a cada 2 segundos
    streamInterval.value = window.setInterval(() => {
      emit('stream-logs', props.taskId!, getLastLogId())
    }, 2000)
  }

  function stopStream () {
    streaming.value = false
    if (streamInterval.value) {
      clearInterval(streamInterval.value)
      streamInterval.value = null
    }
    emit('stop-stream')
  }

  // Auto scroll quando novos logs chegam
  watch(
    () => props.logs.length,
    () => {
      if (props.autoScroll) {
        nextTick(scrollToBottom)
      }
    },
  )

  onBeforeUnmount(() => {
    stopStream()
  })
</script>

<style scoped lang="scss">
.log-viewer {
  &--dark {
    .logs-container {
      background-color: #1e1e1e;
      color: #d4d4d4;
    }
  }
}

.logs-container {
  font-family: "Fira Code", "Consolas", monospace;
  font-size: 12px;
  line-height: 1.6;
  max-height: 500px;
  min-height: 200px;
  overflow-y: auto;
  padding: 12px;
}

.log-entry {
  border-left: 3px solid transparent;
  margin-bottom: 4px;
  padding: 4px 8px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgb(255 255 255 / 5%);
  }

  &--debug {
    border-left-color: #6b7280;
  }

  &--info {
    border-left-color: #3b82f6;
  }

  &--warning {
    border-left-color: #f59e0b;
  }

  &--error {
    border-left-color: #ef4444;
  }

  &--success {
    border-left-color: #10b981;
  }

  &--dokku {
    border-left-color: #8b5cf6;
  }
}

.log-timestamp {
  color: #6b7280;
}

.log-message {
  display: inline-block;
  word-break: break-word;
  width: 100%;
  margin-top: 4px;
}

.log-line-arrow {
  color: #10b981;
  font-weight: 600;
  margin-top: 8px;

  &:first-child {
    margin-top: 0;
  }
}
</style>
