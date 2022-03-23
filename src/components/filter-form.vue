<script>
import common from '../../data/processed/common.json';
import repeating from '../../data/processed/repeating.json';
import wordList from '../../data/processed/word-list.json';

const commonSet = new Set(common);
const repeatingSet = new Set(repeating);
</script>

<script setup>
import { computed, ref, watchPostEffect } from 'vue';

import InputLettersOnly from './input-letters-only.vue';

import { last } from '../util/util';

const props = defineProps({
  guesses: {
    type: Array,
    required: true
  }
});
const emit = defineEmits(['filter']);

const match = ref('matchAll');
const contain = ref('');
const notContain = ref('');
const vowelCount = ref('');
const startWith = ref('');
const endWith = ref('');
const letter1 = ref('');
const letter2 = ref('');
const letter3 = ref('');
const pattern = ref('');
const excludeUncommon = ref(false);
const excludeRepeating = ref(false);

const stateLetters = computed(() => {
  const result = [null, new Set(), new Map(), new Map()];
  for (const guess of props.guesses) {
    for (let i = 0; i < 5; i += 1) {
      const [letter, state] = guess[i];
      if (state === 1) {
        result[1].add(letter);
      } else {
        const map = result[state];
        if (!map.has(letter)) map.set(letter, []);
        const indexes = map.get(letter);
        if (!indexes.includes(i)) indexes.push(i);
      }
    }
  }
  return result;
});
const matchers = {
  matchAbsent: (word) =>
    word.split('').every(letter => !stateLetters.value[1].has(letter)),
  matchPresent: (word) => {
    for (const [letter, indexes] of stateLetters.value[2].entries()) {
      if (!word.includes(letter) || indexes.some(i => word[i] === letter))
        return false;
    }
    return true;
  },
  matchCorrect: (word) => {
    for (const [letter, indexes] of stateLetters.value[3].entries()) {
      if (indexes.some(i => word[i] !== letter)) return false;
    }
    return true;
  },
  matchNoCorrect: (word) => {
    for (const [letter, indexes] of stateLetters.value[3].entries()) {
      if (indexes.some(i => word[i] === letter)) return false;
    }
    return true;
  },
  matchAll: (word) => matchers.matchAbsent(word) &&
    matchers.matchPresent(word) && matchers.matchCorrect(word),
  withoutCorrect: (word) => matchers.matchAbsent(word) &&
    matchers.matchPresent(word) && matchers.matchNoCorrect(word),
  allNew: (word) => word.split('').every(letter =>
    !stateLetters.value[1].has(letter) && !stateLetters.value[2].has(letter) &&
    !stateLetters.value[3].has(letter))
};

const presentNotCorrect = computed(() => {
  const result = new Map(stateLetters.value[2]);
  for (const letter of stateLetters.value[3].keys())
    result.delete(letter);
  return result;
});
const matchPresentCount = (countToMatch) => (word) => {
  if (!matchers.matchAbsent(word) || !matchers.matchNoCorrect(word))
    return false;

  let count = 0;
  for (const [letter, indexes] of presentNotCorrect.value.entries()) {
    if (word.includes(letter)) {
      if (indexes.some(i => word[i] === letter)) return false;
      count += 1;
      if (count > countToMatch) return false;
    }
  }
  return count === countToMatch;
};
matchers.matchPresent1 = matchPresentCount(1);
matchers.matchPresent2 = matchPresentCount(2);

const filters = [
  computed(() => matchers[match.value]),
  computed(() => (!excludeRepeating.value
    ? null
    : (word) => !repeatingSet.has(word))),
  computed(() => (!excludeUncommon.value
    ? null
    : (word) => commonSet.has(word))),
  computed(() => {
    if (contain.value === '') return null;
    const split = contain.value.split('');
    return (word) => split.every(letter => word.includes(letter));
  }),
  computed(() => {
    if (notContain.value === '') return null;
    const split = notContain.value.split('');
    return (word) => split.every(letter => !word.includes(letter));
  }),
  computed(() => {
    if (vowelCount.value === '') return null;
    const vowelNumber = Number.parseInt(vowelCount.value, 10);
    return (word) => {
      let count = 0;
      for (let i = 0; i < 5; i += 1) {
        if ('aeiouy'.includes(word[i])) {
          count += 1;
          if (count > vowelNumber) return false;
        }
      }
      return count === vowelNumber;
    };
  }),
  computed(() => (startWith.value === ''
    ? null
    : (word) => word.startsWith(startWith.value))),
  computed(() => (endWith.value === ''
    ? null
    : (word) => word.endsWith(endWith.value))),
  computed(() => (letter1.value === '' ? null : (word) => word[1] === letter1.value)),
  computed(() => (letter2.value === '' ? null : (word) => word[2] === letter2.value)),
  computed(() => (letter3.value === '' ? null : (word) => word[3] === letter3.value)),
  computed(() => {
    let re;
    try {
      re = new RegExp(pattern.value.toLowerCase());
    } catch (e) {
      return null;
    }
    return (word) => re.test(word);
  })
];
const filtered = filters.map((filter, i) => computed(() => {
  const words = i === 0 ? wordList : filtered[i - 1].value;
  return filter.value != null ? words.filter(filter.value) : words;
}));
watchPostEffect(() => { emit('filter', last(filtered).value); });

