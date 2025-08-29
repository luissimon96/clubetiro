<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Gerenciar Eventos</h1>
      <p class="text-gray-600">Organize e gerencie os eventos do clube de tiro</p>
    </div>

    <!-- Add Event Form -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">{{ editingEvento ? 'Editar Evento' : 'Novo Evento' }}</h2>
      
      <form @submit.prevent="submitForm" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AppInput
            v-model="form.nome"
            label="Nome do Evento"
            placeholder="Ex: Campeonato de Precisão"
            :error="errors.nome"
            required
          />
          
          <AppInput
            v-model="form.data"
            label="Data"
            type="date"
            :error="errors.data"
            required
          />
          
          <AppInput
            v-model="form.local"
            label="Local"
            placeholder="Ex: Estande Principal"
            :error="errors.local"
            required
          />
          
          <AppSelect
            v-model="form.status"
            label="Status"
            :options="statusOptions"
            :error="errors.status"
          />
        </div>
        
        <AppInput
          v-model="form.descricao"
          label="Descrição"
          placeholder="Descreva os detalhes do evento"
          :error="errors.descricao"
        />

        <div class="flex gap-3 pt-4">
          <AppButton
            type="submit"
            :loading="api.loading.value"
            variant="primary"
          >
            {{ editingEvento ? 'Atualizar' : 'Criar Evento' }}
          </AppButton>
          
          <AppButton
            v-if="editingEvento"
            type="button"
            variant="secondary"
            @click="cancelEdit"
          >
            Cancelar
          </AppButton>
        </div>
      </form>
    </div>

    <!-- Events Table -->
    <div class="bg-white rounded-lg shadow-md">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-xl font-semibold">Eventos Cadastrados</h2>
      </div>
      
      <AppTable
        :loading="api.loading.value"
        :headers="tableHeaders"
        :items="eventos"
        :empty-message="'Nenhum evento encontrado'"
      >
        <template #status="{ item }">
          <span :class="getStatusClass(item.status)" class="px-2 py-1 rounded-full text-xs font-medium">
            {{ getStatusLabel(item.status) }}
          </span>
        </template>
        
        <template #data="{ item }">
          {{ formatDate(item.data) }}
        </template>
        
        <template #actions="{ item }">
          <div class="flex gap-2">
            <AppButton
              size="sm"
              variant="primary"
              @click="manageParticipants(item)"
            >
              Participantes
            </AppButton>
            <AppButton
              size="sm"
              variant="secondary"
              @click="startEdit(item)"
            >
              Editar
            </AppButton>
            <AppButton
              size="sm"
              variant="danger"
              :loading="api.loading.value"
              @click="confirmDelete(item)"
            >
              Excluir
            </AppButton>
          </div>
        </template>
      </AppTable>
    </div>

    <!-- Participants Management Modal -->
    <div v-if="showParticipantsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-lg w-full max-w-4xl mx-4 max-h-screen overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold">
              Participantes - {{ selectedEvento?.nome }}
            </h2>
            <AppButton
              variant="secondary"
              size="sm"
              @click="closeParticipantsModal"
            >
              ✕
            </AppButton>
          </div>

          <!-- User Search and Add -->
          <div class="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 class="font-medium mb-4">Adicionar Participantes</h3>
            <div class="flex gap-3">
              <div class="flex-1">
                <AppInput
                  v-model="userSearch"
                  label="Buscar Usuário"
                  placeholder="Digite o nome ou email do usuário"
                  @input="searchUsers"
                />
                <!-- Search Results -->
                <div v-if="searchResults.length > 0" class="mt-2 border border-gray-300 rounded-md bg-white max-h-48 overflow-y-auto">
                  <div
                    v-for="user in searchResults"
                    :key="user.id"
                    class="p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50"
                    @click="addParticipant(user)"
                  >
                    <div class="flex justify-between items-center">
                      <div>
                        <div class="font-medium">{{ user.nome }}</div>
                        <div class="text-sm text-gray-600">{{ user.email }}</div>
                      </div>
                      <span
                        :class="[
                          'px-2 py-1 text-xs font-medium rounded-full',
                          user.associado
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        ]"
                      >
                        {{ user.associado ? 'Associado' : 'Não Associado' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Participants List -->
          <div class="mb-4">
            <h3 class="font-medium mb-4">Participantes Inscritos</h3>
            <AppTable
              :data="eventParticipants"
              :columns="participantColumns"
              :loading="participantsLoading"
              :show-actions="true"
            >
              <template #cell-associado="{ value }">
                <span
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded-full',
                    value
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  ]"
                >
                  {{ value ? 'Associado' : 'Não Associado' }}
                </span>
              </template>
              
              <template #cell-dataInscricao="{ value }">
                {{ formatDate(value) }}
              </template>

              <template #actions="{ item }">
                <AppButton
                  size="sm"
                  variant="danger"
                  @click="removeParticipant(item.userId)"
                >
                  Remover
                </AppButton>
              </template>
            </AppTable>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="api.error.value" class="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      {{ api.error.value }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Evento } from '../../models/evento'
import type { User, EventParticipant } from '../../models/user'
import { useApi } from '../../composables/useApi'

// Data
const eventos = ref<Evento[]>([])
const editingEvento = ref<Evento | null>(null)
const api = useApi<Evento>('/api/eventos')

// Participants management
const showParticipantsModal = ref(false)
const selectedEvento = ref<Evento | null>(null)
const eventParticipants = ref<EventParticipant[]>([])
const participantsLoading = ref(false)
const userSearch = ref('')
const searchResults = ref<User[]>([])
const allUsers = ref<User[]>([])
const usersApi = useApi<User>('/api/users')

// Form
const form = ref({
  nome: '',
  data: '',
  local: '',
  descricao: '',
  status: 'aberto' as const
})

const errors = ref({
  nome: '',
  data: '',
  local: '',
  descricao: '',
  status: ''
})

// Options
const statusOptions = [
  { value: 'aberto', label: 'Aberto' },
  { value: 'encerrado', label: 'Encerrado' },
  { value: 'cancelado', label: 'Cancelado' }
]

const tableHeaders = [
  { key: 'nome', label: 'Nome' },
  { key: 'data', label: 'Data' },
  { key: 'local', label: 'Local' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Ações', sortable: false }
]

const participantColumns = [
  { key: 'nome', label: 'Nome' },
  { key: 'email', label: 'Email' },
  { key: 'associado', label: 'Tipo' },
  { key: 'dataInscricao', label: 'Data Inscrição' }
]

// Methods
async function fetchEventos() {
  try {
    eventos.value = await api.getAll()
  } catch (error) {
    console.error('Erro ao carregar eventos:', error)
  }
}

function validateForm(): boolean {
  errors.value = {
    nome: '',
    data: '',
    local: '',
    descricao: '',
    status: ''
  }

  let isValid = true

  if (!form.value.nome.trim()) {
    errors.value.nome = 'Nome é obrigatório'
    isValid = false
  }

  if (!form.value.data) {
    errors.value.data = 'Data é obrigatória'
    isValid = false
  }

  if (!form.value.local.trim()) {
    errors.value.local = 'Local é obrigatório'
    isValid = false
  }

  return isValid
}

async function submitForm() {
  if (!validateForm()) return

  try {
    if (editingEvento.value) {
      await api.update(editingEvento.value.id, form.value)
    } else {
      await api.create(form.value)
    }
    
    resetForm()
    await fetchEventos()
  } catch (error) {
    console.error('Erro ao salvar evento:', error)
  }
}

function startEdit(evento: Evento) {
  editingEvento.value = evento
  form.value = {
    nome: evento.nome,
    data: evento.data,
    local: evento.local,
    descricao: evento.descricao,
    status: evento.status
  }
  
  // Scroll to form
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEdit() {
  editingEvento.value = null
  resetForm()
}

function resetForm() {
  form.value = {
    nome: '',
    data: '',
    local: '',
    descricao: '',
    status: 'aberto'
  }
  errors.value = {
    nome: '',
    data: '',
    local: '',
    descricao: '',
    status: ''
  }
}

async function confirmDelete(evento: Evento) {
  if (confirm(`Tem certeza que deseja excluir o evento "${evento.nome}"?`)) {
    try {
      await api.remove(evento.id)
      await fetchEventos()
    } catch (error) {
      console.error('Erro ao excluir evento:', error)
    }
  }
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'aberto':
      return 'bg-green-100 text-green-800'
    case 'encerrado':
      return 'bg-gray-100 text-gray-800'
    case 'cancelado':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'aberto':
      return 'Aberto'
    case 'encerrado':
      return 'Encerrado'
    case 'cancelado':
      return 'Cancelado'
    default:
      return status
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

// Participants management functions
async function manageParticipants(evento: Evento) {
  selectedEvento.value = evento
  showParticipantsModal.value = true
  await fetchEventParticipants(evento.id)
  await fetchAllUsers()
}

function closeParticipantsModal() {
  showParticipantsModal.value = false
  selectedEvento.value = null
  eventParticipants.value = []
  userSearch.value = ''
  searchResults.value = []
}

async function fetchEventParticipants(eventoId: string) {
  participantsLoading.value = true
  try {
    const response = await fetch(`/api/eventos/${eventoId}/participantes`)
    if (response.ok) {
      const participants = await response.json()
      eventParticipants.value = participants.map((p: any) => ({
        ...p,
        nome: p.user?.nome || 'N/A',
        email: p.user?.email || 'N/A',
        associado: p.user?.associado || false
      }))
    }
  } catch (error) {
    console.error('Erro ao carregar participantes:', error)
  } finally {
    participantsLoading.value = false
  }
}

async function fetchAllUsers() {
  try {
    allUsers.value = await usersApi.getAll()
  } catch (error) {
    console.error('Erro ao carregar usuários:', error)
  }
}

function searchUsers() {
  if (!userSearch.value.trim()) {
    searchResults.value = []
    return
  }

  const query = userSearch.value.toLowerCase()
  searchResults.value = allUsers.value
    .filter(user => 
      user.nome.toLowerCase().includes(query) || 
      user.email.toLowerCase().includes(query)
    )
    .filter(user => 
      !eventParticipants.value.some(p => p.userId === user.id)
    )
    .slice(0, 10) // Limit to 10 results
}

async function addParticipant(user: User) {
  if (!selectedEvento.value) return

  try {
    const response = await fetch(`/api/eventos/${selectedEvento.value.id}/participantes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: user.id
      })
    })

    if (response.ok) {
      await fetchEventParticipants(selectedEvento.value.id)
      userSearch.value = ''
      searchResults.value = []
    }
  } catch (error) {
    console.error('Erro ao adicionar participante:', error)
  }
}

async function removeParticipant(userId: string) {
  if (!selectedEvento.value) return

  if (confirm('Tem certeza que deseja remover este participante?')) {
    try {
      const response = await fetch(`/api/eventos/${selectedEvento.value.id}/participantes/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchEventParticipants(selectedEvento.value.id)
      }
    } catch (error) {
      console.error('Erro ao remover participante:', error)
    }
  }
}

// Lifecycle
onMounted(fetchEventos)
</script>
