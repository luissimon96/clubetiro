<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Gerenciar Mensalidades</h1>
      <p class="text-gray-600">Controle as mensalidades e planos dos participantes</p>
    </div>

    <!-- Add Subscription Form -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">{{ editingMensalidade ? 'Editar Mensalidade' : 'Nova Mensalidade' }}</h2>
      
      <form @submit.prevent="submitForm" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AppSelect
            v-model="form.participanteId"
            label="Participante"
            :options="participantesOptions"
            placeholder="Selecione um participante"
            :error="errors.participanteId"
            required
          />
          
          <AppSelect
            v-model="form.tipoPlano"
            label="Tipo de Plano"
            :options="tipoPlanoOptions"
            :error="errors.tipoPlano"
            required
          />
          
          <AppInput
            v-model="form.valor"
            label="Valor (R$)"
            type="number"
            min="0"
            step="0.01"
            placeholder="Ex: 150.00"
            :error="errors.valor"
            required
          />
          
          <AppSelect
            v-model="form.status"
            label="Status"
            :options="statusOptions"
            :error="errors.status"
            required
          />
          
          <AppInput
            v-model="form.dataInicio"
            label="Data de Início"
            type="date"
            :error="errors.dataInicio"
            required
          />
          
          <AppInput
            v-model="form.dataFim"
            label="Data de Fim"
            type="date"
            :error="errors.dataFim"
            required
          />
        </div>

        <div class="flex gap-3 pt-4">
          <AppButton
            type="submit"
            :loading="api.loading.value"
            variant="primary"
          >
            {{ editingMensalidade ? 'Atualizar' : 'Criar Mensalidade' }}
          </AppButton>
          
          <AppButton
            v-if="editingMensalidade"
            type="button"
            variant="secondary"
            @click="cancelEdit"
          >
            Cancelar
          </AppButton>
          
          <AppButton
            v-if="form.tipoPlano"
            type="button"
            variant="secondary"
            @click="autoCalculateDates"
          >
            Auto-calcular Período
          </AppButton>
        </div>
      </form>
    </div>

    <!-- Subscriptions Table -->
    <div class="bg-white rounded-lg shadow-md">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-xl font-semibold">Mensalidades Cadastradas</h2>
      </div>
      
      <AppTable
        :loading="api.loading.value"
        :headers="tableHeaders"
        :items="mensalidadesWithNames"
        :empty-message="'Nenhuma mensalidade encontrada'"
      >
        <template #valor="{ item }">
          <span class="font-mono text-lg font-bold text-green-600">
            {{ formatCurrency(item.valor) }}
          </span>
        </template>
        
        <template #tipoPlano="{ item }">
          <span :class="getTipoPlanoClass(item.tipoPlano)" class="px-3 py-1 rounded-full text-xs font-medium">
            {{ getTipoPlanoLabel(item.tipoPlano) }}
          </span>
        </template>
        
        <template #dataInicio="{ item }">
          {{ formatDate(item.dataInicio) }}
        </template>
        
        <template #dataFim="{ item }">
          {{ formatDate(item.dataFim) }}
        </template>
        
        <template #status="{ item }">
          <span :class="getStatusClass(item.status)" class="px-3 py-1 rounded-full text-xs font-medium">
            {{ getStatusLabel(item.status) }}
          </span>
        </template>
        
        <template #periodo="{ item }">
          <span class="text-sm text-gray-600">
            {{ calculatePeriodDays(item.dataInicio, item.dataFim) }} dias
          </span>
        </template>
        
        <template #actions="{ item }">
          <div class="flex gap-2">
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

    <!-- Error Message -->
    <div v-if="api.error.value" class="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      {{ api.error.value }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Mensalidade } from '../../models/mensalidade'
import type { Participante } from '../../models/participante'
import { useApi } from '../../composables/useApi'

// Data
const mensalidades = ref<Mensalidade[]>([])
const participantes = ref<Participante[]>([])
const editingMensalidade = ref<Mensalidade | null>(null)

// APIs
const api = useApi<Mensalidade>('/api/mensalidades')
const participantesApi = useApi<Participante>('/api/participantes')

// Form
const form = ref({
  participanteId: '',
  tipoPlano: 'mensal' as const,
  valor: '',
  dataInicio: '',
  dataFim: '',
  status: 'ativa' as const
})

const errors = ref({
  participanteId: '',
  tipoPlano: '',
  valor: '',
  dataInicio: '',
  dataFim: '',
  status: ''
})

