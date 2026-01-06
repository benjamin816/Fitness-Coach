
"use client";

import React, { useState, useEffect } from 'react';
import { useStorage } from '../../components/StorageContext';
import { DailyLog, UserProfile, GoalSettings, AdaptiveModel } from '../../lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  calculateBMR, 
  calculateTDEEBase, 
  calculateCalorieTarget, 
  getPlannedDailyDelta 
} from '../../lib/calculators';
import { getPlanAchievedDelta } from '../../lib/planAdherence';
import { ACTIVITY_TARGETS } from '../../lib/constants';
import { RefreshCw, Info, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';

export default function ProgressPage() {
  const storage = useStorage();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<GoalSettings | null>(null);
  const [adaptive, setAdaptive] = useState<AdaptiveModel | null>(null);
  const [autoUpdateMessage, setAutoUpdateMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [l, p, g, a] = await Promise.all([
        storage.getDailyLogs(90),
        storage.getUserProfile(),
        storage.getGoalSettings(),
        storage.getAdaptiveModel()
      ]);
      const sortedLogs = l.sort((a, b) => a.dateISO.localeCompare(b.dateISO));
      setLogs(sortedLogs);
      setProfile(p);
      setGoals(g);
      setAdaptive(a);

      if (p && g && a && sortedLogs.length >= 14) {
        const currentWeekLogs = sortedLogs.slice(-7);
        const prevWeekLogs = sortedLogs.slice(-14, -7);

        const getAvgWeight = (weekLogs: DailyLog[]) => {
          const valid = weekLogs.filter(lw => (lw.weightLb || 0) > 0);
          return valid.length >= 4 ? valid.reduce((sum, lw) => sum + (lw.weightLb || 0), 0) / valid.length : null;
        };

        const currAvg = getAvgWeight(currentWeekLogs);
        const prevAvg = getAvgWeight(prevWeekLogs);
        const adherenceMet = currentWeekLogs.filter(lw => lw.calories > 0).length >= 5;

        const lastCal = a.lastCalibrationDate ? new Date(a.lastCalibrationDate).getTime() : 0;
        const isDue = (Date.now() - lastCal) > (7 * 24 * 60 * 60 * 1000);

        if (currAvg !== null && prevAvg !== null && adherenceMet && isDue) {
          const actualWeekChange = currAvg - prevAvg;
          const plannedDailyDelta = getPlannedDailyDelta(g.mode, g.goalRate);
          const plannedWeekChange = (plannedDailyDelta * 7) / 3500;
          
          const gap = actualWeekChange - plannedWeekChange;
          let adjustment = 0;

          if (gap > 0.15) {
            adjustment = -75;
          } else if (gap < -0.15) {
            adjustment = 75;
          }

          if (adjustment !== 0) {
            const newBias = Math.min(Math.max(a.tdeeBias + adjustment, -500), 500);
            const updated: AdaptiveModel = {
              ...a,
              tdeeBias: newBias,
              lastCalibrationDate: new Date().toISOString()
            };
            await storage.setAdaptiveModel(updated);
            setAdaptive(updated);
            setAutoUpdateMessage(`Adaptive Update: Calories adjusted by ${adjustment > 0 ? '+' : ''}${adjustment} based on trends.`);
          }
        }
      }
    };
    fetchData();
  }, [storage]);

  if (!profile || !goals || !adaptive || logs.length === 0) {
    return (
      <div className="text-center py-20 flex flex-col items-center space-y-4">
        <p className="text-gray-500">Log data consistently to see your trends.</p>
      </div>
    );
  }

  const stepTarget = ACTIVITY_TARGETS[goals.activityStyle].steps;
  const azmTarget = ACTIVITY_TARGETS[goals.activityStyle].azm;
  const plannedDailyDelta = getPlannedDailyDelta(goals.mode, goals.goalRate);
  
  const chartData = logs.map(log => {
    const weight = log.weightLb || undefined;
    const bmr = calculateBMR(profile, weight || profile.startingWeightLb);
    const tdeeBase = calculateTDEEBase(bmr, goals.activityStyle);
    const calorieTarget = calculateCalorieTarget(tdeeBase, adaptive.tdeeBias, goals.mode, goals.goalRate);
    const achievedDelta = getPlanAchievedDelta({
      mode: goals.mode,
      plannedDailyDelta,
      caloriesEaten: log.calories,
      calorieTarget,
      steps: log.steps,
      stepsTarget: stepTarget,
      azm: log.azm,
      azmTarget: azmTarget
    });

    return {
      date: log.dateISO,
      weight: weight,
      rawDelta: achievedDelta || 0,
    };
  });

  const currentWeekLogs = logs.slice(-7);
  const getAvgWeight = (weekLogs: DailyLog[]) => {
    const valid = weekLogs.filter(l => (l.weightLb || 0) > 0);
    return valid.length > 0 ? valid.reduce((sum, l) => sum + (l.weightLb || 0), 0) / valid.length : null;
  };
  const currAvg = getAvgWeight(currentWeekLogs);

  return (
    <div className="space-y-8 pb-10">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Progress & Trends</h2>
          <p className="text-gray-500">Your metabolism tracked over time.</p>
        </div>
        <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100 flex items-center space-x-2">
          <RefreshCw size={14} className="text-blue-500 animate-spin-slow" />
          <span className="text-[10px] font-bold text-blue-700 uppercase">Adaptive Engine Active</span>
        </div>
      </header>

      {autoUpdateMessage && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-2xl text-white shadow-xl flex items-center space-x-4">
          <Sparkles size={20} className="flex-shrink-0" />
          <p className="text-sm font-medium">{autoUpdateMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Rolling Weight</p>
          <p className="text-xl font-bold">{currAvg ? currAvg.toFixed(1) : '---'} <span className="text-xs font-normal text-gray-400">lb</span></p>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">TDEE Bias</p>
          <p className="text-xl font-bold text-blue-600">{adaptive.tdeeBias > 0 ? `+${adaptive.tdeeBias}` : adaptive.tdeeBias} <span className="text-xs font-normal text-gray-400">kcal</span></p>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Logged (Wk)</p>
          <p className="text-xl font-bold">{currentWeekLogs.filter(l => l.calories > 0).length}/7 <span className="text-xs font-normal text-gray-400">days</span></p>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Last Update</p>
          <p className="text-[10px] font-bold text-gray-600 mt-1">{adaptive.lastCalibrationDate ? new Date(adaptive.lastCalibrationDate).toLocaleDateString() : 'Pending'}</p>
        </div>
      </div>

      <section className="bg-white p-6 rounded-2xl border shadow-sm">
        <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
          <Info size={18} className="text-gray-400" />
          <span>Bodyweight Trend</span>
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="date" hide />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Line type="monotone" dataKey="weight" stroke="#2563eb" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
