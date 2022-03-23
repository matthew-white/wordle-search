<script setup>
import { computed, ref } from 'vue';

import { last } from '../util/util';

const props = defineProps({
  guesses: {
    type: Array,
    required: true
  },
  statesCommitted: Boolean
});
defineEmits(['toggle-state', 'update:statesCommitted']);

const stateClasses = ['tbd', 'absent', 'present', 'correct'];
const disabled = (i) => props.statesCommitted || i < props.guesses.length - 1;
const statesSet = computed(() =>
  last(props.guesses).every(([, state]) => state !== 0));

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
      <template v-if="!disabled(i)">
        <button v-show="statesSet" type="button" class="btn btn-default"
          @click="$emit('update:statesCommitted', true)">
          Done
        </button>
      </template>
    </div>
  </div>
</template>

<style lang="scss">
#guess-list {
  margin-bottom: 30px;

  .letter {
    border: 0;
    display: inline-block;
    font-size: 35px;
    font-weight: bold;
    height: 42px;
    line-height: 1;
    padding: 0;
    text-align: center;
    text-transform: uppercase;
    user-select: none;
    width: 42px;

    + .letter { margin-left: 6px; }
  }

  .tbd {
    background-color: #111;
    border: 2px solid #666;
  }
  .absent { background-color: #444; }
  .present { background-color: #f0ad4e; }
  .correct { background-color: darken(#5cb85c, 6%); }

  .btn {
    margin-left: 20px;
    margin-top: 4px;
    vertical-align: top;
  }

  .guess + .guess { margin-top: 6px; }
}
</style>
