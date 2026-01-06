
import { PACING_START_HOUR, PACING_END_HOUR } from './constants';

export interface CoachState {
  currentHour: number;
  weightLogged: boolean;
  caloriesEntered: boolean;
  stepsEntered: boolean;
  azmEntered: boolean;
  caloriesEaten: number;
  steps: number;
  azm: number;
  targets: { calories: number; steps: number; azm: number; };
}

export function getCoachBarMessage(state: CoachState): string {
  const { currentHour, weightLogged, caloriesEntered, stepsEntered, azmEntered, caloriesEaten, targets } = state;
  if (!weightLogged && !caloriesEntered) return "Please Begin by logging your weight.";
  if (currentHour >= 6 && currentHour < 10 && !weightLogged) return "Don’t forget to log your weight.";
  if (caloriesEntered && caloriesEaten >= 0.75 * targets.calories && caloriesEaten < targets.calories) return "Careful—you're at 75% of your calorie target.";
  if (caloriesEntered && stepsEntered && azmEntered && weightLogged) return "You nailed today! Great job.";
  return "Keep logging your day to stay on track!";
}
