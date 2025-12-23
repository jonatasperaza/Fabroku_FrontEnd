/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'dark',
    themes: {
      light: {
        dark: false,
        colors: {
          'primary': '#1313ec',
          'primary-hover': '#0f0fb8',
          'background': '#f6f6f8',
          'surface': '#ffffff',
          'text-muted': '#9d9db9',
          'text-primary': '#000000',
        },
      },
      dark: {
        dark: true,
        colors: {
          'primary': '#542ab4ff',
          'primary-hover': '#0f0fb8',
          'surface': '#1a1a2e',
          'text-muted': '#9d9db9',
          'text-primary': '#ffffff',
        },
      },
    },
  },
})
