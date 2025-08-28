<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Resultados</h1>
    <form @submit.prevent="addResultado" class="mb-4 flex gap-2">
      <input v-model="form.eventoId" placeholder="Evento ID" class="input input-bordered" required />
      <input v-model="form.participanteId" placeholder="Participante ID" class="input input-bordered" required />
      <input v-model="form.pontuacao" placeholder="Pontuação" type="number" class="input input-bordered" required />
      <input v-model="form.ranking" placeholder="Ranking" type="number" class="input input-bordered" required />
      <input v-model="form.observacoes" placeholder="Observações" class="input input-bordered" />
      <button class="btn btn-primary">Adicionar</button>
    </form>
    <table class="table w-full">
      <thead>
        <tr>
          <th>Evento</th>
          <th>Participante</th>
          <th>Pontuação</th>
          <th>Ranking</th>
          <th>Observações</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in resultados" :key="r.id">
          <td>{{ r.eventoId }}</td>
          <td>{{ r.participanteId }}</td>
          <td>{{ r.pontuacao }}</td>
          <td>{{ r.ranking }}</td>
          <td>{{ r.observacoes }}</td>
          <td>
            <button class="btn btn-xs btn-error" @click="deleteResultado(r.id)">Excluir</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Resultado } from '../../models/resultado';
import { useApi } from '../../composables/useApi';
const resultados = ref<Resultado[]>([]);
const form = ref({ eventoId: '', participanteId: '', pontuacao: 0, ranking: 0, observacoes: '' });
const api = useApi<Resultado>('/api/resultados');
async function fetchResultados() {
  resultados.value = await api.getAll();
}
onMounted(fetchResultados);
async function addResultado() {
  await api.create(form.value);
  form.value = { eventoId: '', participanteId: '', pontuacao: 0, ranking: 0, observacoes: '' };
  fetchResultados();
}
async function deleteResultado(id: string) {
  await api.remove(id);
  fetchResultados();
}
</script>
