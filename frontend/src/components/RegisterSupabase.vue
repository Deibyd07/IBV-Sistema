<script setup lang="ts">
import { ref } from 'vue'

const { $supabase } = useNuxtApp()

const email = ref('')
const password = ref('')
const error = ref('')
const success = ref('')

const register = async () => {
  error.value = ''
  success.value = ''
  const { error: registerError } = await $supabase.auth.signUp({
    email: email.value,
    password: password.value,
  })
  if (registerError) {
    error.value = registerError.message
  } else {
    success.value = '¡Registro exitoso! Revisa tu correo para confirmar.'
  }
}
</script>

<template>
  <div>
    <form @submit.prevent="register">
      <input v-model="email" type="email" placeholder="Correo" required />
      <input v-model="password" type="password" placeholder="Contraseña" required />
      <button type="submit">Registrarse</button>
      <div v-if="error">{{ error }}</div>
    </form>
  </div>
</template>
