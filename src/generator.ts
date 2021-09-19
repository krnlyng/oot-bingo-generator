import { Square, squarePositions } from "./domain/board";
import { BingoList, GoalList, Goal } from "./domain/goalList";
import { Synergies, Synfilters } from "./domain/synergies"
import { Profile, profiles } from "./domain/profiles";
import { Options, Mode } from "./domain/options";
import { INDICES_PER_ROW, Row, ROWS_PER_INDEX } from "./domain/rows";
import generateMagicSquare from "./magicSquare";
import RNG from "./rng";
import SynergyCalculator from "./synergyCalculator";


export default class BingoGenerator {
    readonly options: Options;
    readonly profile: Profile;
    readonly rng: RNG;
    readonly magicSquare: number[];

    readonly allGoals: Goal[];
    readonly rowtypeTimeSave: Synergies;
    readonly synergyFilters: Synfilters;

    readonly synergyCalculator: SynergyCalculator;

    constructor(goalList: GoalList, options: Options) {
        this.options = options;

        // todo move to outside of class
        /*this.language = options.lang || 'name';
        this.mode = options.mode || 'normal';
        this.seed = options.seed || Math.ceil(999999 * Math.random()).toString();*/

        // calc extractGoalList BEFORE creating an instance of this class

        this.rng = new RNG(options.seed);
        this.magicSquare = generateMagicSquare(this.options.seed);

        this.rowtypeTimeSave = goalList.rowtypes;
        this.synergyFilters = parseSynergyFilters(goalList.synfilters);

        this.allGoals = flattenGoalList(goalList);

        this.profile = profiles[options.mode];

        this.synergyCalculator = new SynergyCalculator(this.profile, this.rowtypeTimeSave, this.synergyFilters);
    }

    /**
     * Generates a bingo card.
     * @param maxIterations The max amount of times the generator will try to generate a card.
     * @returns An array of squares if generation was successful, with metadata included
     */
    generateCard(maxIterations: number = 10) {
        let board = undefined;
        let iteration = 0;

        while (!board && iteration < maxIterations) {
            iteration++;
            console.log("generating... " + iteration)
            board = this.generateBoard();
        }

        return {
            ...board,
            meta: {
                iterations: iteration,
            }
        }
    }

    /**
     * Attempts to generate a bingo board.
     * @returns An array of squares if generation was successful, undefined otherwise
     */
    generateBoard(): Square[] | undefined {
        // set up the bingo board by filling in the difficulties based on a magic square
        let bingoBoard = squarePositions.map((i) => this.#difficultyToSquare(this.magicSquare[i]));

        // fill in the goals of the board in a random order
        const populationOrder = this.#generatePopulationOrder(bingoBoard);
        for (const i of squarePositions) {
            const nextPosition = populationOrder[i];

            const pickedGoal = this.#pickGoalForPosition(nextPosition, bingoBoard);

            if (pickedGoal) {
                bingoBoard[nextPosition].goal = pickedGoal;

            } else {
                return undefined;
            }
        }
        return bingoBoard;
    };

    /**
     * Pick a goal to fill the specified square on the board. It may not cause too much (anti)synergy in any row.
     * 
     * @param position The position of the square
     * @param bingoBoard The bingo board
     * @returns The goal and its synergy or false, if no fitting goal was found
     */
    #pickGoalForPosition(position: number, bingoBoard: Square[]): Goal | undefined {

        const squareToFill = bingoBoard[position];
        const desiredTime = squareToFill.desiredTime;

        for (let offset = this.profile.initialOffset; offset <= this.profile.maximumOffset; offset++) {

            const goalsInTimeRange = this.#getGoalsInTimeRange(desiredTime - offset, desiredTime + offset);

            for (const goal of goalsInTimeRange) {

                if (this.#hasGoalOnBoard(goal, bingoBoard)) {
                    continue;
                }

                const potentialSquare = {
                    ...squareToFill,
                    goal: goal
                }

                if (this.options.mode === "blackout" && this.#hasConflictsOnBoard(potentialSquare, bingoBoard)) {
                    continue;
                }

                if (!this.#causesTooMuchSynergyOnBoard(potentialSquare, position, bingoBoard)) {
                    return goal;
                }
            }
        }

        return undefined;
    }

