<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Gerenciar Participantes</h1>
      <p class="text-gray-600">Cadastre e gerencie os participantes do clube de tiro</p>
    </div>

    <!-- Add Participant Form -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">{{ editingParticipante ? 'Editar Participante' : 'Novo Participante' }}</h2>
      
      <form @submit.prevent="submitForm" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AppInput
            v-model="form.nome"
            label="Nome Completo"
            placeholder="Ex: João Silva"
            :error="errors.nome"
            required
          />
          
          <AppInput
            v-model="form.email"
            label="Email"
            type="email"
            placeholder="Ex: joao@email.com"
            :error="errors.email"
            required
          />
          
          <AppInput
            v-model="form.telefone"
            label="Telefone"
            placeholder="Ex: (11) 99999-9999"
            :error="errors.telefone"
            required
          />

          <div class="flex items-center pt-6">
            <AppCheckbox
              v-model="form.associado"
              label="É associado"
              description="Participante possui associação ao clube"
              :error="errors.associado"
            />
          </div>
        </div>

        <div class="flex gap-3 pt-4">
          <AppButton
            type="submit"
            :loading="api.loading.value"
            variant="primary"
          >
            {{ editingParticipante ? 'Atualizar' : 'Cadastrar Participante' }}
          </AppButton>
          
          <AppButton
            v-if="editingParticipante"
            type="button"
            variant="secondary"
            @click="cancelEdit"
          >
            Cancelar
          </AppButton>
        </div>
      </form>
    </div>

    <!-- Participants Table -->
    <div class="bg-white rounded-lg shadow-md">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-xl font-semibold">Participantes Cadastrados</h2>
      </div>
      
      <AppTable
        :loading="api.loading.value"
        :headers="tableHeaders"
        :items="participantes"
        :empty-message="'Nenhum participante encontrado'"
      >
        <template #associado="{ item }">
          <span :class="item.associado ? 'text-green-600 font-medium' : 'text-gray-500'">
            {{ item.associado ? 'Associado' : 'Não associado' }}
          </span>
        </template>
        
        <template #eventosInscritos="{ item }">
          <span class="text-sm text-gray-600">
            {{ item.eventosInscritos.length }} eventos
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
import { ref, onMounted } from 'vue'
import type { Participante } from '../../models/participante'
import { useApi } from '../../composables/useApi'

// Data
const participantes = ref<Participante[]>([])
const editingParticipante = ref<Participante | null>(null)
const api = useApi<Participante>('/api/participantes')

// Form
const form = ref({
  nome: '',
  email: '',
  telefone: '',
  associado: false
})

const errors = ref({
  nome: '',
  email: '',
  telefone: '',
  associado: ''
})

const tableHeaders = [
  { key: 'nome', label: 'Nome' },
  { key: 'email', label: 'Email' },
  { key: 'telefone', label: 'Telefone' },
  { key: 'associado', label: 'Status' },
  { key: 'eventosInscritos', label: 'Eventos' },
  { key: 'actions', label: 'Ações', sortable: false }
]

// Methods
async function fetchParticipantes() {
  try {
    participantes.value = await api.getAll()
  } catch (error) {
    console.error('Erro ao carregar participantes:', error)
  }
}

function validateForm(): boolean {
  errors.value = {
    nome: '',
    email: '',
    telefone: '',
    associado: ''
  }

  let isValid = true

  if (!form.value.nome.trim()) {
    errors.value.nome = 'Nome é obrigatório'
    isValid = false
  }

  if (!form.value.email.trim()) {
    errors.value.email = 'Email é obrigatório'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Email deve ter um formato válido'
    isValid = false
  }

  if (!form.value.telefone.trim()) {
    errors.value.telefone = 'Telefone é obrigatório'
    isValid = false
  }

  return isValid
}

async function submitForm() {
  if (!validateForm()) return

  try {
    if (editingParticipante.value) {
      await api.update(editingParticipante.value.id, form.value)
    } else {
      await api.create(form.value)
    }
    
    resetForm()
    await fetchParticipantes()
  } catch (error) {
    console.error('Erro ao salvar participante:', error)
  }
}

function startEdit(participante: Participante) {
  editingParticipante.value = participante
  form.value = {
    nome: participante.nome,
    email: participante.email,
    telefone: participante.telefone,
    associado: participante.associado
  }
  
  // Scroll to form
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEdit() {
  editingParticipante.value = null
  resetForm()
}

function resetForm() {
  form.value = {
    nome: '',
    email: '',
    telefone: '',
    associado: false
  }
  errors.value = {
    nome: '',
    email: '',
    telefone: '',
    associado: ''
  }
}

async function confirmDelete(participante: Participante) {
  if (confirm(`Tem certeza que deseja excluir o participante "${participante.nome}"?`)) {
    try {
      await api.remove(participante.id)
      await fetchParticipantes()
    } catch (error) {
      console.error('Erro ao excluir participante:', error)
    }
  }
}

// Lifecycle
onMounted(fetchParticipantes)
</script>