// Options
const tipoPlanoOptions = [
  { value: 'mensal', label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' }
]

const statusOptions = [
  { value: 'ativa', label: 'Ativa' },
  { value: 'inativa', label: 'Inativa' }
]

// Computed
const participantesOptions = computed(() => 
  participantes.value.map(participante => ({
    value: participante.id,
    label: participante.nome
  }))
)

const mensalidadesWithNames = computed(() => 
  mensalidades.value.map(mensalidade => {
    const participante = participantes.value.find(p => p.id === mensalidade.participanteId)
    
    return {
      ...mensalidade,
      participanteNome: participante?.nome || 'Participante não encontrado'
    }
  })
)

const tableHeaders = [
  { key: 'participanteNome', label: 'Participante' },
  { key: 'tipoPlano', label: 'Plano' },
  { key: 'valor', label: 'Valor' },
  { key: 'dataInicio', label: 'Início' },
  { key: 'dataFim', label: 'Fim' },
  { key: 'periodo', label: 'Período' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Ações', sortable: false }
]

// Methods
async function fetchData() {
  try {
    await Promise.all([
      fetchMensalidades(),
      fetchParticipantes()
    ])
  } catch (error) {
    console.error('Erro ao carregar dados:', error)
  }
}

async function fetchMensalidades() {
  mensalidades.value = await api.getAll()
}

async function fetchParticipantes() {
  participantes.value = await participantesApi.getAll()
}

function validateForm(): boolean {
  errors.value = {
    participanteId: '',
    tipoPlano: '',
    valor: '',
    dataInicio: '',
    dataFim: '',
    status: ''
  }

  let isValid = true

  if (!form.value.participanteId) {
    errors.value.participanteId = 'Participante é obrigatório'
    isValid = false
  }

  if (!form.value.valor) {
    errors.value.valor = 'Valor é obrigatório'
    isValid = false
  } else {
    const valor = Number(form.value.valor)
    if (isNaN(valor) || valor <= 0) {
      errors.value.valor = 'Valor deve ser um número positivo'
      isValid = false
    }
  }

  if (!form.value.dataInicio) {
    errors.value.dataInicio = 'Data de início é obrigatória'
    isValid = false
  }

  if (!form.value.dataFim) {
    errors.value.dataFim = 'Data de fim é obrigatória'
    isValid = false
  }

  // Validate date range
  if (form.value.dataInicio && form.value.dataFim) {
    const inicio = new Date(form.value.dataInicio)
    const fim = new Date(form.value.dataFim)
    
    if (inicio >= fim) {
      errors.value.dataFim = 'Data de fim deve ser posterior à data de início'
      isValid = false
    }
  }

  return isValid
}

async function submitForm() {
  if (!validateForm()) return

  try {
    const formData = {
      participanteId: form.value.participanteId,
      tipoPlano: form.value.tipoPlano,
      valor: Number(form.value.valor),
      dataInicio: form.value.dataInicio,
      dataFim: form.value.dataFim,
      status: form.value.status
    }

    if (editingMensalidade.value) {
      await api.update(editingMensalidade.value.id, formData)
    } else {
      await api.create(formData)
    }
    
    resetForm()
    await fetchMensalidades()
  } catch (error) {
    console.error('Erro ao salvar mensalidade:', error)
  }
}

function startEdit(mensalidade: Mensalidade) {
  editingMensalidade.value = mensalidade
  form.value = {
    participanteId: mensalidade.participanteId,
    tipoPlano: mensalidade.tipoPlano,
    valor: mensalidade.valor.toString(),
    dataInicio: mensalidade.dataInicio,
    dataFim: mensalidade.dataFim,
    status: mensalidade.status
  }
  
  // Scroll to form
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEdit() {
  editingMensalidade.value = null
  resetForm()
}

function resetForm() {
  form.value = {
    participanteId: '',
    tipoPlano: 'mensal',
    valor: '',
    dataInicio: '',
    dataFim: '',
    status: 'ativa'
  }
  errors.value = {
    participanteId: '',
    tipoPlano: '',
    valor: '',
    dataInicio: '',
    dataFim: '',
    status: ''
  }
}

function autoCalculateDates() {
  if (!form.value.dataInicio || !form.value.tipoPlano) return

  const startDate = new Date(form.value.dataInicio)
  let endDate = new Date(startDate)

  switch (form.value.tipoPlano) {
    case 'mensal':
      endDate.setMonth(endDate.getMonth() + 1)
      break
    case 'trimestral':
      endDate.setMonth(endDate.getMonth() + 3)
      break
    case 'semestral':
      endDate.setMonth(endDate.getMonth() + 6)
      break
    case 'anual':
      endDate.setFullYear(endDate.getFullYear() + 1)
      break
  }

  // Subtract 1 day to end on the last day of the period
  endDate.setDate(endDate.getDate() - 1)
  
  form.value.dataFim = endDate.toISOString().split('T')[0]
}

async function confirmDelete(mensalidade: Mensalidade) {
  if (confirm(`Tem certeza que deseja excluir esta mensalidade?`)) {
    try {
      await api.remove(mensalidade.id)
      await fetchMensalidades()
    } catch (error) {
      console.error('Erro ao excluir mensalidade:', error)
    }
  }
}

// Utility functions
function getTipoPlanoClass(tipo: string): string {
  switch (tipo) {
    case 'mensal':
      return 'bg-blue-100 text-blue-800'
    case 'trimestral':
      return 'bg-green-100 text-green-800'
    case 'semestral':
      return 'bg-purple-100 text-purple-800'
    case 'anual':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getTipoPlanoLabel(tipo: string): string {
  switch (tipo) {
    case 'mensal':
      return 'Mensal'
    case 'trimestral':
      return 'Trimestral'
    case 'semestral':
      return 'Semestral'
    case 'anual':
      return 'Anual'
    default:
      return tipo
  }
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'ativa':
      return 'bg-green-100 text-green-800'
    case 'inativa':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'ativa':
      return 'Ativa'
    case 'inativa':
      return 'Inativa'
    default:
      return status
  }
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

function calculatePeriodDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1 // Include both start and end dates
}

// Lifecycle
onMounted(fetchData)
</script>
