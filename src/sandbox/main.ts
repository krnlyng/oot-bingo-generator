import { bingoList } from "./example-goal-list";
import { frequencyAnalysis } from "./frequencyAnalysis";
import { generateCard } from "../generator";
import { Options } from "../types/options";
import { DEFAULT_PROFILES } from "../definitions";

// this file shows a few examples of how to use the generator (generate a card, run a frequency analysis)
// run this file with `npm run`
// you can add your own code to experiment with the generator

// generate a card
const options: Options = {
  seed: 123,
  mode: "normal",
  language: "english",
};
const card = generateCard(bingoList, options);
console.log(`Generated after ${card.meta.iterations} iteration(s):`);
console.log(card.goals.map((goal) => goal.name));

// overwrite some of the generator settings of the default normal profile and generate a card
const customProfiles = {
  ...DEFAULT_PROFILES,
  normal: {
    ...DEFAULT_PROFILES.normal,
    minimumSynergy: -5,
    maximumSynergy: 9,
    maximumIndividualSynergy: 4,
    useFrequencyBalancing: false,
  },
};
const cardCustomProfile = generateCard(bingoList, options, customProfiles);
console.log(`Generated after ${card.meta.iterations} iteration(s):`);
console.log(cardCustomProfile.goals.map((goal) => goal.name));

// run a goal frequency analysis on 100 boards
const frequencies = frequencyAnalysis(200, "normal", bingoList);
console.log(frequencies);