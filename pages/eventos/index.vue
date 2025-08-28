<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Eventos</h1>
    <form @submit.prevent="addEvento" class="mb-4 flex gap-2">
      <input v-model="form.nome" placeholder="Nome" class="input input-bordered" required />
      <input v-model="form.data" placeholder="Data" type="date" class="input input-bordered" required />
      <input v-model="form.local" placeholder="Local" class="input input-bordered" required />
      <input v-model="form.descricao" placeholder="Descrição" class="input input-bordered" required />
      <button class="btn btn-primary">Adicionar</button>
    </form>
    <table class="table w-full">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Data</th>
          <th>Local</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="evento in eventos" :key="evento.id">
          <td>{{ evento.nome }}</td>
          <td>{{ evento.data }}</td>
          <td>{{ evento.local }}</td>
          <td>{{ evento.status }}</td>
          <td>
            <button class="btn btn-xs btn-error" @click="deleteEvento(evento.id)">Excluir</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Evento } from '../../models/evento';
import { useApi } from '../../composables/useApi';
const eventos = ref<Evento[]>([]);
const form = ref({ nome: '', data: '', local: '', descricao: '' });
const api = useApi<Evento>('/api/eventos');
async function fetchEventos() {
  eventos.value = await api.getAll();
}
onMounted(fetchEventos);
async function addEvento() {
  await api.create(form.value);
  form.value = { nome: '', data: '', local: '', descricao: '' };
  fetchEventos();
}
async function deleteEvento(id: string) {
  await api.remove(id);
  fetchEventos();
}
</script>
