<template>
  <div class="p-8 text-center">
    <h1 class="text-3xl font-bold mb-4">Bem-vindo ao Clube de Tiro</h1>
    <p class="mb-6">Escolha uma das opções do menu ou acesse diretamente:</p>
    <ul class="flex flex-col gap-2 items-center">
      <li><NuxtLink to="/users" class="text-blue-600 underline">Usuários</NuxtLink></li>
      <li><NuxtLink to="/eventos" class="text-blue-600 underline">Eventos</NuxtLink></li>
      <li><NuxtLink to="/participantes" class="text-blue-600 underline">Participantes</NuxtLink></li>
      <li><NuxtLink to="/resultados" class="text-blue-600 underline">Resultados</NuxtLink></li>
      <li><NuxtLink to="/mensalidades" class="text-blue-600 underline">Mensalidades</NuxtLink></li>
    </ul>
  </div>
</template>
