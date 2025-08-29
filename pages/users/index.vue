<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Usuários</h1>
        <p class="mt-1 text-sm text-gray-600">
          Gerencie os usuários do sistema
        </p>
      </div>
      <AppButton
        @click="showForm = !showForm"
        variant="primary"
        class="flex items-center space-x-2"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
        </svg>
        <span>Novo Usuário</span>
      </AppButton>
    </div>

    <!-- Form -->
    <div v-show="showForm" class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-medium text-gray-900 mb-4">
        {{ editingUser ? 'Editar Usuário' : 'Novo Usuário' }}
      </h2>
      
      <form @submit.prevent="submitForm" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AppInput
            v-model="form.nome"
            label="Nome"
            placeholder="Digite o nome completo"
            required
            :error="formErrors.nome"
          />
          
          <AppInput
            v-model="form.email"
            type="email"
            label="Email"
            placeholder="usuario@exemplo.com"
            required
            :error="formErrors.email"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AppInput
            v-model="form.senha"
            type="password"
            label="Senha"
            placeholder="Digite uma senha segura"
            :required="!editingUser"
            :error="formErrors.senha"
          />
          
          <AppSelect
            v-model="form.tipo"
            label="Tipo de Usuário"
            :options="[
              { value: 'comum', label: 'Comum' },
              { value: 'admin', label: 'Administrador' }
            ]"
            required
          />
        </div>

        <!-- Member Status Section -->
        <div class="border-t pt-4">
          <h3 class="text-md font-medium text-gray-900 mb-4">Status de Associação</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex items-center space-x-3">
              <input
                id="associado"
                v-model="form.associado"
                type="checkbox"
                class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label for="associado" class="text-sm font-medium text-gray-700">
                É associado do clube
              </label>
            </div>
            
            <AppInput
              v-model="form.telefone"
              label="Telefone"
              placeholder="(11) 99999-9999"
              :error="formErrors.telefone"
            />
          </div>
          
          <div v-if="form.associado" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <AppInput
              v-model="form.dataAssociacao"
              type="date"
              label="Data de Associação"
              :error="formErrors.dataAssociacao"
            />
            
            <AppSelect
              v-model="form.statusAssociacao"
              label="Status da Associação"
              :options="[
                { value: 'ativo', label: 'Ativo' },
                { value: 'inativo', label: 'Inativo' },
                { value: 'suspenso', label: 'Suspenso' }
              ]"
            />
          </div>
        </div>

        <div class="flex justify-end space-x-3">
          <AppButton
            type="button"
            variant="secondary"
            @click="cancelForm"
          >
            Cancelar
          </AppButton>
          <AppButton
            type="submit"
            variant="primary"
            :loading="api.loading.value"
          >
            {{ editingUser ? 'Atualizar' : 'Criar' }}
          </AppButton>
        </div>
      </form>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-lg shadow">
      <AppTable
        :data="users"
        :columns="tableColumns"
        :loading="api.loading.value"
        @delete="confirmDelete"
      >
        <template #cell-tipo="{ value }">
          <span
            :class="[
              'px-2 py-1 text-xs font-medium rounded-full',
              value === 'admin'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-gray-100 text-gray-800'
            ]"
          >
            {{ value === 'admin' ? 'Administrador' : 'Comum' }}
          </span>
        </template>
        
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
        
        <template #cell-dataCadastro="{ value }">
          {{ formatDate(value) }}
        </template>

        <template #actions="{ item }">
          <div class="flex space-x-2">
            <AppButton
              size="sm"
              variant="secondary"
              @click="editUser(item)"
            >
              Editar
            </AppButton>
            <AppButton
              size="sm"
              variant="danger"
              @click="confirmDelete(item.id)"
            >
              Excluir
            </AppButton>
          </div>
        </template>
      </AppTable>
    </div>

    <!-- Error Alert -->
    <div v-if="api.error.value" class="bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex">
        <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
        <div class="ml-3">
          <p class="text-sm text-red-800">{{ api.error.value }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User } from '~/models/user'

// Page meta
definePageMeta({
  title: 'Usuários - Clube de Tiro'
})

// Reactive state
const users = ref<User[]>([])
const showForm = ref(false)
const editingUser = ref<User | null>(null)

const form = reactive({
  nome: '',
  email: '',
  senha: '',
  tipo: 'comum' as 'admin' | 'comum',
  associado: false,
  telefone: '',
  dataAssociacao: '',
  statusAssociacao: 'ativo' as 'ativo' | 'inativo' | 'suspenso'
})

const formErrors = reactive({
  nome: '',
  email: '',
  senha: '',
  telefone: '',
  dataAssociacao: ''
})

// Table configuration
const tableColumns = [
  { key: 'nome', label: 'Nome' },
  { key: 'email', label: 'Email' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'associado', label: 'Associado' },
  { key: 'dataCadastro', label: 'Data Cadastro', type: 'date' }
]

// API composable
const api = useApi<User>('/api/users')

// Methods
async function fetchUsers() {
  try {
    users.value = await api.getAll()
  } catch (error) {
    console.error('Error fetching users:', error)
  }
}

function resetForm() {
  Object.assign(form, {
    nome: '',
    email: '',
    senha: '',
    tipo: 'comum',
    associado: false,
    telefone: '',
    dataAssociacao: '',
    statusAssociacao: 'ativo'
  })
  Object.assign(formErrors, {
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    dataAssociacao: ''
  })
  editingUser.value = null
}

function validateForm() {
  let isValid = true
  
  // Reset errors
  Object.assign(formErrors, {
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    dataAssociacao: ''
  })

  if (!form.nome.trim()) {
    formErrors.nome = 'Nome é obrigatório'
    isValid = false
  }

  if (!form.email.trim()) {
    formErrors.email = 'Email é obrigatório'
    isValid = false
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    formErrors.email = 'Email inválido'
    isValid = false
  }

  if (!editingUser.value && !form.senha.trim()) {
    formErrors.senha = 'Senha é obrigatória'
    isValid = false
  } else if (form.senha && form.senha.length < 6) {
    formErrors.senha = 'Senha deve ter pelo menos 6 caracteres'
    isValid = false
  }

  return isValid
}

async function submitForm() {
  if (!validateForm()) return

  try {
    if (editingUser.value) {
      await api.update(editingUser.value.id, form)
    } else {
      await api.create(form)
    }
    
    await fetchUsers()
    cancelForm()
  } catch (error) {
    console.error('Error submitting form:', error)
  }
}

function editUser(user: User) {
  editingUser.value = user
  Object.assign(form, {
    nome: user.nome,
    email: user.email,
    senha: '',
    tipo: user.tipo,
    associado: user.associado || false,
    telefone: user.telefone || '',
    dataAssociacao: user.dataAssociacao || '',
    statusAssociacao: user.statusAssociacao || 'ativo'
  })
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  resetForm()
}

async function confirmDelete(id: string) {
  if (confirm('Tem certeza que deseja excluir este usuário?')) {
    try {
      await api.remove(id)
      await fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }
}

function formatDate(dateString: string) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('pt-BR')
}

// Load data on mount
onMounted(fetchUsers)
</script>
