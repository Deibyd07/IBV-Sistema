<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const { $supabase } = useNuxtApp()

const email = ref('')
const password = ref('')
const error = ref('')
const success = ref('')
const router = useRouter()

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
    // Llamada al backend para crear el usuario en la tabla usuarios
    await fetch('http://localhost:8000/api/users/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        first_name: '',
        last_name: '',
        role: 'cliente',
        password: 'supabase-auth',
      }),
    })
    success.value = '¡Registro exitoso! Revisa tu correo para confirmar.'
    setTimeout(() => router.push('/login'), 2000)
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-[#0d111a]">
    <form
      class="w-full max-w-md bg-[#10141c] p-8 rounded-lg border border-white/[0.08] shadow-lg shadow-black/40 space-y-6"
      @submit.prevent="register"
    >
      <h2 class="font-display text-2xl uppercase tracking-tight text-zinc-100 mb-4">
        Crear cuenta
      </h2>
      <div>
        <label class="block font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">
          Correo electrónico
        </label>
        <input
          v-model="email"
          type="email"
          required
          class="ibv-input"
          placeholder="nombre@empresa.com"
        />
      </div>
      <div>
        <label class="block font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">
          Contraseña
        </label>
        <input
          v-model="password"
          type="password"
          required
          class="ibv-input"
          placeholder="••••••••"
        />
      </div>
      <button
        type="submit"
        class="w-full bg-amber-400 hover:bg-amber-300 text-black font-semibold py-3 px-4 rounded-md transition-all"
      >
        Registrarse
      </button>
      <div v-if="error" class="text-red-300 text-sm">{{ error }}</div>
      <div v-if="success" class="text-emerald-300 text-sm">{{ success }}</div>
      <p class="text-center text-sm text-zinc-600 mt-4">
        ¿Ya tienes cuenta?
        <NuxtLink to="/login" class="text-amber-300 hover:underline">Inicia sesión</NuxtLink>
      </p>
    </form>
  </div>
</template>
