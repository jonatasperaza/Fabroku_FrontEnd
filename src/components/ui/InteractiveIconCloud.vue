<script setup lang="ts">
  import IconCloud from 'vue-icon-cloud'

  defineProps<{
    icons: string[]
  }>()

</script>

<template>
  <IconCloud :icon-style="{ 'font-size': '20px' }" :icons="icons" />
</template>

<style scoped>

</style>
