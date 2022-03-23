const fs = require('fs');

const isWord = (s) => /^[a-z]{5}$/.test(s);

const wordList = fs.readFileSync('./data/raw/word_list.txt').toString().split('\n');
if (!wordList.every(isWord)) {
  console.error('invalid word_list.txt'); // eslint-disable-line no-console
  process.exit(1);
}
if (!fs.existsSync('./data/processed')) fs.mkdirSync('./data/processed');
fs.writeFileSync(
  './data/processed/word-list.json',
  JSON.stringify(wordList, null, 2)
);

const repeating = wordList.reduce(
  (set, word) => (new Set(word.split('')).size === 5 ? set : set.add(word)),
  new Set()
);
fs.writeFileSync(
  './data/processed/repeating.json',
  JSON.stringify([...repeating], null, 2)
);

const commonWords = fs.readFileSync('./data/raw/common_words.txt').toString()
  .split('\n')
  .slice(1);
if (!commonWords.every(isWord)) {
  console.error('invalid common_words.txt'); // eslint-disable-line no-console
  process.exit(1);
}
fs.writeFileSync(
  './data/processed/common.json',
  JSON.stringify([...new Set(commonWords)], null, 2)
);
