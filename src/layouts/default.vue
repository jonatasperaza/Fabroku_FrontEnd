<template>
  <v-app>
    <v-navigation-drawer permanent>
      <v-list-item subtitle="Vuetify" title="My Application" />
      <v-divider />
      <v-list-item link title="Dashboard" />
      <v-list-item link title="Projects" />
      <v-list-item link title="Settings" />
      <v-list-item link title="Documentation" />
    </v-navigation-drawer>

    <v-main>
      <RouterView />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
  import { onMounted } from 'vue'
  import { useAuthStore } from '@/stores'
  const authStore = useAuthStore()

  onMounted(() => {
    authStore.checkAuth()
  })
</script>
