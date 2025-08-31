// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15', 
  devtools: { enabled: process.env.NODE_ENV === 'development' },
  
  // Disable experimental features causing native binding issues
  experimental: {
    watcher: 'chokidar'
  },
  
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
    
    // JWT Configuration (used by server/utils/auth.ts)
    jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-key-change-in-production-min-64-chars',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-jwt-refresh-secret-key-change-in-production-min-64-chars',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    
    // Public keys (exposed to client-side)
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api'
    }
  },

  // Server Configuration with Security Headers via Nitro
  nitro: {
    preset: process.env.NITRO_PRESET || 'node-server',
    
    // Production optimizations
    minify: process.env.NODE_ENV === 'production',
    
    // Compression
    compressPublicAssets: process.env.NODE_ENV === 'production',
    
    // Security Headers and Route Rules
    routeRules: {
      '/api/health': { 
        headers: { 'Cache-Control': 'no-cache' },
        prerender: false
      },
      
      // Security headers for production
      ...(process.env.NODE_ENV === 'production' && {
        '/**': {
          headers: {
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
            'Content-Security-Policy': [
              "default-src 'self'",
              "base-uri 'self'",
              "font-src 'self' https: data:",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "img-src 'self' data: https:",
              "object-src 'none'",
              "script-src 'self'",
              "script-src-attr 'none'",
              "style-src 'self' https: 'unsafe-inline'",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        }
      })
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