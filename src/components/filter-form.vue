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

import { every, last } from '../util/util';

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

const test = function test(count) {
  return count >= this.min && (this.max == null || count <= this.max);
};
const letterStats = computed(() => {
  const stats = new Map();
  for (const guess of props.guesses) {
    const guessCounts = new Map();
    const guessAbsent = new Set();
    for (let i = 0; i < 5; i += 1) {
      const [letter, state] = guess[i];
      if (!stats.has(letter)) {
        stats.set(letter, {
          // The indexes at which the letter has appeared in each state
          indexes: [new Set(), new Set(), new Set()],
          // We use countRange to track how many times the letter appears in the
          // answer. Specifically, we track a floor and possibly a ceiling for
          // that count. We track the letter's count rather than simply its
          // presence/absence because a guess that repeats a letter may provide
          // more information than presence/absence.
          countRange: { min: 0, test }
        });
      }
      stats.get(letter).indexes[state].add(i);

      if (!guessCounts.has(letter)) guessCounts.set(letter, 0);
      if (state === 0)
        guessAbsent.add(letter);
      else
        guessCounts.set(letter, guessCounts.get(letter) + 1);
    }
    for (const [letter, count] of guessCounts.entries()) {
      const { countRange } = stats.get(letter);
      if (count > countRange.min) countRange.min = count;
      if (guessAbsent.has(letter)) countRange.max = count;
    }
  }
  // Probably not needed given how we use countRange, but also shouldn't hurt.
  for (const { countRange, indexes } of stats.values()) {
    if (countRange.min < indexes[2].size) countRange.min = indexes[2].size;
  }
  return stats;
});

const countLetters = (word) => {
  const counts = new Map();
  for (const letter of word) {
    const count = counts.get(letter);
    counts.set(letter, count == null ? 1 : count + 1);
  }
  return counts;
};
const matchers = {
  matchAll: (word) => {
    const counts = countLetters(word);
    return every(letterStats.value.entries(), ([letter, { countRange, indexes }]) => {
      const count = counts.get(letter);
      return countRange.test(count != null ? count : 0) &&
        every(indexes[0], (i) => word[i] !== letter) &&
        every(indexes[1], (i) => word[i] !== letter) &&
        every(indexes[2], (i) => word[i] === letter);
    });
  },
  withoutCorrect: (word) => {
    const counts = countLetters(word);
    return every(letterStats.value.entries(), ([letter, { countRange, indexes }]) => {
      const count = counts.get(letter);
      return countRange.test((count != null ? count : 0) + indexes[2].size) &&
        every(indexes[0], (i) => word[i] !== letter) &&
        every(indexes[1], (i) => word[i] !== letter) &&
        every(indexes[2], (i) => word[i] !== letter);
    });
  },
  matchAbsent: (word) =>
    every(countLetters(word).entries(), ([letter, count]) => {
      const stats = letterStats.value.get(letter);
      if (stats == null) return true;
      const { max } = stats.countRange;
      return max == null ||
        (count <= max && every(stats.indexes[0], (i) => word[i] !== letter));
    }),
  allNew: (word) => every(word, (letter) => !letterStats.value.has(letter))
};

// Set of letters that have been guessed "present" and that we know have not
// been guessed correctly enough times
const presentNotCorrect = computed(() => {
  const letters = new Set();
  for (const [letter, { indexes, countRange }] of letterStats.value.entries()) {
    if (indexes[1].size !== 0 && indexes[2].size < countRange.min)
      letters.add(letter);
  }
  return letters;
});
// Similar to matchers.withoutCorrect().
const matchPresentCount = (countToMatch) => (word) => {
  let presentCount = 0;
  const letterCounts = countLetters(word);
  for (const [letter, { indexes, countRange }] of letterStats.value.entries()) {
    const letterCount = letterCounts.get(letter);
    if (presentNotCorrect.value.has(letter) && letterCount != null) {
      presentCount += 1;
      if (presentCount > countToMatch) return false;
    }
    if (!(presentNotCorrect.value.has(letter) && letterCount == null)) {
      const countWithCorrect = (letterCount != null ? letterCount : 0) +
        indexes[2].size;
      if (!(countRange.test(countWithCorrect) &&
        every(indexes[0], (i) => word[i] !== letter) &&
        every(indexes[1], (i) => word[i] !== letter) &&
        every(indexes[2], (i) => word[i] !== letter)))
        return false;
    }
  }
  return presentCount === countToMatch;
};
matchers.matchPresent1 = matchPresentCount(1);
matchers.matchPresent2 = matchPresentCount(2);

const noneAbsent = computed(() =>
  every(letterStats.value.values(), ({ indexes }) => indexes[0].size === 0));
const noneCorrect = computed(() =>
  every(letterStats.value.values(), ({ indexes }) => indexes[2].size === 0));

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
// If FilterForm is about to be unmounted after a new guess, we don't want to
// emit `filter` even though `guesses` will have changed: this is why we
// watchPostEffect() rather than watchEffect().
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
        <option value="withoutCorrect" :disabled="noneCorrect">
          Match except for green
        </option>
        <option value="matchPresent1" :disabled="presentNotCorrect.size === 0">
          Match 1 yellow letter
        </option>
        <option value="matchPresent2" :disabled="presentNotCorrect.size < 2">
          Match 2 yellow letters
        </option>
        <option value="matchAbsent" :disabled="noneAbsent">Match gray</option>
        <option value="allNew">All new letters</option>
        <option value="">Entire word list</option>
      </select>
    </div>
    <div class="form-group">
      <InputLettersOnly v-model="contain"
        placeholder="Contains all of the letters (in any order)"
        aria-label="Contains all of the letters (in any order)"
        spellcheck="false" autocorrect="off"/>
    </div>
    <div class="form-group">
      <InputLettersOnly v-model="notContain"
        placeholder="Does not contain any of the letters"
        aria-label="Does not contain any of the letters" spellcheck="false"
        autocorrect="off"/>
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
            aria-label="Starts with" spellcheck="false" autocorrect="off"/>
        </div>
      </div>
      <div class="col-xs-6">
        <div class="form-group">
          <InputLettersOnly v-model="endWith" placeholder="Ends with"
            aria-label="Ends with" spellcheck="false" autocorrect="off"/>
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
        aria-label="Matches the regular expression" autocomplete="off"
        spellcheck="false" autocorrect="off">
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
#filter-form { max-width: min(325px, 90%); }
</style>
