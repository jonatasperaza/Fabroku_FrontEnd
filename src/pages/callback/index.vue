<route lang="yaml">
meta:
  layout: false
</route>

<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores'

  const router = useRouter()
  const authStore = useAuthStore()
  const error = ref<string | null>(null)
  const loading = ref(true)

  onMounted(async () => {
    const urlParams = new URLSearchParams(window.location.search)
    const errorParam = urlParams.get('error')

    if (errorParam) {
      error.value = decodeURIComponent(errorParam)
      loading.value = false
      return
    }

    try {
      // Com cookies httpOnly, o backend já setou os cookies
      // Apenas verificamos se a autenticação funcionou
      const isAuthenticated = await authStore.checkAuth()

      if (isAuthenticated) {
        // Redireciona para o dashboard
        router.push('/dashboard')
      } else {
        error.value = 'Falha na autenticação. Tente novamente.'
        loading.value = false
      }
    } catch (error_) {
      error.value
        = error_ instanceof Error
          ? error_.message
          : 'Erro ao processar autenticação'
      loading.value = false
    }
  })
</script>

<template>
  <div class="callback-container">
    <div class="callback-card">
      <div v-if="loading" class="loading">
        <div class="spinner" />
        <h2>Processando autenticação...</h2>
        <p>Aguarde enquanto validamos suas credenciais</p>
      </div>

      <div v-else-if="error" class="error">
        <h2>Erro na autenticação</h2>
        <p>{{ error }}</p>
        <button class="retry-button" @click="router.push('/')">
          Tentar novamente
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.callback-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 2rem;
}

.callback-card {
  background: var(--color-background-soft);
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.loading,
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-heading);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

h2 {
  color: var(--color-heading);
  margin: 0;
}

p {
  color: var(--color-text);
  margin: 0;
}

.retry-button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-heading);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.3s ease;
}

.retry-button:hover {
  opacity: 0.8;
}
</style>
