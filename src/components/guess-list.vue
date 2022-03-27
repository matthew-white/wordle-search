<script setup>
import { ref } from 'vue';

const props = defineProps({
  guesses: {
    type: Array,
    required: true
  },
  statesCommitted: Boolean
});
defineEmits(['toggle-state', 'update:statesCommitted']);

const stateClasses = ['absent', 'present', 'correct'];
const disabled = (i) => props.statesCommitted || i < props.guesses.length - 1;

const el = ref(null);
const focus = () => {
  el.value.querySelector('.guess:last-child .letter').focus();
};

defineExpose({ focus });
</script>

<template>
  <div id="guess-list" ref="el">
    <p v-show="!statesCommitted" class="instruction-block">Click each letter to set its color.</p>
    <!-- eslint-disable-next-line vue/require-v-for-key -->
    <div v-for="(guess, i) in guesses" class="guess">
      <!-- eslint-disable-next-line vue/require-v-for-key -->
      <button v-for="([letter, state], j) in guess" type="button" class="letter"
        :class="stateClasses[state]" :disabled="disabled(i)"
        @click="$emit('toggle-state', i, j)">
        <span>{{ letter }}</span>
      </button>
      <button v-if="!disabled(i)" type="button" class="btn btn-default"
        @click="$emit('update:statesCommitted', true)">
        Done
      </button>
    </div>
  </div>
</template>

<style lang="scss">
#guess-list {
  margin-bottom: 30px;

  .letter {
    border: 0;
    font-size: 36px;
    font-weight: bold;
    height: 43px;
    line-height: 1;
    padding: 0;
    text-transform: uppercase;
    user-select: none;
    width: 43px;

    + .letter { margin-left: 6px; }
  }

  .absent { background-color: #444; }
  .present { background-color: #f0ad4e; }
  .correct { background-color: darken(#5cb85c, 6%); }

  .btn {
    margin-left: 20px;
    margin-top: 5px;
    vertical-align: top;
  }

  .guess + .guess { margin-top: 6px; }
}
</style>
