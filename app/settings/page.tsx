
"use client";

import React, { useState, useEffect } from 'react';
import { useStorage } from '../../components/StorageContext';
import { UserProfile, GoalSettings, GoalMode, ActivityStyle } from '../../lib/types';
import { Target, User, Download, Upload } from 'lucide-react';
import { z } from 'zod';

const profileSchema = z.object({
  age: z.number().min(16),
  weight: z.number().min(100).max(600)
});

export default function SettingsPage() {
  const storage = useStorage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<GoalSettings | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [p, g] = await Promise.all([storage.getUserProfile(), storage.getGoalSettings()]);
      setProfile(p); setGoals(g);
    };
    fetchData();
  }, [storage]);

  if (!profile || !goals) return null;

  const updateGoals = async (updates: Partial<GoalSettings>) => {
    const updated = { ...goals, ...updates, updatedAt: Date.now() };
    setGoals(updated);
    await storage.setGoalSettings(updated);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Settings</h2>
      <section className="bg-white p-6 rounded-2xl border shadow-sm space-y-6">
        <div className="flex items-center space-x-2"><Target className="text-blue-600" size={20} /><h3 className="text-lg font-bold">Goals</h3></div>
        <select value={goals.mode} onChange={(e) => updateGoals({ mode: e.target.value as GoalMode })} className="w-full p-3 border rounded-xl">
          <option value="fat-loss">Fat Loss</option>
          <option value="maintenance">Maintenance</option>
          <option value="muscle-gain">Muscle Gain</option>
        </select>
      </section>
      <button onClick={() => storage.resetAllData().then(() => window.location.reload())} className="w-full py-3 text-red-600 border-2 border-dashed rounded-xl">Wipe All Data</button>
    </div>
  );
}
