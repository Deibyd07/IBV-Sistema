<script setup lang="ts">
import { ref } from 'vue'

const { $supabase } = useNuxtApp()

const email = ref('')
const password = ref('')
const error = ref('')

const login = async () => {
  error.value = ''
  const { error: loginError } = await $supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })
  if (loginError) {
    error.value = loginError.message
  } else {
    // Usuario autenticado, puedes redirigir o guardar el token
    alert('¡Login exitoso!')
  }
}
</script>

<template>
  <div>
    <form @submit.prevent="login">
      <input v-model="email" type="email" placeholder="Correo" required />
      <input v-model="password" type="password" placeholder="Contraseña" required />
      <button type="submit">Iniciar sesión</button>
      <div v-if="error">{{ error }}</div>
    </form>
  </div>
</template>
