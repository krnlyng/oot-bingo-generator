import { generateBingoBoard } from "../index";
import { exampleBingoList } from "./exampleBingoList";
import { RowAnalyzer } from "../analysis/rowAnalysis";
import { DEFAULT_PROFILES } from "../constants/profiles";
import { Profile, Profiles } from "../types/settings";

// this file shows a few examples of how to use the generator
// run this file with `npm start`
// edit this code or add your own to experiment with the generator!

// generate a board
const mode = "normal";
const seed = 112233;

const board = generateBingoBoard(exampleBingoList, mode, seed);
console.log(`Generated after ${board?.iterations} iteration(s):`);
console.log(board?.goalNames);

// overwrite some of the generator settings of the default normal profile and generate another board
const customProfile = {
  ...DEFAULT_PROFILES.normal,
  minimumSynergy: -5,
  maximumSynergy: 9,
  maximumIndividualSynergy: 4,
  useFrequencyBalancing: false,
};

const boardCustomProfile = generateBingoBoard(exampleBingoList, mode, seed, customProfile);
console.log(`Generated after ${boardCustomProfile?.iterations} iteration(s):`);
console.log(boardCustomProfile?.goalNames);

// print the synergy analysis of a row (obviously banned to use for races)
const rowAnalyzer = new RowAnalyzer(exampleBingoList, "normal");
rowAnalyzer.analyzeRow(seed, "col4");

const customProfile2: Profile = {
  minimumSynergy: -3,
  maximumSynergy: 28,
  maximumIndividualSynergy: 3.75,
  initialOffset: 1,
  maximumOffset: 2,
  baselineTime: 24.75,
  timePerDifficulty: 0.75,
  tooMuchSynergy: 100,
  useFrequencyBalancing: true,
} as const;

console.log(customProfile2);
const boardCustomProfile2 = generateBingoBoard(exampleBingoList, mode, seed, customProfile2, 100, 7, 7);
console.log(`Generated after ${boardCustomProfile2?.iterations} iteration(s):`);
console.log(boardCustomProfile2?.goalNames);


