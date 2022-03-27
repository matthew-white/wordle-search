<script setup>
import { ref } from 'vue';

import InputLettersOnly from './input-letters-only.vue';

const emit = defineEmits(['guess']);

const guess = ref('');
const first = ref(true);
const input = ref(null);
const reset = () => { guess.value = ''; };
const submit = () => {
  if (guess.value.length === 5) {
    emit('guess', guess.value);
    guess.value = '';
    first.value = false;
  } else {
    input.value.setCustomValidity('Please enter a 5-letter word.');
    input.value.reportValidity();
  }
};

defineExpose({ reset });
</script>

<template>
  <form id="guess-form" :class="first ? 'first-guess' : null"
    @submit.prevent="submit">
    <div class="form-group">
      <label for="guess-form-guess" class="instruction-block">
        {{ first ? 'What was your guess?' : 'Once you’ve made your next guess, type it here.' }}
      </label>
      <InputLettersOnly id="guess-form-guess" ref="input" v-model="guess"
        placeholder="5-letter word" maxlength="5" autofocus/>
    </div>
  </form>
</template>

<style lang="scss">
#guess-form {
  margin-bottom: 30px;

  &:not(.first-guess) label {
    font-size: 22px;
    margin-bottom: 12px;
  }
}

#guess-form-guess {
  font-size: 22px;
  height: 42px;
  width: 234px;

  &::placeholder { font-size: 20px; }
}
</style>
