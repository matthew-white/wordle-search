<script setup>
import { nextTick, reactive, ref } from 'vue';

import FilterForm from './filter-form.vue';
import GuessForm from './guess-form.vue';
import GuessList from './guess-list.vue';
import WordList from './word-list.vue';

const guesses = reactive([]);
const statesCommitted = ref(false);
const words = ref([]);

const guessForm = ref(null);
const guessList = ref(null);
const addGuess = (word) => {
  guesses.push(word.split('').map(letter => [letter, 0]));
  statesCommitted.value = false;
  words.value = [];
  guessForm.value.reset();
  nextTick(() => { guessList.value.focus(); });
};
const toggleState = (guessIndex, letterIndex) => {
  const letterState = guesses[guessIndex][letterIndex];
  letterState[1] = (letterState[1] + 1) % 3;
};
</script>

<template>
  <div class="container">
    <h1>
      <span id="title">Wordle Search</span>
      <span id="subtitle">Search for words that match your guess (or that don’t!)</span>
    </h1>
    <p v-show="statesCommitted" id="word-list-help" class="instruction-block">
      Take a look at the words below.<span class="icon hidden-xs">⬇</span>
    </p>
    <GuessList v-show="guesses.length !== 0" ref="guessList" :guesses="guesses"
      v-model:statesCommitted="statesCommitted" @toggle-state="toggleState"/>
    <GuessForm v-show="guesses.length === 0 || statesCommitted" ref="guessForm"
      @guess="addGuess"/>
    <hr v-show="statesCommitted">
    <div v-show="statesCommitted" id="word-list-container">
      <FilterForm v-if="statesCommitted" :guesses="guesses"
        @filter="words = $event"/>
      <WordList :words="words" @guess="addGuess"/>
    </div>
  </div>
  <footer>
    <div class="container">
      <div>
        <a href="https://raw.githubusercontent.com/matthew-white/wordle-search/master/LICENSE.txt">License</a>
        <a href="https://github.com/matthew-white/wordle-search">GitHub</a>
      </div>
    </div>
  </footer>
</template>

<style lang="scss">
html, body, footer { background-color: #111; }

body {
  color: #fff;
  font-size: 16px;
  min-height: 100vh;
  min-width: 360px;
  overflow-y: scroll;
  padding-bottom: 95px;
  position: relative;
}

.icon, .checkbox label { user-select: none; }

.instruction-block {
  color: lighten(#337ab7, 25%);
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 15px;

  .icon { color: #fff; }
}

.input-letters {
  text-transform: uppercase;
  &:placeholder-shown { text-transform: none; }
}

h1 {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  font-size: 32px;
  margin-bottom: 60px;
  margin-top: 40px;
}
#title { margin-right: 18px; }
#subtitle {
  flex-basis: 100%;
  font-size: 18px;
  margin-top: 12px;

  @media (min-width: 992px) {
    flex-basis: auto;
    font-size: 20px;
    margin-top: 0;
  }
}

#word-list-help .icon { margin-left: 10px; }
#guess-list, #guess-form { margin-bottom: 35px; }

hr {
  margin-bottom: 30px;
  margin-top: 51px;
  opacity: 0.9;
}

#word-list-container {
  display: flex;
  flex-wrap: wrap;
}
#filter-form { margin-bottom: 40px; }
#word-list { flex-basis: 100%; }
@media (min-width: 992px) {
  #word-list-container { flex-wrap: nowrap; }

  #filter-form {
    flex-shrink: 0;
    margin-bottom: 20px;
    margin-right: 70px;
  }
}

footer {
  bottom: 0;
  position: absolute;
  width: 100%;

  .container div {
    border-top: 1px solid #fff;
    padding-bottom: 15px;
    padding-top: 15px;
  }

  a {
    &, &:hover, &:focus { color: #fff; }
    + a { margin-left: 20px; }
  }
}
</style>
