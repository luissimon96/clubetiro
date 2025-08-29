<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Gerenciar Resultados</h1>
      <p class="text-gray-600">Registre e acompanhe os resultados dos eventos de tiro</p>
    </div>

    <!-- Add Result Form -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">{{ editingResultado ? 'Editar Resultado' : 'Novo Resultado' }}</h2>
      
      <form @submit.prevent="submitForm" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AppSelect
            v-model="form.eventoId"
            label="Evento"
            :options="eventosOptions"
            placeholder="Selecione um evento"
            :error="errors.eventoId"
            required
          />
          
          <AppSelect
            v-model="form.participanteId"
            label="Participante"
            :options="participantesOptions"
            placeholder="Selecione um participante"
            :error="errors.participanteId"
            required
          />
          
          <AppInput
            v-model="form.pontuacao"
            label="Pontuação"
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder="Ex: 95.5"
            :error="errors.pontuacao"
            required
          />
          
          <AppInput
            v-model="form.ranking"
            label="Posição/Ranking"
            type="number"
            min="1"
            placeholder="Ex: 1"
            :error="errors.ranking"
            required
          />
        </div>
        
        <AppInput
          v-model="form.observacoes"
          label="Observações"
          placeholder="Comentários sobre o desempenho (opcional)"
          :error="errors.observacoes"
        />

        <div class="flex gap-3 pt-4">
          <AppButton
            type="submit"
            :loading="api.loading.value"
            variant="primary"
          >
            {{ editingResultado ? 'Atualizar' : 'Registrar Resultado' }}
          </AppButton>
          
          <AppButton
            v-if="editingResultado"
            type="button"
            variant="secondary"
            @click="cancelEdit"
          >
            Cancelar
          </AppButton>
        </div>
      </form>
    </div>

    <!-- Results Table -->
    <div class="bg-white rounded-lg shadow-md">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-xl font-semibold">Resultados Registrados</h2>
      </div>
      
      <AppTable
        :loading="api.loading.value"
        :headers="tableHeaders"
        :items="resultadosWithNames"
        :empty-message="'Nenhum resultado encontrado'"
      >
        <template #pontuacao="{ item }">
          <span class="font-mono text-lg font-bold text-blue-600">
            {{ item.pontuacao }}
          </span>
        </template>
        
        <template #ranking="{ item }">
          <div class="flex items-center gap-2">
            <span 
              :class="getRankingClass(item.ranking)"
              class="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold"
            >
              {{ item.ranking }}
            </span>
          </div>
        </template>
        
        <template #observacoes="{ item }">
          <span class="text-sm text-gray-600 max-w-xs truncate" :title="item.observacoes">
            {{ item.observacoes || '-' }}
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
import type { Resultado } from '../../models/resultado'
import type { Evento } from '../../models/evento'
import type { Participante } from '../../models/participante'
import { useApi } from '../../composables/useApi'

// Data
const resultados = ref<Resultado[]>([])
const eventos = ref<Evento[]>([])
const participantes = ref<Participante[]>([])
const editingResultado = ref<Resultado | null>(null)

// APIs
const api = useApi<Resultado>('/api/resultados')
const eventosApi = useApi<Evento>('/api/eventos')
const participantesApi = useApi<Participante>('/api/participantes')

// Form
const form = ref({
  eventoId: '',
  participanteId: '',
  pontuacao: '',
  ranking: '',
  observacoes: ''
})

const errors = ref({
  eventoId: '',
  participanteId: '',
  pontuacao: '',
  ranking: '',
  observacoes: ''
})

// Computed
const eventosOptions = computed(() => 
  eventos.value.map(evento => ({
    value: evento.id,
    label: `${evento.nome} - ${formatDate(evento.data)}`
  }))
)

const participantesOptions = computed(() => 
  participantes.value.map(participante => ({
    value: participante.id,
    label: participante.nome
  }))
)

const resultadosWithNames = computed(() => 
  resultados.value.map(resultado => {
    const evento = eventos.value.find(e => e.id === resultado.eventoId)
    const participante = participantes.value.find(p => p.id === resultado.participanteId)
    
    return {
      ...resultado,
      eventoNome: evento?.nome || 'Evento não encontrado',
      participanteNome: participante?.nome || 'Participante não encontrado'
    }
  })
)

