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
import type { Evento } from '../../models/evento'
import { useApi } from '../../composables/useApi'

// Data
const eventos = ref<Evento[]>([])
const editingEvento = ref<Evento | null>(null)
const api = useApi<Evento>('/api/eventos')

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

// Lifecycle
onMounted(fetchEventos)
</script>
