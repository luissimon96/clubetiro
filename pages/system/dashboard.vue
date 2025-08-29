<template>
  <div class="system-admin-dashboard">
    <!-- Header -->
    <div class="header-section bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Dashboard do Sistema</h1>
            <p class="text-sm text-gray-600">Visão geral completa do sistema de clubes</p>
          </div>
          <div class="flex space-x-4">
            <button
              @click="refreshData"
              class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Atualizar Dados
            </button>
            <NuxtLink
              to="/system/clubes"
              class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Gerenciar Clubes
            </NuxtLink>
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
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Clubes Stats -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-1">
              <h3 class="text-sm font-medium text-gray-500">Clubes Ativos</h3>
              <div class="mt-2 flex items-baseline">
                <p class="text-2xl font-semibold text-gray-900">{{ stats.clubes?.ativos || 0 }}</p>
                <p class="text-sm text-gray-600 ml-2">de {{ stats.clubes?.total || 0 }}</p>
              </div>
            </div>
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
          </div>
        </div>

        <!-- Users Stats -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-1">
              <h3 class="text-sm font-medium text-gray-500">Usuários Totais</h3>
              <div class="mt-2 flex items-baseline">
                <p class="text-2xl font-semibold text-gray-900">{{ stats.usuarios?.total || 0 }}</p>
                <p class="text-sm text-green-600 ml-2">+{{ stats.usuarios?.clubAdmins || 0 }} admins</p>
              </div>
            </div>
            <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4.5 4.5 0 11-3.5 5.972"></path>
              </svg>
            </div>
          </div>
        </div>

        <!-- Events Stats -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-1">
              <h3 class="text-sm font-medium text-gray-500">Eventos Totais</h3>
              <div class="mt-2 flex items-baseline">
                <p class="text-2xl font-semibold text-gray-900">{{ stats.eventos?.total || 0 }}</p>
                <p class="text-sm text-blue-600 ml-2">{{ stats.eventos?.ultimos30Dias || 0 }} últimos 30d</p>
              </div>
            </div>
            <div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
          </div>
        </div>

        <!-- Revenue Stats -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-1">
              <h3 class="text-sm font-medium text-gray-500">Receita Mensal</h3>
              <div class="mt-2 flex items-baseline">
                <p class="text-2xl font-semibold text-gray-900">R$ {{ formatCurrency(stats.financeiro?.receitaMensalTotal || 0) }}</p>
                <p class="text-sm text-red-600 ml-2" v-if="stats.financeiro?.licencasVencendoEm30Dias">
                  {{ stats.financeiro.licencasVencendoEm30Dias }} vencendo
                </p>
              </div>
            </div>
            <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Recent Clubs -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Clubes Recentes</h3>
          </div>
          <div class="p-6">
            <div v-if="recentClubes.length === 0" class="text-center text-gray-500 py-4">
              Nenhum clube cadastrado ainda
            </div>
            <div v-else class="space-y-4">
              <div 
                v-for="clube in recentClubes" 
                :key="clube.id"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <h4 class="font-medium text-gray-900">{{ clube.nome }}</h4>
                  <p class="text-sm text-gray-600">{{ clube.cnpj }}</p>
                </div>
                <div class="text-right">
                  <span 
                    :class="getStatusClass(clube.licenca_status)"
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  >
                    {{ clube.licenca_status }}
                  </span>
                  <p class="text-xs text-gray-500 mt-1">{{ clube.plano }}</p>
                </div>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-200">
              <NuxtLink 
                to="/system/clubes" 
                class="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Ver todos os clubes →
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Overdue Licenses -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Licenças Vencidas</h3>
          </div>
          <div class="p-6">
            <div v-if="overdueClubs.length === 0" class="text-center text-gray-500 py-4">
              Nenhuma licença vencida
            </div>
            <div v-else class="space-y-4">
              <div 
                v-for="clube in overdueClubs" 
                :key="clube.id"
                class="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
              >
                <div>
                  <h4 class="font-medium text-gray-900">{{ clube.nome }}</h4>
                  <p class="text-sm text-gray-600">{{ clube.cnpj }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm text-red-600 font-medium">
                    Venceu em {{ formatDate(clube.data_vencimento) }}
                  </p>
                  <p class="text-xs text-gray-500">{{ clube.email_contato }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Revenue Chart -->
      <div v-if="revenueTrend.length > 0" class="mt-8 bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Evolução da Receita (6 meses)</h3>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div 
              v-for="month in revenueTrend" 
              :key="month.mes"
              class="text-center p-4 bg-gray-50 rounded-lg"
            >
              <p class="text-sm text-gray-600">{{ formatMonth(month.mes) }}</p>
              <p class="text-lg font-semibold text-gray-900">
                R$ {{ formatCurrency(month.receita) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'system-admin'
})

// State
const loading = ref(true)
const stats = ref({})
const recentClubes = ref([])
const overdueClubs = ref([])
const revenueTrend = ref([])

// Methods
const refreshData = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/system/dashboard')
    stats.value = response.stats
    recentClubes.value = response.recentClubes || []
    overdueClubs.value = response.clubesComLicencaVencida || []
    revenueTrend.value = response.revenueTrend || []
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error)
  } finally {
    loading.value = false
  }
}

const getStatusClass = (status) => {
  switch (status) {
    case 'ativa': return 'bg-green-100 text-green-800'
    case 'suspensa': return 'bg-yellow-100 text-yellow-800'
    case 'cancelada': return 'bg-red-100 text-red-800'
    case 'pendente': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value).replace('R$', '').trim()
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

const formatMonth = (monthString) => {
  const [year, month] = monthString.split('-')
  const date = new Date(year, month - 1)
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

// Load data on mount
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.system-admin-dashboard {
  min-height: 100vh;
  background-color: #f9fafb;
}

.header-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-section h1,
.header-section p {
  color: white;
}
</style>