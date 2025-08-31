<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Gerenciar Participantes</h1>
      <p class="text-gray-600">Visualize e gerencie os participantes dos eventos do clube</p>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">Filtros</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AppSelect
          v-model="filters.eventoId"
          label="Evento"
          :options="eventoOptions"
          placeholder="Todos os eventos"
          @change="loadParticipantes"
        />
        
        <AppSelect
          v-model="filters.status"
          label="Status"
          :options="statusOptions"
          placeholder="Todos os status"
          @change="loadParticipantes"
        />
        
        <AppInput
          v-model="filters.dataInicio"
          label="Data Início"
          type="date"
          @input="loadParticipantes"
        />
        
        <AppInput
          v-model="filters.dataFim"
          label="Data Fim"
          type="date"
          @input="loadParticipantes"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-600">Carregando participantes...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
      {{ error }}
    </div>

    <!-- Participants Table -->
    <div v-else class="bg-white rounded-lg shadow-md overflow-hidden">
      <AppTable 
        :columns="columns" 
        :data="participantes"
        :loading="loading"
      >
        <template #eventoNome="{ item }">
          <div>
            <div class="font-medium">{{ item.eventoNome }}</div>
            <div class="text-sm text-gray-500">{{ formatDate(item.eventoData) }}</div>
          </div>
        </template>

        <template #participanteNome="{ item }">
          <div>
            <div class="font-medium">{{ item.participanteNome }}</div>
            <div class="text-sm text-gray-500">{{ item.participanteEmail }}</div>
            <div v-if="item.participanteTelefone" class="text-sm text-gray-500">
              {{ item.participanteTelefone }}
            </div>
          </div>
        </template>

        <template #status="{ item }">
          <span 
            :class="getStatusClass(item.status)"
            class="px-2 py-1 rounded-full text-sm font-medium"
          >
            {{ getStatusLabel(item.status) }}
          </span>
        </template>

        <template #valorPago="{ item }">
          <div class="text-right">
            <div class="font-medium">{{ formatCurrency(item.valorPago) }}</div>
            <div v-if="item.dataPagamento" class="text-sm text-green-600">
              Pago em {{ formatDate(item.dataPagamento) }}
            </div>
            <div v-else-if="item.valorPago > 0" class="text-sm text-yellow-600">
              Pendente
            </div>
            <div v-else class="text-sm text-gray-500">
              Gratuito
            </div>
          </div>
        </template>

        <template #actions="{ item }">
          <div class="flex space-x-2">
            <AppButton
              size="sm"
              variant="secondary"
              @click="editParticipant(item)"
            >
              Editar
            </AppButton>
            <AppButton
              size="sm"
              variant="danger"
              @click="confirmDelete(item)"
            >
              Remover
            </AppButton>
          </div>
        </template>
      </AppTable>
    </div>

    <!-- No Results -->
    <div v-if="!loading && !error && participantes.length === 0" class="text-center py-12 text-gray-500">
      <p class="text-lg mb-2">Nenhum participante encontrado</p>
      <p>Ajuste os filtros para ver mais resultados</p>
    </div>

    <!-- Edit Participant Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold">Editar Participante</h2>
            <AppButton
              variant="secondary"
              size="sm"
              @click="closeEditModal"
            >
              ✕
            </AppButton>
          </div>

          <form @submit.prevent="updateParticipant" class="space-y-4">
            <div>
              <p class="text-sm text-gray-600 mb-4">
                <strong>Evento:</strong> {{ editingParticipant?.eventoNome }}<br>
                <strong>Participante:</strong> {{ editingParticipant?.participanteNome }}
              </p>
            </div>

            <AppSelect
              v-model="editForm.status"
              label="Status"
              :options="statusOptions"
              required
            />
            
            <AppInput
              v-model="editForm.valorPago"
              label="Valor Pago"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
            />
            
            <AppInput
              v-model="editForm.dataPagamento"
              label="Data do Pagamento"
              type="datetime-local"
            />
            
            <AppInput
              v-model="editForm.observacoes"
              label="Observações"
              as="textarea"
              rows="3"
              placeholder="Observações sobre o participante..."
            />

            <div class="flex justify-end space-x-3 pt-4">
              <AppButton
                variant="secondary"
                type="button"
                @click="closeEditModal"
              >
                Cancelar
              </AppButton>
              <AppButton
                variant="primary"
                type="submit"
                :loading="updating"
              >
                Salvar
              </AppButton>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div class="p-6">
          <h2 class="text-xl font-semibold mb-4">Confirmar Exclusão</h2>
          <p class="text-gray-700 mb-6">
            Tem certeza que deseja remover {{ participantToDelete?.participanteNome }} 
            do evento {{ participantToDelete?.eventoNome }}?
          </p>
          <div class="flex justify-end space-x-3">
            <AppButton
              variant="secondary"
              @click="closeDeleteModal"
            >
              Cancelar
            </AppButton>
            <AppButton
              variant="danger"
              :loading="deleting"
              @click="deleteParticipant"
            >
              Remover
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Participante {
  id: string
  eventoId: string
  userId: string
  eventoNome: string
  eventoData: string
  participanteNome: string
  participanteEmail: string
  participanteTelefone?: string
  status: 'inscrito' | 'presente' | 'ausente' | 'cancelado'
  valorPago: number
  dataPagamento?: string
  dataInscricao: string
  observacoes?: string
}

