<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Mensalidades</h1>
    <form @submit.prevent="addMensalidade" class="mb-4 flex gap-2">
      <input v-model="form.participanteId" placeholder="Participante ID" class="input input-bordered" required />
      <select v-model="form.tipoPlano" class="input input-bordered" required>
        <option value="mensal">Mensal</option>
        <option value="trimestral">Trimestral</option>
        <option value="semestral">Semestral</option>
        <option value="anual">Anual</option>
      </select>
      <input v-model="form.valor" placeholder="Valor" type="number" class="input input-bordered" required />
      <input v-model="form.dataInicio" placeholder="Data Início" type="date" class="input input-bordered" required />
      <input v-model="form.dataFim" placeholder="Data Fim" type="date" class="input input-bordered" required />
      <select v-model="form.status" class="input input-bordered" required>
        <option value="ativa">Ativa</option>
        <option value="inativa">Inativa</option>
      </select>
      <button class="btn btn-primary">Adicionar</button>
    </form>
    <table class="table w-full">
      <thead>
        <tr>
          <th>Participante</th>
          <th>Plano</th>
          <th>Valor</th>
          <th>Início</th>
          <th>Fim</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in mensalidades" :key="m.id">
          <td>{{ m.participanteId }}</td>
          <td>{{ m.tipoPlano }}</td>
          <td>{{ m.valor }}</td>
          <td>{{ m.dataInicio }}</td>
          <td>{{ m.dataFim }}</td>
          <td>{{ m.status }}</td>
          <td>
            <button class="btn btn-xs btn-error" @click="deleteMensalidade(m.id)">Excluir</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Mensalidade } from '~/models/mensalidade';

const mensalidades = ref<Mensalidade[]>([]);
const form = ref<Omit<Mensalidade, 'id'>>({ participanteId: '', tipoPlano: 'mensal', valor: 100, dataInicio: '', dataFim: '', status: 'ativa' });
const api = useApi<Mensalidade>('/api/mensalidades');
async function fetchMensalidades() {
  mensalidades.value = await api.getAll();
}
onMounted(fetchMensalidades);
async function addMensalidade() {
  await api.create(form.value);
  form.value = { participanteId: '', tipoPlano: 'mensal', valor: 100, dataInicio: '', dataFim: '', status: 'ativa' }; // Reseta o formulário
  fetchMensalidades();
}
async function deleteMensalidade(id: string) {
  await api.remove(id);
  fetchMensalidades();
}
</script>
