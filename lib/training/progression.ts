
import { UserProfile, ExerciseEntry, ProgramExercise } from '../types';
import { getExerciseMetadata } from './catalog';

export interface ProgressionTarget { weight?: number; reps: number; isSuggestion: boolean; }
export function getStartingWeightSuggestion(profile: UserProfile, exerciseKey: string): number {
  return Math.round((profile.startingWeightLb * 0.1) / 5) * 5 || 5;
}
export function calculateNextTarget(exercise: ProgramExercise, history: ExerciseEntry[]): ProgressionTarget {
  if (history.length === 0) return { reps: exercise.repMin, isSuggestion: true };
  const last = history[history.length - 1];
  return { weight: last.weight, reps: Math.min(last.reps + 1, exercise.repMax), isSuggestion: false };
}
