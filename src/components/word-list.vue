<script setup>
import { computed } from 'vue';

import { pluralize } from '../util/util';

const props = defineProps({
  words: {
    type: Array,
    required: true
  }
});
const emit = defineEmits(['guess']);

const wordsToShow = computed(() => (props.words.length <= 850
  ? props.words
  : props.words.slice(0, 800)));
const guessWord = ({ target }) => {
  if (target.classList.contains('word')) emit('guess', target.textContent);
};
</script>

<template>
  <div id="word-list">
    <p id="word-list-count">{{ pluralize('word', words.length, true) }}</p>
    <div @click="guessWord">
      <span v-for="word of wordsToShow" :key="word" class="word-space">
        <span class="word">{{ word }}</span>
        <span class="space">{{ ' ' }}</span>
      </span>
      <span v-if="wordsToShow.length !== words.length"
        id="word-list-truncation-message">
        … and {{ pluralize('other', words.length - wordsToShow.length, true) }}
      </span>
    </div>
  </div>
</template>

<style lang="scss">
#word-list-count {
  font-size: 20px;
  font-weight: 500;
}

#word-list {
  .word {
    cursor: pointer;
    text-transform: uppercase;
  }

  .space { margin-right: 10px; }
  .word-space:last-child .space { display: none; }
}

#word-list-truncation-message {
  margin-left: -3px;
  white-space: nowrap;
}
</style>
