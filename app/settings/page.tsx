
"use client";

import React, { useState, useEffect } from 'react';
import { useStorage } from '../../components/StorageContext';
import { UserProfile, GoalSettings, GoalMode } from '../../lib/types';
import { Target, Trash2 } from 'lucide-react';
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
      setProfile(p);
      setGoals(g);
    };
    fetchData();
  }, [storage]);

  if (!profile || !goals) return null;

  const updateGoals = async (updates: Partial<GoalSettings>) => {
    const updated = { ...goals, ...updates, updatedAt: Date.now() };
    setGoals(updated);
    await storage.setGoalSettings(updated);
  };

  const handleReset = async () => {
    if (confirm("Are you sure? This wipes all data locally.")) {
      await storage.resetAllData();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Settings</h2>
      
      <section className="bg-white p-6 rounded-2xl border shadow-sm space-y-6">
        <div className="flex items-center space-x-2">
          <Target className="text-blue-600" size={20} />
          <h3 className="text-lg font-bold">Goals</h3>
        </div>
        <div className="space-y-4">
          <label className="text-xs font-bold text-gray-400 uppercase">Coach Mode</label>
          <select 
            value={goals.mode} 
            onChange={(e) => updateGoals({ mode: e.target.value as GoalMode })} 
            className="w-full p-3 border rounded-xl bg-gray-50 font-medium outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="fat-loss">Fat Loss</option>
            <option value="maintenance">Maintenance</option>
            <option value="muscle-gain">Muscle Gain</option>
          </select>
        </div>
      </section>

      <button 
        onClick={handleReset} 
        className="w-full py-4 text-red-600 border-2 border-dashed border-red-100 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-red-50 transition-colors"
      >
        <Trash2 size={18} />
        <span>Wipe All Local Data</span>
      </button>
    </div>
  );
}
