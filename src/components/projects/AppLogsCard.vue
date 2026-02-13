<template>
  <LogViewer
    :loading="loading"
    :logs="logs"
    :task-id="taskId"
    :title="title"
    @stream-logs="(taskId, afterId) => emit('stream-logs', taskId, afterId)"
    @stop-stream="emit('stop-stream')"
  />
</template>

<script setup lang="ts">
import LogViewer from "@/components/logs/LogViewer.vue";

defineProps<{
  logs: any[];
  loading?: boolean;
  taskId?: string;
  title?: string;
}>();

const emit = defineEmits<{
  "stream-logs": [taskId: string, afterId?: number];
  "stop-stream": [];
}>();
</script>
