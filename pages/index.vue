<template>
  <div class="space-y-8">
    <!-- Header Section -->
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        Sistema de Gerenciamento
      </h1>
      <p class="text-xl text-gray-600">
        Clube de Tiro - Controle completo de eventos, participantes e resultados
      </p>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <NuxtLink
        to="/users"
        class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Usuários</p>
            <p class="text-3xl font-bold text-gray-900">{{ stats.users || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
            </svg>
          </div>
        </div>
      </NuxtLink>

      <NuxtLink
        to="/eventos"
        class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Eventos</p>
            <p class="text-3xl font-bold text-gray-900">{{ stats.eventos || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
            </svg>
          </div>
        </div>
      </NuxtLink>

      <NuxtLink
        to="/participantes"
        class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Participantes</p>
            <p class="text-3xl font-bold text-gray-900">{{ stats.participantes || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
            </svg>
          </div>
        </div>
      </NuxtLink>

      <NuxtLink
        to="/resultados"
        class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Resultados</p>
            <p class="text-3xl font-bold text-gray-900">{{ stats.resultados || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"/>
              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"/>
            </svg>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-semibold text-gray-900 mb-6">Ações Rápidas</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <NuxtLink
          to="/eventos"
          class="block p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900">Criar Evento</h3>
              <p class="text-sm text-gray-600">Organize um novo evento de tiro</p>
            </div>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/participantes"
          class="block p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900">Adicionar Participante</h3>
              <p class="text-sm text-gray-600">Cadastre novos participantes</p>
            </div>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/resultados"
          class="block p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900">Registrar Resultado</h3>
              <p class="text-sm text-gray-600">Insira resultados de competições</p>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-semibold text-gray-900 mb-6">Atividade Recente</h2>
      <div v-if="loading" class="flex justify-center py-8">
        <svg class="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
      </div>
      <div v-else-if="recentActivity.length === 0" class="text-center py-8 text-gray-500">
        <p>Nenhuma atividade recente encontrada</p>
      </div>
      <div v-else class="space-y-4">
        <div
          v-for="activity in recentActivity"
          :key="activity.id"
          class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
        >
          <div>
            <p class="font-medium text-gray-900">{{ activity.title }}</p>
            <p class="text-sm text-gray-600">{{ activity.description }}</p>
          </div>
          <span class="text-sm text-gray-500">{{ activity.timestamp }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Set page meta
definePageMeta({
  title: 'Dashboard - Clube de Tiro'
})

// Reactive data
const loading = ref(true)
const stats = reactive({
  users: 0,
  eventos: 0,
  participantes: 0,
  resultados: 0
})

const recentActivity = ref<Array<{
  id: string
  title: string
  description: string
  timestamp: string
}>>([])

// Load dashboard data
async function loadDashboardData() {
  try {
    // Load stats
    const [usersRes, eventosRes, participantesRes, resultadosRes] = await Promise.all([
      $fetch('/api/users'),
      $fetch('/api/eventos'),
      $fetch('/api/participantes'),
      $fetch('/api/resultados')
    ])

    stats.users = Array.isArray(usersRes) ? usersRes.length : 0
    stats.eventos = Array.isArray(eventosRes) ? eventosRes.length : 0
    stats.participantes = Array.isArray(participantesRes) ? participantesRes.length : 0
    stats.resultados = Array.isArray(resultadosRes) ? resultadosRes.length : 0

    // Simulate recent activity
    recentActivity.value = [
      {
        id: '1',
        title: 'Novo evento criado',
        description: Array.isArray(eventosRes) && eventosRes[0]?.nome || 'Competição de Precisão',
        timestamp: '2 horas atrás'
      },
      {
        id: '2',
        title: 'Participante cadastrado',
        description: Array.isArray(participantesRes) && participantesRes[0]?.nome || 'João Silva',
        timestamp: '3 horas atrás'
      }
    ]
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  } finally {
    loading.value = false
  }
}

// Load data on mount
onMounted(loadDashboardData)
</script>
