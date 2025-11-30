<template>
  <v-app>
    <v-navigation-drawer permanent>
      <v-sheet class="d-flex align-center pr-5" elevation="0">
        <v-card
          class="d-flex align-center px-4 py-2 mt-3"
          elevation="0"
          rounded="lg"
        >
          <v-avatar
            :image="authStore.user?.avatar_url"
            :name="authStore.user?.name"
          />
          <div class="ml-2">
            <div class="text-subtitle-2 font-weight-medium text-capitalize">
              {{ authStore.user?.name || "Usuário" }}
            </div>
          </div>
        </v-card>
      </v-sheet>
      <v-list class="d-flex flex-column align-center px-2">
        <v-list-item
          class="menu-item"
          link
          prepend-icon="mdi-view-dashboard"
          rounded="lg"
          title="Dashboard"
          to="/dashboard"
        />
        <v-list-item
          class="menu-item"
          link
          prepend-icon="mdi-folder"
          rounded="lg"
          title="Projetos"
          to="/projects"
        />
        <v-list-item
          class="menu-item"
          link
          prepend-icon="mdi-cog-outline"
          rounded="lg"
          title="Configurações"
          to="/settings"
        />
        <v-list-item
          class="menu-item"
          link
          prepend-icon="mdi-book-open-variant-outline"
          rounded="lg"
          title="Documentação"
          to="/documentation"
        />
      </v-list>
    </v-navigation-drawer>

    <v-main class="mt-4 mx-4">
      <RouterView />
    </v-main>
    <p class="text-background">Peraza esteve aqui (;</p>
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

<style scoped>
.menu-item {
  width: 100%;
  margin-bottom: 12px;
  height: 10px;
}

/* Reduz a margem do ícone */
.menu-item :deep(.v-list-item__spacer) {
  width: 16px !important;
}
</style>
