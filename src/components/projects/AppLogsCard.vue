<template>
  <LogViewer
    :loading="loading"
    :logs="logs"
    :task-id="taskId"
    :title="title"
    @stop-stream="emit('stop-stream')"
    @stream-logs="(taskId, afterId) => emit('stream-logs', taskId, afterId)"
  />
</template>

<script setup lang="ts">
  import LogViewer from '@/components/logs/LogViewer.vue'

  defineProps<{
    logs: any[]
    loading?: boolean
    taskId?: string
    title?: string
  }>()

  const emit = defineEmits<{
    'stream-logs': [taskId: string, afterId?: number]
    'stop-stream': []
  }>()
</script>