const tableHeaders = [
  { key: 'eventoNome', label: 'Evento' },
  { key: 'participanteNome', label: 'Participante' },
  { key: 'pontuacao', label: 'Pontuação' },
  { key: 'ranking', label: 'Posição' },
  { key: 'observacoes', label: 'Observações' },
  { key: 'actions', label: 'Ações', sortable: false }
]

// Methods
async function fetchData() {
  try {
    await Promise.all([
      fetchResultados(),
      fetchEventos(),
      fetchParticipantes()
    ])
  } catch (error) {
    console.error('Erro ao carregar dados:', error)
  }
}

async function fetchResultados() {
  resultados.value = await api.getAll()
}

async function fetchEventos() {
  eventos.value = await eventosApi.getAll()
}

async function fetchParticipantes() {
  participantes.value = await participantesApi.getAll()
}

function validateForm(): boolean {
  errors.value = {
    eventoId: '',
    participanteId: '',
    pontuacao: '',
    ranking: '',
    observacoes: ''
  }

  let isValid = true

  if (!form.value.eventoId) {
    errors.value.eventoId = 'Evento é obrigatório'
    isValid = false
  }

  if (!form.value.participanteId) {
    errors.value.participanteId = 'Participante é obrigatório'
    isValid = false
  }

  if (!form.value.pontuacao) {
    errors.value.pontuacao = 'Pontuação é obrigatória'
    isValid = false
  } else {
    const pontuacao = Number(form.value.pontuacao)
    if (isNaN(pontuacao) || pontuacao < 0 || pontuacao > 100) {
      errors.value.pontuacao = 'Pontuação deve ser um número entre 0 e 100'
      isValid = false
    }
  }

  if (!form.value.ranking) {
    errors.value.ranking = 'Posição é obrigatória'
    isValid = false
  } else {
    const ranking = Number(form.value.ranking)
    if (isNaN(ranking) || ranking < 1) {
      errors.value.ranking = 'Posição deve ser um número maior que 0'
      isValid = false
    }
  }

  return isValid
}

async function submitForm() {
  if (!validateForm()) return

  try {
    const formData = {
      eventoId: form.value.eventoId,
      participanteId: form.value.participanteId,
      pontuacao: Number(form.value.pontuacao),
      ranking: Number(form.value.ranking),
      observacoes: form.value.observacoes
    }

    if (editingResultado.value) {
      await api.update(editingResultado.value.id, formData)
    } else {
      await api.create(formData)
    }
    
    resetForm()
    await fetchResultados()
  } catch (error) {
    console.error('Erro ao salvar resultado:', error)
  }
}

function startEdit(resultado: Resultado) {
  editingResultado.value = resultado
  form.value = {
    eventoId: resultado.eventoId,
    participanteId: resultado.participanteId,
    pontuacao: resultado.pontuacao.toString(),
    ranking: resultado.ranking.toString(),
    observacoes: resultado.observacoes || ''
  }
  
  // Scroll to form
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEdit() {
  editingResultado.value = null
  resetForm()
}

function resetForm() {
  form.value = {
    eventoId: '',
    participanteId: '',
    pontuacao: '',
    ranking: '',
    observacoes: ''
  }
  errors.value = {
    eventoId: '',
    participanteId: '',
    pontuacao: '',
    ranking: '',
    observacoes: ''
  }
}

async function confirmDelete(resultado: Resultado) {
  if (confirm(`Tem certeza que deseja excluir este resultado?`)) {
    try {
      await api.remove(resultado.id)
      await fetchResultados()
    } catch (error) {
      console.error('Erro ao excluir resultado:', error)
    }
  }
}

function getRankingClass(ranking: number): string {
  switch (ranking) {
    case 1:
      return 'bg-yellow-500 text-white' // Gold
    case 2:
      return 'bg-gray-400 text-white' // Silver
    case 3:
      return 'bg-orange-600 text-white' // Bronze
    default:
      return 'bg-gray-200 text-gray-700'
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

// Lifecycle
onMounted(fetchData)
</script>
