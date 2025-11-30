<template>
  <v-container>
    <v-btn
      class="mb-4"
      prepend-icon="mdi-arrow-left"
      variant="text"
      @click="$router.push(`/projects/${projectId}`)"
    >
      Voltar para Projeto
    </v-btn>

    <h1 class="text-h4 mb-4">App: {{ appId }}</h1>

    <v-card>
      <v-card-title>Detalhes do App</v-card-title>
      <v-card-text>
        <p><strong>Projeto:</strong> {{ projectId }}</p>
        <p><strong>App ID:</strong> {{ appId }}</p>

        <!-- Aqui você carrega os dados do app -->
      </v-card-text>

      <v-card-actions>
        <v-btn color="primary" prepend-icon="mdi-play"> Deploy </v-btn>
        <v-btn prepend-icon="mdi-cog" variant="outlined"> Configurações </v-btn>
        <v-btn prepend-icon="mdi-file-document" variant="outlined">
          Logs
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
  import { useRoute } from 'vue-router'

  const route = useRoute()
  const projectId = route.params.projectId as string
  const appId = route.params.appId as string
</script>
