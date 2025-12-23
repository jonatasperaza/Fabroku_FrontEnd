<script setup lang="ts">
  import type { FunctionalComponent } from 'vue'
  import IconCloud from 'vue-icon-cloud'

  defineProps<{
    icons: FunctionalComponent[]
  }>()

</script>

<template>
  <IconCloud :icon-style="{ 'font-size': '20px' }" :icons="icons" />
</template>

<style scoped>

</style>
