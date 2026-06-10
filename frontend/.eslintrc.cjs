module.exports = {
    root: true,
    env: {
        browser: true,
        node: true,
        es2021: true,
    },
    globals: {
        // Nuxt auto-imports
        definePageMeta: 'readonly',
        navigateTo: 'readonly',
        useRoute: 'readonly',
        useRouter: 'readonly',
        useNuxtApp: 'readonly',
        useState: 'readonly',
        useFetch: 'readonly',
        useAsyncData: 'readonly',
        useLazyAsyncData: 'readonly',
        useHead: 'readonly',
        useRuntimeConfig: 'readonly',
        useCookie: 'readonly',
        useRequestHeaders: 'readonly',
        useRequestEvent: 'readonly',
        useRequestFetch: 'readonly',
        ref: 'readonly',
        computed: 'readonly',
        watch: 'readonly',
        onMounted: 'readonly',
        onBeforeUnmount: 'readonly',
        nextTick: 'readonly',
    },
    parser: 'vue-eslint-parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        parser: '@typescript-eslint/parser',
    },
    extends: [
        'eslint:recommended',
        'plugin:vue/vue3-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:nuxt/recommended',
        'prettier',
    ],
    plugins: ['vue', '@typescript-eslint'],
    rules: {
        // Vue rules
        'vue/multi-word-component-names': 'off',
        'vue/no-v-html': 'warn',
        'vue/require-default-prop': 'off',
        'vue/require-explicit-emits': 'warn',
        'vue/component-tags-order': [
            'error',
            {
                order: ['script', 'template', 'style'],
            },
        ],

        // TypeScript rules
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': [
            'warn',
            {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            },
        ],

        // General rules
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'prefer-const': 'error',
        'no-var': 'error',
        'no-undef': 'off', // Desactivado porque Nuxt tiene auto-imports
    },
    ignorePatterns: [
        'node_modules/',
        '.nuxt/',
        '.output/',
        'dist/',
        '*.config.js',
        '*.config.ts',
    ],
}
