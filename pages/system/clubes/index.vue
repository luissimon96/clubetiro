<template>
  <div class="clubes-management">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Gerenciamento de Clubes</h1>
            <p class="text-sm text-gray-600">Cadastre e gerencie todos os clubes de tiro</p>
          </div>
          <div class="flex space-x-4">
            <button
              @click="showCreateModal = true"
              class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              + Novo Clube
            </button>
            <NuxtLink
              to="/system/dashboard"
              class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Dashboard
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <input
              v-model="filters.search"
              type="text"
              placeholder="Nome, CNPJ ou CR..."
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              @input="debouncedSearch"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              v-model="filters.status"
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              @change="loadClubes"
            >
              <option value="">Todos</option>
              <option value="ativa">Ativa</option>
              <option value="suspensa">Suspensa</option>
              <option value="cancelada">Cancelada</option>
              <option value="pendente">Pendente</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Plano</label>
            <select
              v-model="filters.plano"
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              @change="loadClubes"
            >
              <option value="">Todos</option>
              <option value="basico">Básico</option>
              <option value="intermediario">Intermediário</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Situação</label>
            <select
              v-model="filters.ativo"
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              @change="loadClubes"
            >
              <option value="">Todos</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Clubs List -->
      <div v-else-if="clubes.length > 0" class="bg-white rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clube
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CNPJ / CR
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Licença
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="clube in clubes" :key="clube.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ clube.nome }}</div>
                    <div class="text-sm text-gray-500">{{ clube.endereco.cidade }}/{{ clube.endereco.estado }}</div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ clube.cnpj }}</div>
                  <div class="text-sm text-gray-500">{{ clube.cr }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span 
                    :class="getStatusClass(clube.licenca.status)"
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  >
                    {{ clube.licenca.status }}
                  </span>
                  <div class="text-sm text-gray-500 mt-1">
                    {{ clube.licenca.plano }} - R$ {{ formatCurrency(clube.licenca.valorMensal) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ clube.contato.responsavel }}</div>
                  <div class="text-sm text-gray-500">{{ clube.contato.email }}</div>
                  <div class="text-sm text-gray-500">{{ clube.contato.telefone }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    @click="viewClube(clube)"
                    class="text-blue-600 hover:text-blue-900"
                  >
                    Ver
                  </button>
                  <button
                    @click="editClube(clube)"
                    class="text-indigo-600 hover:text-indigo-900"
                  >
                    Editar
                  </button>
                  <button
                    @click="manageUsers(clube)"
                    class="text-green-600 hover:text-green-900"
                  >
                    Usuários
                  </button>
                  <button
                    @click="toggleActive(clube)"
                    :class="clube.ativo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'"
                  >
                    {{ clube.ativo ? 'Desativar' : 'Ativar' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.totalPages > 1" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              @click="changePage(pagination.page - 1)"
              :disabled="pagination.page <= 1"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              @click="changePage(pagination.page + 1)"
              :disabled="pagination.page >= pagination.totalPages"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Próximo
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Mostrando <span class="font-medium">{{ (pagination.page - 1) * pagination.limit + 1 }}</span>
                até <span class="font-medium">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span>
                de <span class="font-medium">{{ pagination.total }}</span> resultados
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  @click="changePage(pagination.page - 1)"
                  :disabled="pagination.page <= 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  ←
                </button>
                <button
                  v-for="page in getVisiblePages()"
                  :key="page"
                  @click="changePage(page)"
                  :class="page === pagination.page 
                    ? 'bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'"
                  class="relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                >
                  {{ page }}
                </button>
                <button
                  @click="changePage(pagination.page + 1)"
                  :disabled="pagination.page >= pagination.totalPages"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  →
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="bg-white rounded-lg shadow p-12 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">Nenhum clube encontrado</h3>
        <p class="mt-1 text-sm text-gray-500">Comece cadastrando o primeiro clube de tiro.</p>
        <div class="mt-6">
          <button
            @click="showCreateModal = true"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            + Cadastrar Primeiro Clube
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Club Modal -->
    <ClubModal 
      v-if="showCreateModal || editingClube"
      :clube="editingClube"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>

<script setup>
import { debounce } from 'lodash-es'

definePageMeta({
  middleware: 'system-admin'
})

// State
const loading = ref(true)
const clubes = ref([])
const showCreateModal = ref(false)
const editingClube = ref(null)

const filters = ref({
  search: '',
  status: '',
  plano: '',
  ativo: ''
})

const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
})

// Methods
const loadClubes = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      ...Object.fromEntries(
        Object.entries(filters.value).filter(([_, value]) => value !== '')
      )
    }
    
    const response = await $fetch('/api/system/clubes', { params })
    clubes.value = response.data || []
    pagination.value = { ...pagination.value, ...response.pagination }
  } catch (error) {
    console.error('Erro ao carregar clubes:', error)
  } finally {
    loading.value = false
  }
}

const debouncedSearch = debounce(() => {
  pagination.value.page = 1
  loadClubes()
}, 500)

const changePage = (page) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.page = page
    loadClubes()
  }
}

const getVisiblePages = () => {
  const current = pagination.value.page
  const total = pagination.value.totalPages
  const pages = []
  
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
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
    minimumFractionDigits: 2
  }).format(value)
}

const viewClube = (clube) => {
  navigateTo(`/system/clubes/${clube.id}`)
}

const editClube = (clube) => {
  editingClube.value = { ...clube }
}

const manageUsers = (clube) => {
  navigateTo(`/system/clubes/${clube.id}/users`)
}

const toggleActive = async (clube) => {
  try {
    await $fetch(`/api/system/clubes/${clube.id}`, {
      method: 'PUT',
      body: { ativo: !clube.ativo }
    })
    
    clube.ativo = !clube.ativo
  } catch (error) {
    console.error('Erro ao alterar status:', error)
    alert('Erro ao alterar status do clube')
  }
}

const closeModal = () => {
  showCreateModal.value = false
  editingClube.value = null
}

const handleSave = () => {
  closeModal()
  loadClubes() // Reload data
}

// Load data on mount
onMounted(() => {
  loadClubes()
})
</script>

<style scoped>
.clubes-management {
  min-height: 100vh;
  background-color: #f9fafb;
}
</style>