    #getGoalsInTimeRange(minimumTime: number, maximumTime: number): Goal[] {
        const goalsInTimeRange = this.allGoals.filter(goal => goal.time >= minimumTime && goal.time <= maximumTime);
        return this.#shuffled(goalsInTimeRange);
    }

    #hasGoalOnBoard(goal: Goal, bingoBoard: Square[]): boolean {
        return bingoBoard.some(square => square.goal && (square.goal.id === goal.id));
    }

    #hasConflictsOnBoard(potentialSquare: Square, bingoBoard: Square[]) {

        for (const square of bingoBoard) {

            if (!square.goal) {
                continue;
            }

            if (this.synergyCalculator.synergyOfSquares([potentialSquare, square]) >= this.profile.tooMuchSynergy) {
                return true;
            }
        }
        return false;
    }

    #causesTooMuchSynergyOnBoard(potentialSquare: Square, positionOfSquare: number, bingoBoard: Square[]) {
        const minMaxSynergies = this.#minMaxSynergiesForRowsOfSquare(positionOfSquare, potentialSquare, bingoBoard);

        return minMaxSynergies.maximumSynergy > this.profile.maximumSynergy ||
            minMaxSynergies.minimumSynergy < this.profile.minimumSynergy;
    }

    #minMaxSynergiesForRowsOfSquare(positionOfSquare: number, potentialSquare: Square, bingoBoard: Square[]) {
        const rowsOfSquare = ROWS_PER_INDEX[positionOfSquare];

        let maximumSynergy = 0;
        let minimumSynergy = this.profile.tooMuchSynergy;

        for (const row of rowsOfSquare) {

            const potentialRow = this.#getOtherSquares(row, positionOfSquare, bingoBoard);
            potentialRow.push(potentialSquare);
            const effectiveRowSynergy = this.synergyCalculator.synergyOfSquares(potentialRow);

            maximumSynergy = Math.max(maximumSynergy, effectiveRowSynergy);
            minimumSynergy = Math.min(minimumSynergy, effectiveRowSynergy);
        }

        return {
            maximumSynergy: maximumSynergy,
            minimumSynergy: minimumSynergy,
        };
    }

    #getOtherSquares(row: Row, positionOfSquare: number, bingoBoard: Square[]): Square[] {
        return INDICES_PER_ROW[row]
            .filter(index => index != positionOfSquare)
            .map(index => bingoBoard[index]);
    }


    #difficultyToSquare(difficulty: number): Square {
        return {
            difficulty: difficulty,
            desiredTime: difficulty * this.profile.timePerDifficulty,
        };
    }

    /**
     * Generates the order in which the squres should be filled by the generator.
     * 
     * First the three squres with the highest difficulty, then the center, then the diagonals, then the rest.
     * 
     * @param bingoBoard The magic square.
     */
    #generatePopulationOrder(bingoBoard: Square[]): number[] {

        let populationOrder = [];

        const centerSquare = 12;
        populationOrder[0] = centerSquare;

        const diagonals = this.#shuffled([0, 6, 18, 24, 4, 8, 16, 20]);
        populationOrder = populationOrder.concat(diagonals);

        const nondiagonals = this.#shuffled([1, 2, 3, 5, 7, 9, 10, 11, 13, 14, 15, 17, 19, 21, 22, 23]);
        populationOrder = populationOrder.concat(nondiagonals);

        [23, 24, 25].forEach(difficulty => this.#moveSquareWithDifficultyInFront(difficulty, populationOrder, bingoBoard));

        return populationOrder;
    };

    #moveSquareWithDifficultyInFront(difficulty: number, populationOrder: number[], bingoBoard: Square[]) {

        let currentSquare = bingoBoard.findIndex(square => square.difficulty == difficulty);

        if (currentSquare === -1) {
            // This should never happen
            throw new Error(`Can't find square with difficulty ${difficulty}`);
        }

        populationOrder.splice(populationOrder.findIndex(i => i === currentSquare), 1);
        populationOrder.splice(0, 0, currentSquare);
    }

    #shuffled<T>(array: Array<T>): Array<T> {
        let toShuffle = array.slice();
        for (let i = 0; i < toShuffle.length; i++) {
            const randElement = Math.floor(this.rng.nextRandom() * (i + 1));
            const temp = toShuffle[i];
            toShuffle[i] = toShuffle[randElement];
            toShuffle[randElement] = temp;
        }
        return toShuffle;
    }
}

/**
 * Can be used to sort an array of goals first by their time, then by their id ascending.
 * 
 * @param a first goal
 * @param b second goal
 */
function sortByTimeAndId(a: Goal, b: Goal): number {
    var timeDiff = a.time - b.time;

    if (timeDiff !== 0) {
        return timeDiff;
    }

    if (a.id > b.id) {
        return 1;
    }
    else if (a.id < b.id) {
        return -1;
    }
    else {
        return 0;
    }
};

/**
 * Generate a sorted array of goals from a complex goal list object.
 * 
 * @param goalList The original goal list.
 */
function flattenGoalList(goalList: GoalList): Goal[] {

    let allGoals = [];

    for (let i = 1; i <= 25; i++) {
        allGoals = allGoals.concat(goalList[i]) as Goal[];
    }

    allGoals.sort(sortByTimeAndId);

    return allGoals;
}

/**
 * Synergy filters are strings that start with 'max' or 'min' followed by a space and a number
 * Examples: 'max -1', 'min 2', 'min -2'
 * 
 * Splits synergy filter strings into objects with 'max' or 'min' and the numeric value
 * 
 * @param filters Object with a synergy filter string for several types (e.g. {childchu : 'min 1', endon : 'max -1'})
 * @returns Object with the parsed Synfilters (e.g. {childchu: {minmax: 'min', value: 1}, endon: {'minmax': max}, value: -1})
 */
function parseSynergyFilters(filters: { [key: string]: string }): Synfilters {
    const parsedFilters = {};
    for (const filterType in filters) {
        const splitFilter = filters[filterType].split(' ');
        if (splitFilter[0].toLowerCase() !== 'min' && splitFilter[0].toLowerCase() !== 'max') {
            continue;
        }
        parsedFilters[filterType] = {
            minmax: splitFilter[0],
            value: parseInt(splitFilter[1], 10)
        }

    }
    return parsedFilters;
}

/**
 * Extracts the goal list for a given mode from the full definition of bingo goals.
 * 
 * @param bingoList The JavaScript object generated from the goal CSV.
 * @param mode The requested mode.
 */
function extractGoalList(bingoList: BingoList, mode: Mode): GoalList | undefined {

    if (bingoList.info.combined && bingoList.info.combined === "true") {
        const combinedBingoList = bingoList;
        if (combinedBingoList[mode]) {
            return combinedBingoList[mode];
        }
        else if (combinedBingoList["normal"]) {
            return combinedBingoList["normal"];
        }
        else {
            console.log(`Error: Goal list doesn't contain a valid sub goal list for mode: "${mode}"`);
        }
    }
}