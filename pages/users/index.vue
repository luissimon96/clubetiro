<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Usuários</h1>
    <form @submit.prevent="addUser" class="mb-4 flex gap-2">
      <input v-model="form.nome" placeholder="Nome" class="input input-bordered" required />
      <input v-model="form.email" placeholder="Email" class="input input-bordered" required />
      <input v-model="form.senha" placeholder="Senha" type="password" class="input input-bordered" required />
      <button class="btn btn-primary">Adicionar</button>
    </form>
    <table class="table w-full">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Email</th>
          <th>Tipo</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.nome }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.tipo }}</td>
          <td>
            <button class="btn btn-xs btn-error" @click="deleteUser(user.id)">Excluir</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { User } from '../../models/user';
import { useApi } from '../../composables/useApi';
const users = ref<User[]>([]);
const form = ref({ nome: '', email: '', senha: '' });
const api = useApi<User>('/api/users');
async function fetchUsers() {
  users.value = await api.getAll();
}
onMounted(fetchUsers);
async function addUser() {
  await api.create(form.value);
  form.value = { nome: '', email: '', senha: '' };
  fetchUsers();
}
async function deleteUser(id: string) {
  await api.remove(id);
  fetchUsers();
}
</script>
