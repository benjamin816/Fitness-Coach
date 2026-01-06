
import { GoalMode } from './types';

interface AdherenceParams {
  mode: GoalMode;
  plannedDailyDelta: number;
  caloriesEaten: number;
  calorieTarget: number;
  steps: number;
  stepsTarget: number;
  azm: number;
  azmTarget: number;
}

export function getPlanAchievedDelta(params: AdherenceParams): number | undefined {
  const { plannedDailyDelta, caloriesEaten, calorieTarget, steps, stepsTarget, azm, azmTarget } = params;
  if (caloriesEaten === 0) return undefined;
  const theoreticalTotalBurn = calorieTarget - plannedDailyDelta;
  const movementFrac = (Math.min(steps / (stepsTarget || 1), 1) + Math.min(azm / (azmTarget || 1), 1)) / 2;
  const movementPenalty = Math.abs(plannedDailyDelta) * (1 - movementFrac);
  return -((theoreticalTotalBurn - movementPenalty) - caloriesEaten);
}

export function getPlanStatusLabel(mode: GoalMode, achievedDelta: number | undefined): string {
  if (achievedDelta === undefined) return 'Deficit';
  if (mode === 'maintenance') return 'Plan Balance';
  return (mode === 'fat-loss') ? (achievedDelta < 0 ? 'Deficit' : 'Surplus') : (achievedDelta > 0 ? 'Surplus' : 'Deficit');
}