const reset = () => {
  match.value = 'matchAll';
  contain.value = '';
  notContain.value = '';
  vowelCount.value = '';
  startWith.value = '';
  endWith.value = '';
  letter1.value = '';
  letter2.value = '';
  letter3.value = '';
  pattern.value = '';
  excludeUncommon.value = false;
  excludeRepeating.value = false;
};
</script>

<template>
  <form id="filter-form" @submit.prevent>
    <div class="form-group">
      <select v-model="match" class="form-control" aria-label="Word list">
        <option value="matchAll">Match guesses</option>
        <option value="withoutCorrect" :disabled="stateLetters[3].size === 0">
          Match except for green
        </option>
        <option value="matchPresent1" :disabled="presentNotCorrect.size === 0">
          Match 1 yellow letter
        </option>
        <option value="matchPresent2" :disabled="presentNotCorrect.size < 2">
          Match 2 yellow letters
        </option>
        <option value="matchAbsent" :disabled="stateLetters[1].size === 0">
          Match gray
        </option>
        <option value="allNew">All new letters</option>
        <option value="">Entire word list</option>
      </select>
    </div>
    <div class="form-group">
      <InputLettersOnly v-model="contain"
        placeholder="Contains all of the letters (in any order)"
        aria-label="Contains all of the letters (in any order)"/>
    </div>
    <div class="form-group">
      <InputLettersOnly v-model="notContain"
        placeholder="Does not contain any of the letters"
        aria-label="Does not contain any of the letters"/>
    </div>
    <div class="form-group">
      <select v-model="vowelCount" class="form-control"
        aria-label="Number of AEIOUY">
        <option value="">Any number of AEIOUY</option>
        <option value="1">1 AEIOUY</option>
        <option value="2">2 AEIOUY</option>
        <option value="3">3 AEIOUY</option>
        <option value="4">4 AEIOUY</option>
        <option value="5">5 AEIOUY</option>
      </select>
    </div>
    <div class="row">
      <div class="col-xs-6">
        <div class="form-group">
          <InputLettersOnly v-model="startWith" placeholder="Starts with"
            aria-label="Starts with"/>
        </div>
      </div>
      <div class="col-xs-6">
        <div class="form-group">
          <InputLettersOnly v-model="endWith" placeholder="Ends with"
            aria-label="Ends with"/>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-xs-4">
        <div class="form-group">
          <InputLettersOnly v-model="letter1" placeholder="2nd letter"
            aria-label="2nd letter" maxlength="1"/>
        </div>
      </div>
      <div class="col-xs-4">
        <div class="form-group">
          <InputLettersOnly v-model="letter2" placeholder="3rd letter"
            aria-label="3rd letter" maxlength="1"/>
        </div>
      </div>
      <div class="col-xs-4">
        <div class="form-group">
          <InputLettersOnly v-model="letter3" placeholder="4th letter"
            aria-label="4th letter" maxlength="1"/>
        </div>
      </div>
    </div>
    <div class="form-group">
      <input v-model="pattern" class="form-control input-letters"
        placeholder="Matches the regular expression"
        aria-label="Matches the regular expression" autocomplete="off">
    </div>
    <div class="checkbox">
      <label>
        <input v-model="excludeUncommon" type="checkbox">Exclude uncommon words
      </label>
    </div>
    <div class="checkbox">
      <label>
        <input v-model="excludeRepeating" type="checkbox">
        Exclude words with repeat letters
      </label>
    </div>
    <button type="button" class="btn btn-default" @click="reset">Reset</button>
  </form>
</template>

<style lang="scss">
#filter-form { max-width: 325px; }
</style>
