<template>
  <div class="log-terminal" :class="{ 'log-terminal--expanded': expanded }">
    <!-- Header -->
    <div class="log-terminal__header">
      <div class="d-flex align-center ga-2">
        <div class="log-terminal__dot log-terminal__dot--red" />
        <div class="log-terminal__dot log-terminal__dot--yellow" />
        <div class="log-terminal__dot log-terminal__dot--green" />
        <span class="log-terminal__title ml-2">
          {{ title || "Deploy Logs" }}
        </span>
        <v-chip
          v-if="streaming"
          color="success"
          density="compact"
          size="x-small"
          variant="flat"
        >
          <v-icon size="10" start>mdi-circle</v-icon>
          LIVE
        </v-chip>
      </div>
      <div class="d-flex align-center ga-1">
        <!-- Toggle resumo / detalhado -->
        <v-btn-toggle
          v-model="viewMode"
          class="log-terminal__toggle"
          density="compact"
          mandatory
          rounded="lg"
        >
          <v-btn size="x-small" value="summary">
            <v-icon size="14" start>mdi-text-short</v-icon>
            Resumo
          </v-btn>
          <v-btn size="x-small" value="verbose">
            <v-icon size="14" start>mdi-text-long</v-icon>
            Detalhado
          </v-btn>
        </v-btn-toggle>

        <v-btn
          v-if="!streaming && taskId"
          density="compact"
          icon
          size="x-small"
          variant="text"
          @click="startStream"
        >
          <v-icon color="grey-lighten-1" size="16">mdi-play</v-icon>
          <v-tooltip
            activator="parent"
            location="top"
          >Acompanhar ao vivo</v-tooltip>
        </v-btn>
        <v-btn
          v-if="streaming"
          density="compact"
          icon
          size="x-small"
          variant="text"
          @click="stopStream"
        >
          <v-icon color="error" size="16">mdi-stop</v-icon>
        </v-btn>
        <v-btn
          density="compact"
          icon
          size="x-small"
          variant="text"
          @click="expanded = !expanded"
        >
          <v-icon color="grey-lighten-1" size="16">
            {{ expanded ? "mdi-arrow-collapse" : "mdi-arrow-expand" }}
          </v-icon>
        </v-btn>
      </div>
    </div>

    <!-- Error banner -->
    <div v-if="errorSummary.length > 0" class="log-terminal__error-banner">
      <div class="log-terminal__error-banner-header">
        <v-icon color="error" size="16">mdi-alert-circle</v-icon>
        <span>{{ errorSummary.length === 1 ? 'Erro detectado' : `${errorSummary.length} erros detectados` }}</span>
      </div>
      <div
        v-for="(err, idx) in errorSummary"
        :key="idx"
        class="log-terminal__error-banner-line"
      >
        {{ err }}
      </div>
    </div>

    <!-- Terminal body -->
    <div ref="terminalBody" class="log-terminal__body">
      <div
        v-if="displayLines.length === 0 && !loading"
        class="log-terminal__empty"
      >
        Nenhum log disponível
      </div>

      <template v-for="(item, idx) in displayLines" :key="idx">
        <!-- Grupo colapsável de build output -->
        <div
          v-if="item.type === 'group'"
          class="log-group"
        >
          <div
            class="log-group__header"
            @click="toggleGroup(item.groupId!)"
          >
            <v-icon class="log-group__chevron" :class="{ 'log-group__chevron--open': expandedGroups.has(item.groupId!) }" size="12">
              mdi-chevron-right
            </v-icon>
            <span class="log-group__step">{{ item.text }}</span>
            <span v-if="item.childCount" class="log-group__count">{{ item.childCount }} linhas</span>
            <span v-if="item.hasErrors" class="log-group__error-badge">erro</span>
          </div>
          <div v-if="expandedGroups.has(item.groupId!)" class="log-group__body">
            <div
              v-for="(child, cidx) in item.children"
              :key="cidx"
              class="log-line"
              :class="child.cls"
            >
              <span class="log-line__text">{{ child.text }}</span>
            </div>
          </div>
        </div>

        <!-- Linha normal -->
        <div
          v-else
          class="log-line"
          :class="item.cls"
        >
          <span v-if="item.time" class="log-line__time">{{ item.time }}</span>
          <span
            v-if="item.prefix"
            class="log-line__prefix"
            :class="item.prefixCls"
          >{{ item.prefix }}</span>
          <span class="log-line__text">{{ item.text }}</span>
        </div>
      </template>

      <div v-if="loading" class="log-terminal__loading">
        <v-progress-circular
          color="grey-lighten-1"
          indeterminate
          size="16"
          width="2"
        />
        <span class="ml-2">Carregando...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { AppLog } from '@/interfaces'
  import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

  interface Props {
    logs: AppLog[]
    loading?: boolean
    title?: string
    taskId?: string
    autoScroll?: boolean
  }

  interface DisplayLine {
    type: 'line' | 'group'
    time: string
    prefix: string
    prefixCls: string
    text: string
    cls: string
    groupId?: string
    childCount?: number
    hasErrors?: boolean
    children?: DisplayLine[]
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
    title: 'Deploy Logs',
    autoScroll: true,
  })

  const emit = defineEmits<{
    'stream-logs': [taskId: string, afterId?: number]
    'stop-stream': []
  }>()

  const terminalBody = ref<HTMLElement | null>(null)
  const streaming = ref(false)
  const streamInterval = ref<number | null>(null)
  const expanded = ref(false)
  const viewMode = ref<'summary' | 'verbose'>('summary')
  const expandedGroups = ref<Set<string>>(new Set())

  const ERROR_PATTERNS = /error|failed|fatal|denied|cannot|couldn't|could not|exception|! /i

  function isErrorLine (text: string): boolean {
    return ERROR_PATTERNS.test(text)
  }

  /**
   * Extrai um resumo dos erros para o banner.
   * Coleta mensagens de logs ERROR e linhas de erro importantes do DOKKU output.
   */
  const errorSummary = computed<string[]>(() => {
    const errors: string[] = []
    for (const log of props.logs) {
      if (log.level === 'ERROR') {
        const msg = cleanMessage(log.message)
        if (msg && !errors.includes(msg)) {
          errors.push(msg)
        }
      }

      if (log.level === 'DOKKU') {
        const msg = cleanMessage(log.message)
        for (const line of msg.split('\n')) {
          const trimmed = line.trim()
          if (!trimmed) continue
          if (
            /^(ERROR:|fatal:|! )/i.test(trimmed)
            || /permission denied/i.test(trimmed)
            || /build failed/i.test(trimmed)
            || /could not read from remote/i.test(trimmed)
          ) {
            if (!errors.includes(trimmed)) {
              errors.push(trimmed)
            }
          }
        }
      }
    }
    return errors
  })

  /**
   * Transforma os logs brutos em linhas de terminal.
   * No modo "summary", agrupa output Dokku em seções colapsáveis.
   * No modo "verbose", mostra tudo expandido.
   */
  const displayLines = computed<DisplayLine[]>(() => {
    const lines: DisplayLine[] = []
    let groupIndex = 0

    for (const log of props.logs) {
      if (log.level === 'DEBUG') continue

      const time = formatTime(log.created_at)
      const message = cleanMessage(log.message)

      if (!message.trim()) continue

      if (log.level === 'DOKKU') {
        const sublines = message
          .split(/\n|(?=----->)|(?======>)/)
          .filter(Boolean)

        if (viewMode.value === 'verbose') {
          for (const sub of sublines) {
            const trimmed = sub.trim()
            if (!trimmed) continue
            const isStep = trimmed.startsWith('----->') || trimmed.startsWith('=====>')
            const isErr = isErrorLine(trimmed)

            if (isStep) {
              lines.push({
                type: 'line',
                time: '',
                prefix: '▸',
                prefixCls: 'log-line__prefix--step',
                text: trimmed.replace(/^[-=]+>\s*/, ''),
                cls: 'log-line--step',
              })
            } else {
              lines.push({
                type: 'line',
                time: '',
                prefix: isErr ? '!' : '',
                prefixCls: isErr ? 'log-line__prefix--error' : '',
                text: trimmed,
                cls: isErr ? 'log-line--error' : 'log-line--dokku',
              })
            }
          }
          continue
        }

        // Modo summary: agrupa linhas Dokku em seções colapsáveis
        let currentGroupLabel = ''
        let currentChildren: DisplayLine[] = []
        let groupHasErrors = false

        for (const sub of sublines) {
          const trimmed = sub.trim()
          if (!trimmed) continue

          const isStep = trimmed.startsWith('----->') || trimmed.startsWith('=====>')
          const isErr = isErrorLine(trimmed)

          if (isStep) {
            // Fecha grupo anterior se existir
            if (currentGroupLabel && currentChildren.length > 0) {
              const gid = `g-${groupIndex++}`
              if (groupHasErrors) expandedGroups.value.add(gid)
              lines.push({
                type: 'group',
                time: '',
                prefix: '',
                prefixCls: '',
                text: currentGroupLabel,
                cls: '',
                groupId: gid,
                childCount: currentChildren.length,
                hasErrors: groupHasErrors,
                children: currentChildren,
              })
            }
            currentGroupLabel = trimmed.replace(/^[-=]+>\s*/, '')
            currentChildren = []
            groupHasErrors = false
          } else {
            if (isErr) groupHasErrors = true

            // No modo summary, só mostra linhas de erro fora do grupo
            if (isErr) {
              currentChildren.push({
                type: 'line',
                time: '',
                prefix: '!',
                prefixCls: 'log-line__prefix--error',
                text: trimmed,
                cls: 'log-line--error',
              })
            } else {
              currentChildren.push({
                type: 'line',
                time: '',
                prefix: '',
                prefixCls: '',
                text: trimmed,
                cls: 'log-line--dokku',
              })
            }
          }
        }

        // Fecha último grupo
        if (currentGroupLabel && currentChildren.length > 0) {
          const gid = `g-${groupIndex++}`
          if (groupHasErrors) expandedGroups.value.add(gid)
          lines.push({
            type: 'group',
            time: '',
            prefix: '',
            prefixCls: '',
            text: currentGroupLabel,
            cls: '',
            groupId: gid,
            childCount: currentChildren.length,
            hasErrors: groupHasErrors,
            children: currentChildren,
          })
        } else if (currentChildren.length > 0 && !currentGroupLabel) {
          // Linhas Dokku soltas (sem step header)
          const gid = `g-${groupIndex++}`
          const hasErr = currentChildren.some(c => c.cls === 'log-line--error')
          if (hasErr) expandedGroups.value.add(gid)
          lines.push({
            type: 'group',
            time: '',
            prefix: '',
            prefixCls: '',
            text: 'Build output',
            cls: '',
            groupId: gid,
            childCount: currentChildren.length,
            hasErrors: hasErr,
            children: currentChildren,
          })
        }

        continue
      }

      // Outros logs (INFO, ERROR, WARNING, SUCCESS)
      const { prefix, prefixCls, cls } = getLevelStyle(log.level)

      lines.push({
        type: 'line',
        time,
        prefix,
        prefixCls,
        text: message,
        cls,
      })
    }

    return lines
  })

  function toggleGroup (groupId: string) {
    if (expandedGroups.value.has(groupId)) {
      expandedGroups.value.delete(groupId)
    } else {
      expandedGroups.value.add(groupId)
    }
  }

  function getLevelStyle (level: string) {
    switch (level) {
      case 'ERROR': {
        return {
          prefix: '✗',
          prefixCls: 'log-line__prefix--error',
          cls: 'log-line--error',
        }
      }
      case 'WARNING': {
        return {
          prefix: '⚠',
          prefixCls: 'log-line__prefix--warn',
          cls: 'log-line--warn',
        }
      }
      case 'SUCCESS': {
        return {
          prefix: '✓',
          prefixCls: 'log-line__prefix--success',
          cls: 'log-line--success',
        }
      }
      case 'INFO':
      default: {
        return { prefix: '○', prefixCls: 'log-line__prefix--info', cls: '' }
      }
    }
  }

  function formatTime (timestamp?: string): string {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  function cleanMessage (msg: string): string {
    return msg
      .replace(/\[1G/g, '')
      .replace(/\u001B\[[0-9;]*m/g, '')
      .trim()
  }

  function scrollToBottom () {
    if (terminalBody.value) {
      terminalBody.value.scrollTop = terminalBody.value.scrollHeight
    }
  }

  function getLastLogId (): number | undefined {
    const arr = props.logs
    return arr.length > 0 ? arr.at(-1)?.id : undefined
  }

  function startStream () {
    if (!props.taskId) return
    streaming.value = true
    emit('stream-logs', props.taskId, getLastLogId())
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

  watch(
    () => props.logs.length,
    () => {
      if (props.autoScroll) nextTick(scrollToBottom)
    },
  )

  onBeforeUnmount(() => stopStream())
</script>

<style scoped lang="scss">
.log-terminal {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: #0d1117;

  &--expanded {
    .log-terminal__body {
      max-height: 80vh;
    }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: #161b22;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  &__toggle {
    margin-right: 8px;
    background: rgba(255, 255, 255, 0.04);

    .v-btn {
      font-size: 11px !important;
      text-transform: none;
      letter-spacing: 0;
      color: #8b949e;

      &--active {
        color: #c9d1d9 !important;
        background: rgba(255, 255, 255, 0.08) !important;
      }
    }
  }

  &__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;

    &--red {
      background: #ff5f57;
    }
    &--yellow {
      background: #febc2e;
    }
    &--green {
      background: #28c840;
    }
  }

  &__title {
    font-size: 12px;
    font-weight: 500;
    color: #8b949e;
    letter-spacing: 0.02em;
  }

  &__error-banner {
    background: rgba(248, 81, 73, 0.1);
    border-bottom: 1px solid rgba(248, 81, 73, 0.25);
    padding: 10px 16px;
    font-family: "JetBrains Mono", "Fira Code", "Consolas", monospace;
    font-size: 12px;

    &-header {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #f85149;
      font-weight: 600;
      margin-bottom: 6px;
      font-size: 13px;
    }

    &-line {
      color: #f8857f;
      padding: 2px 0 2px 22px;
      word-break: break-word;
      line-height: 1.5;
    }
  }

  &__body {
    font-family: "JetBrains Mono", "Fira Code", "Consolas", monospace;
    font-size: 12px;
    line-height: 1.7;
    color: #c9d1d9;
    padding: 12px 16px;
    max-height: 400px;
    min-height: 120px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #30363d transparent;

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background: #30363d;
      border-radius: 3px;
    }
  }

  &__empty {
    color: #484f58;
    text-align: center;
    padding: 32px 0;
    font-size: 13px;
  }

  &__loading {
    display: flex;
    align-items: center;
    color: #484f58;
    padding: 8px 0;
    font-size: 12px;
  }
}

.log-group {
  margin: 2px 0;

  &__header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
    cursor: pointer;
    user-select: none;
    color: #58a6ff;
    font-weight: 600;

    &:hover {
      color: #79c0ff;
    }
  }

  &__chevron {
    color: #484f58;
    transition: transform 0.15s;

    &--open {
      transform: rotate(90deg);
    }
  }

  &__step {
    font-size: 12px;
  }

  &__count {
    color: #484f58;
    font-weight: 400;
    font-size: 11px;
    margin-left: auto;
  }

  &__error-badge {
    background: rgba(248, 81, 73, 0.15);
    color: #f85149;
    font-size: 10px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  &__body {
    padding-left: 18px;
    border-left: 1px solid rgba(255, 255, 255, 0.06);
    margin-left: 5px;
    margin-bottom: 4px;
  }
}

.log-line {
  padding: 1px 0;
  display: flex;
  align-items: flex-start;
  gap: 8px;

  &__time {
    color: #484f58;
    font-size: 11px;
    min-width: 60px;
    flex-shrink: 0;
  }

  &__prefix {
    flex-shrink: 0;
    font-weight: 600;
    width: 14px;
    text-align: center;

    &--info {
      color: #58a6ff;
    }
    &--success {
      color: #3fb950;
    }
    &--error {
      color: #f85149;
    }
    &--warn {
      color: #d29922;
    }
    &--step {
      color: #3fb950;
      font-size: 10px;
    }
  }

  &__text {
    word-break: break-word;
  }

  &--error {
    color: #f85149;
  }

  &--warn {
    color: #d29922;
  }

  &--success {
    color: #3fb950;
  }

  &--step {
    color: #58a6ff;
    font-weight: 600;
    margin-top: 4px;
  }

  &--dokku {
    color: #8b949e;
    padding-left: 22px;
  }
}
</style>
