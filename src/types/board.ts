import { Goal } from "./goalList";

export type Square = {
  difficulty: number;
  desiredTime: number;
  goal?: Goal;
};

export type SquareWithGoal = {
  difficulty: number;
  desiredTime: number;
  goal: Goal;
};

export function hasGoal(square: Square): square is SquareWithGoal {
  return square.goal !== undefined;
}

