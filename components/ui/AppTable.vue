<template>
  <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
    <div v-if="loading" class="flex items-center justify-center py-12">
      <svg class="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span class="ml-2 text-gray-600">Carregando...</span>
    </div>
    
    <table v-else class="min-w-full divide-y divide-gray-300">
      <thead class="bg-gray-50">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            {{ column.label }}
          </th>
          <th v-if="showActions" scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Ações
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-if="data.length === 0">
          <td :colspan="columns.length + (showActions ? 1 : 0)" class="px-6 py-12 text-center text-gray-500">
            <div class="flex flex-col items-center">
              <svg class="h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <p class="text-lg font-medium">Nenhum registro encontrado</p>
            </div>
          </td>
        </tr>
        <tr v-else v-for="(item, index) in data" :key="item.id || index" class="hover:bg-gray-50">
          <td
            v-for="column in columns"
            :key="column.key"
            class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
          >
            <slot :name="`cell-${column.key}`" :item="item" :value="item[column.key]">
              {{ formatCellValue(item[column.key], column.type) }}
            </slot>
          </td>
          <td v-if="showActions" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            <div class="flex space-x-2">
              <slot name="actions" :item="item" :index="index">
                <AppButton
                  variant="danger"
                  size="sm"
                  @click="$emit('delete', item.id)"
                >
                  Excluir
                </AppButton>
              </slot>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
interface Column {
  key: string
  label: string
  type?: 'text' | 'date' | 'boolean' | 'number'
}

interface Props {
  data: any[]
  columns: Column[]
  loading?: boolean
  showActions?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false,
  showActions: true
})

defineEmits<{
  delete: [id: string]
}>()

function formatCellValue(value: any, type?: string): string {
  if (value === null || value === undefined) return '-'
  
  switch (type) {
    case 'boolean':
      return value ? 'Sim' : 'Não'
    case 'date':
      return new Date(value).toLocaleDateString('pt-BR')
    case 'number':
      return value.toLocaleString('pt-BR')
    default:
      return String(value)
  }
}
</script>