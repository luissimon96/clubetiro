// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  // Tailwind CSS Module
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  
  // TypeScript Configuration
  typescript: {
    strict: false,
    typeCheck: false
  }
})
