export const MAX_ITERATIONS = 100;

var SQUARES_PER_ROW = 5;
var SQUARES_PER_COL = 5;

var rows_set = false;
var columns_set = false;

export function setSquaresPerRow(rows: number) {
    rows_set = true;
    SQUARES_PER_ROW = rows;
}

export function setSquaresPerCol(columns: number) {
    columns_set = true;
    SQUARES_PER_COL = columns;
}

export function getSquaresPerRow() {
    if (!rows_set) {
        console.log("Board size not yet initialized");
        console.trace();
    }
    return SQUARES_PER_ROW;
}

export function getSquaresPerCol() {
    if (!columns_set) {
        console.log("Board size not yet initialized");
        console.trace();
    }
    return SQUARES_PER_COL;
}

export function getSquarePositions() {
    const positions = [];

    for (let r = 0; r < getSquaresPerRow() * getSquaresPerCol(); r++) {
        positions.push(r);
    }

    return positions;
}

export function getIndicesPerRow(rowName: String) {
    const indices = [];

    for (let r = 0; r < getSquaresPerRow(); r++) {
        if (rowName === ("row" + (r + 1))) {
            for (let c = 0; c < getSquaresPerCol(); c++) {
                indices.push(r * getSquaresPerRow() + c)
            }
        }
    }

    for (let c = 0; c < getSquaresPerCol(); c++) {
        if (rowName === ("col" + (c + 1))) {
            for (let r = 0; r < getSquaresPerRow(); r++) {
                indices.push(r * getSquaresPerRow() + c)
            }
        }
    }

    // No diagonals when number of rows != number of cols.
    if (getSquaresPerRow() === getSquaresPerCol()) {
        if (rowName === "tlbr") {
            for (let r = 0; r < getSquaresPerRow(); r++) {
                indices.push(r + getSquaresPerRow() * r);
            }
        }
        if (rowName === "bltr") {
            for (let r = 0; r < getSquaresPerRow(); r++) {
                indices.push(getSquaresPerRow() - r - 1 + getSquaresPerRow() * r);
            }
        }
    }

    return indices;
}

export function getRowNames() {
    const result = [];

    for (let r = 0; r < getSquaresPerRow(); r++) {
        result.push("row" + (r + 1));
    }

    for (let c = 0; c < getSquaresPerCol(); c++) {
        result.push("col" + (c + 1));
    }

    // No diagonals when number of rows != number of cols.
    if (getSquaresPerRow() === getSquaresPerCol()) {
        result.push("bltr");
        result.push("tlbr");
    }

    return result;
}

export function getRowsPerIndex(index: number) {
    const result = [];
    let row = Math.floor(index / getSquaresPerRow());
    let col = index % getSquaresPerRow();

    // No diagonals when number of rows != number of cols.
    if (getSquaresPerRow() === getSquaresPerCol()) {
        if (row === col) {
            result.push("tlbr");
        }

        if (getSquaresPerRow() - row - 1 === col) {
            result.push("bltr");
        }
    }

    result.push("row" + (row + 1));
    result.push("col" + (col + 1));
    return result;
}

export function getCenterSquare() {
    return Math.floor((getSquaresPerRow() * getSquaresPerCol()) / 2)
}

export function getDiagonalsNoCenter() {
    const diagonal1 = getIndicesPerRow("tlbr");
    const diagonal2 = getIndicesPerRow("bltr");
    return diagonal1.concat(diagonal2).filter( x => (x != getCenterSquare()));
}

export function getNonDiagonals() {
    const diagonals = getDiagonalsNoCenter();

    const squarePositions = getSquarePositions();

    const difference = squarePositions.filter( x => ((!diagonals.includes(x)) && (x != getCenterSquare())) );

    return difference;
}

