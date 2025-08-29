<template>
  <div class="p-8">
    <h1 class="text-3xl font-bold text-green-600 mb-4">✅ Teste Funcionando!</h1>
    <p class="text-lg mb-6">Se você está vendo isso, o roteamento do Nuxt está funcionando!</p>
    
    <div class="space-y-2">
      <p><strong>Servidor:</strong> http://localhost:3008</p>
      <p><strong>Página atual:</strong> /test</p>
      <p><strong>Status:</strong> <span class="text-green-600">OK</span></p>
    </div>

    <div class="mt-8">
      <h2 class="text-xl font-semibold mb-4">Links de Teste:</h2>
      <div class="grid gap-2">
        <NuxtLink to="/" class="text-blue-600 hover:underline">🏠 Home/Dashboard</NuxtLink>
        <NuxtLink to="/users" class="text-blue-600 hover:underline">👥 Users</NuxtLink>
        <NuxtLink to="/eventos" class="text-blue-600 hover:underline">🎯 Eventos</NuxtLink>
        <NuxtLink to="/participantes" class="text-blue-600 hover:underline">🏃 Participantes</NuxtLink>
        <NuxtLink to="/resultados" class="text-blue-600 hover:underline">🏆 Resultados</NuxtLink>
        <NuxtLink to="/mensalidades" class="text-blue-600 hover:underline">💳 Mensalidades</NuxtLink>
      </div>
    </div>
  </div>
</template>