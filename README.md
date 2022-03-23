Wordle Search
=============

Wordle Search searches the official Wordle word list for words that match guesses and/or other criteria.

To process the .txt word lists in `data/raw/`, run `node bin/process-data.js`. This will output JSON files to `data/processed/`.

To build the HTML/CSS/JavaScript, run `npm install`, then `npm run build`. This will output files to `dist/`.

License
-------

Wordle Search is licensed under the [MIT License](/LICENSE.txt).

`data/raw/common_words.txt` is from the [Kinkelin/WordleCompetition](https://github.com/Kinkelin/WordleCompetition) repository.
