<template>
  <div class="flex items-start">
    <div class="flex items-center h-5">
      <input
        :id="inputId"
        v-model="checked"
        :name="name"
        :disabled="disabled"
        type="checkbox"
        :class="checkboxClasses"
        :aria-describedby="error ? `${inputId}-error` : undefined"
        :aria-invalid="!!error"
      />
    </div>
    <div class="ml-3 text-sm">
      <label 
        :for="inputId" 
        :class="labelClasses"
      >
        {{ label }}
      </label>
      <p 
        v-if="description" 
        :class="descriptionClasses"
      >
        {{ description }}
      </p>
      <p
        v-if="error"
        :id="`${inputId}-error`"
        class="text-red-600 text-xs mt-1"
        role="alert"
      >
        {{ error }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: boolean
  label?: string
  description?: string
  name?: string
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const checked = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const inputId = `checkbox-${Math.random().toString(36).substring(2, 9)}`

const checkboxClasses = computed(() => [
  'w-4 h-4 rounded border-gray-300 text-blue-600',
  'focus:ring-blue-500 focus:ring-2 focus:ring-offset-2',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  props.error ? 'border-red-300' : 'border-gray-300'
].join(' '))

const labelClasses = computed(() => [
  'font-medium text-gray-700',
  props.disabled ? 'opacity-50' : '',
  'cursor-pointer'
].join(' '))

const descriptionClasses = computed(() => [
  'text-gray-500 mt-1',
  props.disabled ? 'opacity-50' : ''
].join(' '))
</script>