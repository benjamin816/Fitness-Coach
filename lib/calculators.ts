
import { Sex, ActivityStyle, GoalMode, UserProfile } from './types';
import { ACTIVITY_MULTIPLIERS } from './constants';

export const lbToKg = (lb: number) => lb / 2.20462;
export function feetInchesToCm(feet: number, inches: number): number {
  return Math.round((feet * 30.48) + (inches * 2.54));
}
export function calculateBMR(profile: UserProfile, currentWeightLb: number): number {
  const kg = lbToKg(currentWeightLb);
  const cm = profile.heightCm;
  const age = profile.ageYears;
  return profile.sex === 'male' 
    ? 10 * kg + 6.25 * cm - 5 * age + 5 
    : 10 * kg + 6.25 * cm - 5 * age - 161;
}
export function calculateTDEEBase(bmr: number, activityStyle: ActivityStyle): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityStyle];
}
export function getPlannedDailyDelta(mode: GoalMode, rate: number): number {
  if (mode === 'maintenance') return 0;
  return (mode === 'fat-loss') ? -(rate * 500) : (rate * 500);
}
export function calculateCalorieTarget(tdeeBase: number, tdeeBias: number, mode: GoalMode, rate: number): number {
  const plannedDelta = getPlannedDailyDelta(mode, rate);
  return Math.round((tdeeBase + tdeeBias + plannedDelta) / 50) * 50;
}
