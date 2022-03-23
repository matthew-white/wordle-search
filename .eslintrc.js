module.exports = {
  root: true,
  extends: ['plugin:vue/vue3-essential', '@vue/airbnb'],
  env: { node: true },
  globals: {
    defineEmits: 'readonly',
    defineExpose: 'readonly',
    defineProps: 'readonly',
  },
  parserOptions: { ecmaVersion: 2020 },
  rules: {
    'arrow-parens': 'off',
    'comma-dangle': 'off',
    curly: 'off',
    'implicit-arrow-linebreak': 'off',
    'import/first': 'off',
    'import/order': 'off',
    'no-console': 'error',
    'no-debugger': 'error',
    'no-restricted-syntax': 'off',
    'nonblock-statement-body-position': 'off',
    'object-curly-newline': 'off',
    'operator-linebreak': 'off'
  }
};
