<template>
  <v-container>
    <v-btn
      class="mb-4"
      prepend-icon="mdi-arrow-left"
      variant="text"
      @click="$router.push('/projects')"
    >
      Voltar para Projetos
    </v-btn>

    <h1 class="text-h4 mb-4">Projeto: {{ projectId }}</h1>

    <v-card class="mb-6">
      <v-card-title>Detalhes do Projeto</v-card-title>
      <v-card-text>
        <!-- Aqui você carrega os dados do projeto -->
        <p>ID do projeto: {{ projectId }}</p>
      </v-card-text>
    </v-card>

    <h2 class="text-h5 mb-4">Apps deste Projeto</h2>

    <v-row>
      <!-- Lista de apps do projeto -->
      <v-col v-for="app in apps" :key="app.id" cols="12" md="4">
        <v-card
          class="cursor-pointer"
          hover
          @click="$router.push(`/projects/${projectId}/${app.id}`)"
        >
          <v-card-title>{{ app.name }}</v-card-title>
          <v-card-subtitle>{{ app.description }}</v-card-subtitle>
          <v-card-actions>
            <v-btn
              color="primary"
              :to="`/projects/${projectId}/${app.id}`"
              variant="text"
            >
              Abrir App
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useRoute } from 'vue-router'

  const route = useRoute()
  const projectId = route.params.projectId as string

  // TODO: Buscar apps do backend
  const apps = ref([
    { id: 'app-1', name: 'App Frontend', description: 'React App' },
    { id: 'app-2', name: 'App Backend', description: 'Node.js API' },
    { id: 'app-3', name: 'App Mobile', description: 'React Native' },
  ])
</script>
