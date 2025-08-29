<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div 
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        @click="$emit('close')"
      ></div>

      <!-- Modal -->
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
        <!-- Header -->
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">
              {{ clube ? 'Editar Clube' : 'Novo Clube' }}
            </h3>
            <button
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSubmit">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Basic Info -->
              <div class="space-y-4">
                <h4 class="text-md font-medium text-gray-900 border-b pb-2">Informações Básicas</h4>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Nome do Clube *</label>
                  <input
                    v-model="form.nome"
                    type="text"
                    required
                    class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Clube de Tiro São Paulo"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">CNPJ *</label>
                  <input
                    v-model="form.cnpj"
                    type="text"
                    required
                    class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="00.000.000/0000-00"
                    @input="formatCNPJ"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">CR (Certificado de Registro) *</label>
                  <input
                    v-model="form.cr"
                    type="text"
                    required
                    class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="CR-001-2024"
                  >
                </div>
              </div>

              <!-- Address -->
              <div class="space-y-4">
                <h4 class="text-md font-medium text-gray-900 border-b pb-2">Endereço</h4>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">CEP *</label>
                  <input
                    v-model="form.endereco.cep"
                    type="text"
                    required
                    class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="00000-000"
                    @input="formatCEP"
                    @blur="searchCEP"
                  >
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Logradouro *</label>
                    <input
                      v-model="form.endereco.logradouro"
                      type="text"
                      required
                      class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Número *</label>
                    <input
                      v-model="form.endereco.numero"
                      type="text"
                      required
                      class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                  <input
                    v-model="form.endereco.complemento"
                    type="text"
                    class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Bairro *</label>
                    <input
                      v-model="form.endereco.bairro"
                      type="text"
                      required
                      class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
                    <input
                      v-model="form.endereco.cidade"
                      type="text"
                      required
                      class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                  <select
                    v-model="form.endereco.estado"
                    required
                    class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione o estado</option>
                    <option v-for="estado in estados" :key="estado" :value="estado">{{ estado }}</option>
                  </select>
                </div>
              </div>

              <!-- Contact Info -->
              <div class="space-y-4">
                <h4 class="text-md font-medium text-gray-900 border-b pb-2">Contato</h4>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Responsável *</label>
                  <input
                    v-model="form.contato.responsavel"
                    type="text"
                    required
                    class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    v-model="form.contato.email"
                    type="email"
                    required
                    class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                  <input
                    v-model="form.contato.telefone"
                    type="text"
                    required
                    class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(11) 99999-9999"
                    @input="formatTelefone"
                  >
                </div>
              </div>

              <!-- License Info -->
              <div class="space-y-4">
                <h4 class="text-md font-medium text-gray-900 border-b pb-2">Licença</h4>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Plano *</label>
                  <select
                    v-model="form.licenca.plano"
                    required
                    class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    @change="updatePlanPrice"
                  >
                    <option value="">Selecione o plano</option>
                    <option value="basico">Básico - R$ 299,90/mês</option>
                    <option value="intermediario">Intermediário - R$ 499,90/mês</option>
                    <option value="premium">Premium - R$ 799,90/mês</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Valor Mensal *</label>
                  <input
                    v-model="form.licenca.valorMensal"
                    type="number"
                    step="0.01"
                    required
                    class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento *</label>
                  <input
                    v-model="form.licenca.dataVencimento"
                    type="date"
                    required
                    class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                </div>

                <div v-if="clube">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Status da Licença</label>
                  <select
                    v-model="form.licenca.status"
                    class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="ativa">Ativa</option>
                    <option value="suspensa">Suspensa</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse mt-6">
              <button
                type="submit"
                :disabled="loading"
                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                <div v-if="loading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {{ clube ? 'Atualizar' : 'Criar' }} Clube
              </button>
              <button
                type="button"
                @click="$emit('close')"
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  clube: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

// State
const loading = ref(false)

const form = ref({
  nome: '',
  cnpj: '',
  cr: '',
  endereco: {
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  },
  contato: {
    responsavel: '',
    email: '',
    telefone: ''
  },
  licenca: {
    plano: '',
    valorMensal: 0,
    dataVencimento: '',
    status: 'pendente'
  }
})

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

// Methods
const formatCNPJ = () => {
  let value = form.value.cnpj.replace(/\D/g, '')
  if (value.length <= 14) {
    value = value.replace(/^(\d{2})(\d)/, '$1.$2')
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    value = value.replace(/\.(\d{3})(\d)/, '.$1/$2')
    value = value.replace(/(\d{4})(\d)/, '$1-$2')
    form.value.cnpj = value
  }
}

const formatCEP = () => {
  let value = form.value.endereco.cep.replace(/\D/g, '')
  if (value.length <= 8) {
    value = value.replace(/^(\d{5})(\d)/, '$1-$2')
    form.value.endereco.cep = value
  }
}

const formatTelefone = () => {
  let value = form.value.contato.telefone.replace(/\D/g, '')
  if (value.length <= 11) {
    value = value.replace(/^(\d{2})(\d)/, '($1) $2')
    value = value.replace(/(\d{4,5})(\d{4})$/, '$1-$2')
    form.value.contato.telefone = value
  }
}

const searchCEP = async () => {
  const cep = form.value.endereco.cep.replace(/\D/g, '')
  if (cep.length === 8) {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      
      if (!data.erro) {
        form.value.endereco.logradouro = data.logradouro || ''
        form.value.endereco.bairro = data.bairro || ''
        form.value.endereco.cidade = data.localidade || ''
        form.value.endereco.estado = data.uf || ''
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    }
  }
}

const updatePlanPrice = () => {
  const prices = {
    basico: 299.90,
    intermediario: 499.90,
    premium: 799.90
  }
  form.value.licenca.valorMensal = prices[form.value.licenca.plano] || 0
}

const handleSubmit = async () => {
  loading.value = true
  
  try {
    const url = props.clube 
      ? `/api/system/clubes/${props.clube.id}`
      : '/api/system/clubes'
    
    const method = props.clube ? 'PUT' : 'POST'
    
    const response = await $fetch(url, {
      method,
      body: form.value
    })
    
    if (response.success) {
      emit('save', response.data)
    } else {
      throw new Error(response.message || 'Erro ao salvar clube')
    }
  } catch (error) {
    console.error('Erro ao salvar clube:', error)
    alert(error.message || 'Erro ao salvar clube')
  } finally {
    loading.value = false
  }
}

// Initialize form with club data if editing
onMounted(() => {
  if (props.clube) {
    form.value = {
      ...form.value,
      ...props.clube,
      endereco: { ...form.value.endereco, ...props.clube.endereco },
      contato: { ...form.value.contato, ...props.clube.contato },
      licenca: { ...form.value.licenca, ...props.clube.licenca }
    }
  } else {
    // Set default expiration date to 1 year from now
    const nextYear = new Date()
    nextYear.setFullYear(nextYear.getFullYear() + 1)
    form.value.licenca.dataVencimento = nextYear.toISOString().split('T')[0]
  }
})
</script>