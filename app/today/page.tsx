
"use client";

import React, { useState, useEffect } from 'react';
import { useStorage } from '../../components/StorageContext';
import { DailyLog, UserProfile, GoalSettings, AdaptiveModel, WorkoutSession } from '../../lib/types';
import { 
  calculateBMR, 
  calculateTDEEBase, 
  calculateCalorieTarget, 
  getPlannedDailyDelta
} from '../../lib/calculators';
import { getPlanAchievedDelta, getPlanStatusLabel } from '../../lib/planAdherence';
import { ACTIVITY_TARGETS } from '../../lib/constants';
import { Flame, Footprints, Timer, Weight } from 'lucide-react';
import CoachBar from '../../components/CoachBar';

export default function TodayPage() {
  const storage = useStorage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<GoalSettings | null>(null);
  const [adaptive, setAdaptive] = useState<AdaptiveModel | null>(null);
  const [log, setLog] = useState<DailyLog | null>(null);
  const [weeklySessions, setWeeklySessions] = useState<WorkoutSession[]>([]);
  const [historicalAvgWeight, setHistoricalAvgWeight] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchData = async () => {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day;
      const startOfWeek = new Date(now.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfWeekISO = startOfWeek.toISOString().split('T')[0];

      const [p, g, a, l, allLogs, allSessions] = await Promise.all([
        storage.getUserProfile(),
        storage.getGoalSettings(),
        storage.getAdaptiveModel(),
        storage.getDailyLogByDate(todayStr),
        storage.getDailyLogs(60),
        storage.getWorkoutSessions(50)
      ]);
      
      if (!p) return;

      setProfile(p);
      setGoals(g);
      setAdaptive(a);
      setLog(l || {
        dateISO: todayStr,
        calories: 0,
        steps: 0,
        azm: 0,
        workoutDone: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      const currentWeekSessions = allSessions.filter(s => s.dateISO >= startOfWeekISO);
      setWeeklySessions(currentWeekSessions);

      const logsBeforeToday = allLogs.filter(item => item.dateISO !== todayStr);
      const weightEntriesBeforeToday = logsBeforeToday.filter(item => item.weightLb !== undefined && item.weightLb > 0);
      const last7WeightLogs = weightEntriesBeforeToday.slice(0, 7);
      
      let historicalAvg = p?.startingWeightLb || 0;
      if (last7WeightLogs.length > 0) {
        historicalAvg = last7WeightLogs.reduce((sum, curr) => sum + (curr.weightLb || 0), 0) / last7WeightLogs.length;
      }
      
      setHistoricalAvgWeight(historicalAvg);
      setDataReady(true);
    };
    fetchData();
  }, [storage, todayStr]);

  if (!dataReady || !profile || !goals || !adaptive || !log) return null;

  const bmr = calculateBMR(profile, historicalAvgWeight);
  const tdeeBase = calculateTDEEBase(bmr, goals.activityStyle);
  const calorieTarget = calculateCalorieTarget(tdeeBase, adaptive.tdeeBias, goals.mode, goals.goalRate);
  const plannedDailyDelta = getPlannedDailyDelta(goals.mode, goals.goalRate);
  
  const stepTarget = ACTIVITY_TARGETS[goals.activityStyle].steps;
  const azmTarget = ACTIVITY_TARGETS[goals.activityStyle].azm;

  const achievedDelta = getPlanAchievedDelta({
    mode: goals.mode,
    plannedDailyDelta: plannedDailyDelta,
    caloriesEaten: log.calories,
    calorieTarget,
    steps: log.steps,
    stepsTarget: stepTarget,
    azm: log.azm,
    azmTarget: azmTarget
  });

  const updateLog = async (updates: Partial<DailyLog>) => {
    const updated = { ...log, ...updates, updatedAt: Date.now() };
    setLog(updated);
    setSaving(true);
    await storage.upsertDailyLog(updated);
    setTimeout(() => setSaving(false), 500);
  };

  const coachState = {
    currentHour: new Date().getHours(),
    weightLogged: !!(log.weightLb && log.weightLb > 0),
    caloriesEntered: log.calories > 0,
    stepsEntered: log.steps > 0,
    azmEntered: log.azm > 0,
    caloriesEaten: log.calories,
    steps: log.steps,
    azm: log.azm,
    targets: {
      calories: calorieTarget,
      steps: stepTarget,
      azm: azmTarget
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold">Today</h2>
        <p className="text-gray-500">Log your progress for the day.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Cals Intake</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-gray-900">{log.calories || 0}</span>
            <span className="text-xs text-gray-400">/ {calorieTarget}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Plan {getPlanStatusLabel(goals.mode, achievedDelta)}</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-xl font-bold ${achievedDelta === undefined ? 'text-gray-400' : (achievedDelta < 0 ? 'text-emerald-600' : 'text-red-600')}`}>
              {achievedDelta === undefined ? 'N/A' : Math.round(Math.abs(achievedDelta))}
            </span>
            <span className="text-xs text-gray-400">/ {Math.abs(plannedDailyDelta)}</span>
          </div>
        </div>
      </div>

      <CoachBar state={coachState} />

      <div className="bg-white rounded-xl border shadow-sm divide-y">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Weight className="text-purple-600" size={20} />
            <span className="font-medium">Weight (lb)</span>
          </div>
          <input 
            type="number" 
            value={log.weightLb || ''}
            onChange={(e) => updateLog({ weightLb: parseFloat(e.target.value) || undefined })}
            className="w-24 text-right bg-gray-50 border rounded-lg p-2 outline-none font-mono"
          />
        </div>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Flame className="text-orange-600" size={20} />
            <span className="font-medium">Calories</span>
          </div>
          <input 
            type="number" 
            value={log.calories || ''}
            onChange={(e) => updateLog({ calories: parseInt(e.target.value) || 0 })}
            className="w-24 text-right bg-gray-50 border rounded-lg p-2 outline-none font-mono"
          />
        </div>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Footprints className="text-blue-600" size={20} />
            <span className="font-medium">Steps</span>
          </div>
          <input 
            type="number" 
            value={log.steps || ''}
            onChange={(e) => updateLog({ steps: parseInt(e.target.value) || 0 })}
            className="w-24 text-right bg-gray-50 border rounded-lg p-2 outline-none font-mono"
          />
        </div>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Timer className="text-yellow-600" size={20} />
            <span className="font-medium">AZM</span>
          </div>
          <input 
            type="number" 
            value={log.azm || ''}
            onChange={(e) => updateLog({ azm: parseInt(e.target.value) || 0 })}
            className="w-24 text-right bg-gray-50 border rounded-lg p-2 outline-none font-mono"
          />
        </div>
      </div>
    </div>
  );
}
