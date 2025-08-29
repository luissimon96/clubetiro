<template>
  <div class="club-dashboard">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Dashboard do Clube</h1>
            <p class="text-sm text-gray-600">{{ clubeInfo.nome || 'Carregando...' }}</p>
          </div>
          <div class="flex space-x-4">
            <button
              @click="refreshData"
              class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Atualizar
            </button>
            <button
              @click="logout"
              class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Main Content -->
    <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-1">
              <h3 class="text-sm font-medium text-gray-500">Membros Ativos</h3>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.members || 0 }}</p>
            </div>
            <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4.5 4.5 0 11-3.5 5.972"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-1">
              <h3 class="text-sm font-medium text-gray-500">Eventos Ativos</h3>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.events || 0 }}</p>
            </div>
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-1">
              <h3 class="text-sm font-medium text-gray-500">Participações</h3>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.participations || 0 }}</p>
            </div>
            <div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-1">
              <h3 class="text-sm font-medium text-gray-500">Status da Licença</h3>
              <span 
                :class="getLicenseStatusClass(clubeInfo.licenca?.status)"
                class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
              >
                {{ clubeInfo.licenca?.status || 'N/A' }}
              </span>
            </div>
            <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Actions Card -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h3>
          <div class="space-y-4">
            <NuxtLink
              v-if="hasPermission('gerenciarEventos')"
              to="/club/eventos/create"
              class="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              + Criar Novo Evento
            </NuxtLink>
            <NuxtLink
              v-if="hasPermission('gerenciarMembros')"
              to="/club/membros/create"
              class="block w-full bg-green-600 text-white text-center py-3 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              + Cadastrar Membro
            </NuxtLink>
            <NuxtLink
              to="/club/eventos"
              class="block w-full bg-gray-600 text-white text-center py-3 px-4 rounded-md hover:bg-gray-700 transition-colors"
            >
              Ver Todos os Eventos
            </NuxtLink>
            <NuxtLink
              to="/club/membros"
              class="block w-full bg-gray-600 text-white text-center py-3 px-4 rounded-md hover:bg-gray-700 transition-colors"
            >
              Gerenciar Membros
            </NuxtLink>
          </div>
        </div>

        <!-- Club Info Card -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Informações do Clube</h3>
          <div class="space-y-3">
            <div>
              <span class="text-sm font-medium text-gray-500">Nome:</span>
              <p class="text-sm text-gray-900">{{ clubeInfo.nome }}</p>
            </div>
            <div>
              <span class="text-sm font-medium text-gray-500">CNPJ:</span>
              <p class="text-sm text-gray-900">{{ clubeInfo.cnpj }}</p>
            </div>
            <div>
              <span class="text-sm font-medium text-gray-500">CR:</span>
              <p class="text-sm text-gray-900">{{ clubeInfo.cr }}</p>
            </div>
            <div v-if="clubeInfo.endereco">
              <span class="text-sm font-medium text-gray-500">Localização:</span>
              <p class="text-sm text-gray-900">
                {{ clubeInfo.endereco.cidade }}/{{ clubeInfo.endereco.estado }}
              </p>
            </div>
            <div v-if="clubeInfo.contato">
              <span class="text-sm font-medium text-gray-500">Contato:</span>
              <p class="text-sm text-gray-900">{{ clubeInfo.contato.responsavel }}</p>
              <p class="text-sm text-gray-500">{{ clubeInfo.contato.telefone }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Atividades Recentes</h3>
        </div>
        <div class="p-6">
          <div v-if="recentEvents.length === 0" class="text-center text-gray-500 py-4">
            Nenhuma atividade recente
          </div>
          <div v-else class="space-y-4">
            <div 
              v-for="event in recentEvents" 
              :key="event.id"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div>
                <h4 class="font-medium text-gray-900">{{ event.nome }}</h4>
                <p class="text-sm text-gray-600">{{ formatDate(event.data) }} - {{ event.local }}</p>
              </div>
              <div class="text-right">
                <span 
                  :class="getEventStatusClass(event.status)"
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                >
                  {{ event.status }}
                </span>
                <p class="text-xs text-gray-500 mt-1">{{ event.totalParticipantes || 0 }} participantes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'club-access'
})

// State
const loading = ref(true)
const user = useState('auth.user')
const clubeInfo = ref({})
const stats = ref({})
const recentEvents = ref([])

// Methods
const refreshData = async () => {
  loading.value = true
  try {
    // Load club info if not already loaded
    if (!clubeInfo.value.id) {
      const clubeResponse = await $fetch(`/api/system/clubes/${user.value.clubeId}`)
      clubeInfo.value = clubeResponse.data
    }

    // Load events for stats
    const eventsResponse = await $fetch('/api/eventos')
    recentEvents.value = eventsResponse.data?.slice(0, 5) || []
    
    // Load users for stats
    const usersResponse = await $fetch('/api/users')
    
    stats.value = {
      members: usersResponse.length || 0,
      events: eventsResponse.total || 0,
      participations: recentEvents.value.reduce((acc, event) => acc + (event.totalParticipantes || 0), 0)
    }
    
  } catch (error) {
    console.error('Erro ao carregar dados:', error)
  } finally {
    loading.value = false
  }
}

const hasPermission = (permission) => {
  return user.value.userType === 'system_admin' || 
         (user.value.permissoes && user.value.permissoes[permission])
}

const getLicenseStatusClass = (status) => {
  switch (status) {
    case 'ativa': return 'bg-green-100 text-green-800'
    case 'suspensa': return 'bg-yellow-100 text-yellow-800'
    case 'cancelada': return 'bg-red-100 text-red-800'
    case 'pendente': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getEventStatusClass = (status) => {
  switch (status) {
    case 'planejado': return 'bg-blue-100 text-blue-800'
    case 'inscricoes_abertas': return 'bg-green-100 text-green-800'
    case 'em_andamento': return 'bg-yellow-100 text-yellow-800'
    case 'finalizado': return 'bg-gray-100 text-gray-800'
    case 'cancelado': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

const logout = async () => {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await navigateTo('/login')
  } catch (error) {
    console.error('Erro ao fazer logout:', error)
    // Even if logout fails, redirect to login
    await navigateTo('/login')
  }
}

// Load data on mount
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.club-dashboard {
  min-height: 100vh;
  background-color: #f9fafb;
}
</style>