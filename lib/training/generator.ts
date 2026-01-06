
import { Program, ProgramWorkout, ProgramExercise, UserProfile, GoalMode } from '../types';

export function generateHeuristicProgram(profile: UserProfile, mode: GoalMode, options: any): any {
  const progId = crypto.randomUUID();
  const program: Program = { id: progId, name: 'AI Custom Plan', source: 'generated', lengthWeeks: 8, daysPerWeek: 3, createdAt: Date.now(), updatedAt: Date.now() };
  const wId = crypto.randomUUID();
  const workouts: ProgramWorkout[] = [{ id: wId, programId: progId, dayLabel: 'A', orderIndex: 0 }];
  const exercises: ProgramExercise[] = [{ id: crypto.randomUUID(), workoutId: wId, exerciseKey: 'Push-ups', sets: 3, repMin: 8, repMax: 12, isOptional: false, orderIndex: 0 }];
  return { program, workouts, exercises };
}
