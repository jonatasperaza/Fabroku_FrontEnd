/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

import { setupLayouts } from 'virtual:generated-layouts'
// Composables
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
// import { useAuthStore } from '@/stores'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(routes),
})

// ============================================
// AUTH GUARD - Descomente para ativar proteção de rotas
// ============================================
// Rotas que NÃO precisam de autenticação
// const publicRoutes = ['/', '/login', '/callback']

// router.beforeEach(async (to, _from, next) => {
//   const authStore = useAuthStore()

//   // Se é rota pública, permite acesso
//   if (publicRoutes.includes(to.path)) {
//     return next()
//   }

//   // Verifica autenticação se ainda não verificou
//   if (!authStore.isAuthenticated) {
//     await authStore.checkAuth()
//   }

//   // Se não está autenticado, redireciona para login
//   if (!authStore.isAuthenticated) {
//     return next('/')
//   }

//   // Está autenticado, permite acesso
//   next()
// })
// ============================================

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (localStorage.getItem('vuetify:dynamic-reload')) {
      console.error('Dynamic import error, reloading page did not fix it', err)
    } else {
      console.log('Reloading page to fix dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

export default router
