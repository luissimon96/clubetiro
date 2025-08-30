// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV === 'development' },
  
  // Tailwind CSS Module
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  
  // Component auto-import configuration
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    }
  ],
  
  // TypeScript Configuration
  typescript: {
    strict: true,
    typeCheck: true
  },

  // Runtime Configuration
  runtimeConfig: {
    // Private keys (only available on server-side)
    secretKey: process.env.NUXT_SECRET_KEY || 'dev-secret-key',
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    
    // JWT Configuration
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    
    // Public keys (exposed to client-side)
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api'
    }
  },

  // Server Configuration
  nitro: {
    preset: process.env.NITRO_PRESET || 'node-server',
    
    // Production optimizations
    minify: process.env.NODE_ENV === 'production',
    
    // Compression
    compressPublicAssets: process.env.NODE_ENV === 'production',
    
    // Health check endpoint
    routeRules: {
      '/api/health': { 
        headers: { 'Cache-Control': 'no-cache' },
        prerender: false
      }
    }
  },

  // Vite Configuration to handle Node.js modules
  vite: {
    define: {
      global: 'globalThis'
    },
    optimizeDeps: {
      exclude: ['jsonwebtoken', 'bcryptjs']
    },
    ssr: {
      noExternal: ['jsonwebtoken', 'bcryptjs']
    }
  },

  // Security Configuration
  security: {
    headers: process.env.NODE_ENV === 'production' ? {
      contentSecurityPolicy: {
        'base-uri': ["'self'"],
        'font-src': ["'self'", 'https:', 'data:'],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'object-src': ["'none'"],
        'script-src-attr': ["'none'"],
        'style-src': ["'self'", 'https:', "'unsafe-inline'"],
        'upgrade-insecure-requests': true
      },
      crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production' ? 'require-corp' : false,
    } : false
  },

  // CSS Configuration
  css: ['~/assets/css/main.css'],

  // App Configuration
  app: {
    head: {
      title: 'Clube de Tiro - Sistema de Gestão',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Sistema de gestão para clubes de tiro' }
      ]
    }
  },

  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    experimental: {
      payloadExtraction: false
    },
    
    // Render mode
    ssr: true,
    
    // Build optimizations
    build: {
      extractCSS: true,
      optimizeCSS: true,
      splitChunks: {
        layouts: true,
        pages: true,
        commons: true
      }
    }
  })
})
