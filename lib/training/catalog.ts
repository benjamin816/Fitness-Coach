
import { LoadType } from '../types';

export interface ExerciseMetadata { key: string; name: string; loadType: LoadType; }
export const EXERCISE_CATALOG: Record<string, ExerciseMetadata> = {
  'Goblet Squat (DB)': { key: 'Goblet Squat (DB)', name: 'Goblet Squat', loadType: 'external_weight' },
  'DB Bench Press': { key: 'DB Bench Press', name: 'DB Bench Press', loadType: 'external_weight' },
  'One-Arm DB Row': { key: 'One-Arm DB Row', name: 'One-Arm DB Row', loadType: 'external_weight' },
  'Plank': { key: 'Plank', name: 'Plank', loadType: 'distance_time' },
  'Push-ups': { key: 'Push-ups', name: 'Push-ups', loadType: 'bodyweight' },
};
export function getExerciseMetadata(key: string): ExerciseMetadata {
  return EXERCISE_CATALOG[key] || { key, name: key, loadType: 'external_weight' };
}
