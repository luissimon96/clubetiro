<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-lg">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <NuxtLink to="/" class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <span class="text-xl font-bold text-gray-900">Clube de Tiro</span>
            </NuxtLink>
          </div>
          
          <div class="flex items-center space-x-4">
            <NuxtLink
              to="/users"
              :class="linkClass('/users')"
            >
              Usuários
            </NuxtLink>
            <NuxtLink
              to="/eventos"
              :class="linkClass('/eventos')"
            >
              Eventos
            </NuxtLink>
            <NuxtLink
              to="/resultados"
              :class="linkClass('/resultados')"
            >
              Resultados
            </NuxtLink>
            <NuxtLink
              to="/mensalidades"
              :class="linkClass('/mensalidades')"
            >
              Mensalidades
            </NuxtLink>
          </div>
        </div>
      </div>
    </nav>
    
    <main class="max-w-7xl mx-auto py-6 px-4">
      <slot />
    </main>
    
    <footer class="bg-white border-t mt-12">
      <div class="max-w-7xl mx-auto py-4 px-4">
        <p class="text-center text-gray-600 text-sm">
          © 2025 Clube de Tiro - Sistema de Gerenciamento
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

function linkClass(path: string): string {
  const isActive = route.path === path
  return [
    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
    isActive 
      ? 'bg-blue-100 text-blue-700' 
      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
  ].join(' ')
}
</script>