interface Evento {
  id: string
  nome: string
}

// Page metadata
definePageMeta({
  title: 'Participantes',
  requiresAuth: true
})

// Reactive state
const loading = ref(true)
const error = ref<string | null>(null)
const participantes = ref<Participante[]>([])
const eventos = ref<Evento[]>([])

// Filters
const filters = reactive({
  eventoId: '',
  status: '',
  dataInicio: '',
  dataFim: ''
})

// Modals
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editingParticipant = ref<Participante | null>(null)
const participantToDelete = ref<Participante | null>(null)
const updating = ref(false)
const deleting = ref(false)

// Edit form
const editForm = reactive({
  status: '',
  valorPago: '',
  dataPagamento: '',
  observacoes: ''
})

// Table configuration
const columns = [
  { key: 'eventoNome', label: 'Evento', sortable: true },
  { key: 'participanteNome', label: 'Participante', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'valorPago', label: 'Pagamento', sortable: true },
  { key: 'dataInscricao', label: 'Inscrição', sortable: true },
  { key: 'actions', label: 'Ações', width: '150px' }
]

// Options
const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'inscrito', label: 'Inscrito' },
  { value: 'presente', label: 'Presente' },
  { value: 'ausente', label: 'Ausente' },
  { value: 'cancelado', label: 'Cancelado' }
]

const eventoOptions = computed(() => [
  { value: '', label: 'Todos os eventos' },
  ...eventos.value.map(evento => ({
    value: evento.id,
    label: evento.nome
  }))
])

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadEventos(),
    loadParticipantes()
  ])
})

// Methods
async function loadEventos() {
  try {
    const { data } = await $fetch('/api/eventos')
    eventos.value = data || []
  } catch (err) {
    console.error('Error loading events:', err)
  }
}

async function loadParticipantes() {
  try {
    loading.value = true
    error.value = null
    
    const query = new URLSearchParams()
    if (filters.eventoId) query.append('eventoId', filters.eventoId)
    if (filters.status) query.append('status', filters.status)
    if (filters.dataInicio) query.append('dataInicio', filters.dataInicio)
    if (filters.dataFim) query.append('dataFim', filters.dataFim)
    
    const url = `/api/participantes${query.toString() ? `?${query.toString()}` : ''}`
    const response = await $fetch(url)
    
    participantes.value = response.data || []
  } catch (err: any) {
    console.error('Error loading participants:', err)
    error.value = err.data?.message || 'Erro ao carregar participantes'
  } finally {
    loading.value = false
  }
}

function editParticipant(participant: Participante) {
  editingParticipant.value = participant
  editForm.status = participant.status
  editForm.valorPago = participant.valorPago.toString()
  editForm.dataPagamento = participant.dataPagamento ? 
    participant.dataPagamento.slice(0, 16) : ''
  editForm.observacoes = participant.observacoes || ''
  showEditModal.value = true
}

async function updateParticipant() {
  if (!editingParticipant.value) return
  
  try {
    updating.value = true
    
    const updateData: any = {
      status: editForm.status
    }
    
    if (editForm.valorPago) {
      updateData.valorPago = parseFloat(editForm.valorPago)
    }
    
    if (editForm.dataPagamento) {
      updateData.dataPagamento = new Date(editForm.dataPagamento).toISOString()
    }
    
    if (editForm.observacoes) {
      updateData.observacoes = editForm.observacoes
    }
    
    await $fetch(`/api/participantes/${editingParticipant.value.id}`, {
      method: 'PUT',
      body: updateData
    })
    
    await loadParticipantes()
    closeEditModal()
    
    // Show success message (you might want to add a toast notification here)
    
  } catch (err: any) {
    console.error('Error updating participant:', err)
    error.value = err.data?.message || 'Erro ao atualizar participante'
  } finally {
    updating.value = false
  }
}

function confirmDelete(participant: Participante) {
  participantToDelete.value = participant
  showDeleteModal.value = true
}

async function deleteParticipant() {
  if (!participantToDelete.value) return
  
  try {
    deleting.value = true
    
    await $fetch(`/api/participantes/${participantToDelete.value.id}`, {
      method: 'DELETE'
    })
    
    await loadParticipantes()
    closeDeleteModal()
    
    // Show success message (you might want to add a toast notification here)
    
  } catch (err: any) {
    console.error('Error deleting participant:', err)
    error.value = err.data?.message || 'Erro ao remover participante'
  } finally {
    deleting.value = false
  }
}

function closeEditModal() {
  showEditModal.value = false
  editingParticipant.value = null
  Object.assign(editForm, {
    status: '',
    valorPago: '',
    dataPagamento: '',
    observacoes: ''
  })
}

function closeDeleteModal() {
  showDeleteModal.value = false
  participantToDelete.value = null
}

// Utility functions
function getStatusClass(status: string): string {
  const classes = {
    inscrito: 'bg-blue-100 text-blue-800',
    presente: 'bg-green-100 text-green-800',
    ausente: 'bg-yellow-100 text-yellow-800',
    cancelado: 'bg-red-100 text-red-800'
  }
  return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800'
}

function getStatusLabel(status: string): string {
  const labels = {
    inscrito: 'Inscrito',
    presente: 'Presente',
    ausente: 'Ausente',
    cancelado: 'Cancelado'
  }
  return labels[status as keyof typeof labels] || status
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}
</script>