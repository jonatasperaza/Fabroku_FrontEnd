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
        <v-btn
          v-if="!streaming && taskId"
          density="compact"
          icon
          size="x-small"
          variant="text"
          @click="startStream"
        >
          <v-icon color="grey-lighten-1" size="16">mdi-play</v-icon>
          <v-tooltip activator="parent" location="top"
            >Acompanhar ao vivo</v-tooltip
          >
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

    <!-- Terminal body -->
    <div ref="terminalBody" class="log-terminal__body">
      <div
        v-if="displayLines.length === 0 && !loading"
        class="log-terminal__empty"
      >
        Nenhum log disponível
      </div>

      <div
        v-for="(line, idx) in displayLines"
        :key="idx"
        class="log-line"
        :class="line.cls"
      >
        <span v-if="line.time" class="log-line__time">{{ line.time }}</span>
        <span
          v-if="line.prefix"
          class="log-line__prefix"
          :class="line.prefixCls"
          >{{ line.prefix }}</span
        >
        <span class="log-line__text">{{ line.text }}</span>
      </div>

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
import type { AppLog } from "@/interfaces";
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

interface Props {
  logs: AppLog[];
  loading?: boolean;
  title?: string;
  taskId?: string;
  autoScroll?: boolean;
}

interface DisplayLine {
  time: string;
  prefix: string;
  prefixCls: string;
  text: string;
  cls: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  title: "Deploy Logs",
  autoScroll: true,
});

const emit = defineEmits<{
  "stream-logs": [taskId: string, afterId?: number];
  "stop-stream": [];
}>();

const terminalBody = ref<HTMLElement | null>(null);
const streaming = ref(false);
const streamInterval = ref<number | null>(null);
const expanded = ref(false);

/**
 * Transforma os logs brutos em linhas de terminal limpas.
 * Filtra ruído e mantém só o que importa.
 */
const displayLines = computed<DisplayLine[]>(() => {
  const lines: DisplayLine[] = [];

  for (const log of props.logs) {
    // Pula logs DEBUG — são muito verbosos
    if (log.level === "DEBUG") continue;

    const time = formatTime(log.created_at);
    const message = cleanMessage(log.message);

    if (!message.trim()) continue;

    // Logs DOKKU: quebra em múltiplas linhas (output do build)
    if (log.level === "DOKKU") {
      const sublines = message
        .split(/\n|(?=----->)|(?======>)/)
        .filter(Boolean);
      for (const sub of sublines) {
        const trimmed = sub.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith("----->") || trimmed.startsWith("=====>")) {
          lines.push({
            time: "",
            prefix: "▸",
            prefixCls: "log-line__prefix--step",
            text: trimmed.replace(/^[-=]+>\s*/, ""),
            cls: "log-line--step",
          });
        } else {
          lines.push({
            time: "",
            prefix: "",
            prefixCls: "",
            text: trimmed,
            cls: "log-line--dokku",
          });
        }
      }
      continue;
    }

    // Outros logs: uma linha com prefixo de nível
    const { prefix, prefixCls, cls } = getLevelStyle(log.level);

    lines.push({
      time,
      prefix,
      prefixCls,
      text: message,
      cls,
    });
  }

  return lines;
});

function getLevelStyle(level: string) {
  switch (level) {
    case "ERROR": {
      return {
        prefix: "✗",
        prefixCls: "log-line__prefix--error",
        cls: "log-line--error",
      };
    }
    case "WARNING": {
      return {
        prefix: "⚠",
        prefixCls: "log-line__prefix--warn",
        cls: "log-line--warn",
      };
    }
    case "SUCCESS": {
      return {
        prefix: "✓",
        prefixCls: "log-line__prefix--success",
        cls: "log-line--success",
      };
    }
    case "INFO":
    default: {
      return { prefix: "○", prefixCls: "log-line__prefix--info", cls: "" };
    }
  }
}

function formatTime(timestamp?: string): string {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function cleanMessage(msg: string): string {
  return msg
    .replace(/\[1G/g, "") // ANSI control chars
    .replace(/\u001B\[[0-9;]*m/g, "") // ANSI color codes
    .trim();
}

function scrollToBottom() {
  if (terminalBody.value) {
    terminalBody.value.scrollTop = terminalBody.value.scrollHeight;
  }
}

function getLastLogId(): number | undefined {
  const arr = props.logs;
  return arr.length > 0 ? arr[arr.length - 1]?.id : undefined;
}

function startStream() {
  if (!props.taskId) return;
  streaming.value = true;
  emit("stream-logs", props.taskId, getLastLogId());
  streamInterval.value = window.setInterval(() => {
    emit("stream-logs", props.taskId!, getLastLogId());
  }, 2000);
}

function stopStream() {
  streaming.value = false;
  if (streamInterval.value) {
    clearInterval(streamInterval.value);
    streamInterval.value = null;
  }
  emit("stop-stream");
}

watch(
  () => props.logs.length,
  () => {
    if (props.autoScroll) nextTick(scrollToBottom);
  },
);

onBeforeUnmount(() => stopStream());
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
