<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Participantes</h1>
    <form @submit.prevent="addParticipante" class="mb-4 flex gap-2">
      <input v-model="form.nome" placeholder="Nome" class="input input-bordered" required />
      <input v-model="form.email" placeholder="Email" class="input input-bordered" required />
      <input v-model="form.telefone" placeholder="Telefone" class="input input-bordered" required />
      <label class="flex items-center gap-2">
        <input type="checkbox" v-model="form.associado" /> Associado
      </label>
      <button class="btn btn-primary">Adicionar</button>
    </form>
    <table class="table w-full">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Email</th>
          <th>Telefone</th>
          <th>Associado</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in participantes" :key="p.id">
          <td>{{ p.nome }}</td>
          <td>{{ p.email }}</td>
          <td>{{ p.telefone }}</td>
          <td>{{ p.associado ? 'Sim' : 'Não' }}</td>
          <td>
            <button class="btn btn-xs btn-error" @click="deleteParticipante(p.id)">Excluir</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Participante } from '../../models/participante';
import { useApi } from '../../composables/useApi';
const participantes = ref<Participante[]>([]);
const form = ref({ nome: '', email: '', telefone: '', associado: false });
const api = useApi<Participante>('/api/participantes');
async function fetchParticipantes() {
  participantes.value = await api.getAll();
}
onMounted(fetchParticipantes);
async function addParticipante() {
  await api.create(form.value);
  form.value = { nome: '', email: '', telefone: '', associado: false };
  fetchParticipantes();
}
async function deleteParticipante(id: string) {
  await api.remove(id);
  fetchParticipantes();
}
</script>
