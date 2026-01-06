
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useStorage } from '../../components/StorageContext';
import { UserProfile, GoalSettings, Sex, AdaptiveModel, GoalMode, ActivityStyle } from '../../lib/types';
import { Target, User, Zap, Download, Upload, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const storage = useStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<GoalSettings | null>(null);
  const [adaptive, setAdaptive] = useState<AdaptiveModel | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [p, g, a] = await Promise.all([
        storage.getUserProfile(),
        storage.getGoalSettings(),
        storage.getAdaptiveModel()
      ]);
      setProfile(p);
      setGoals(g);
      setAdaptive(a);
    };
    fetchData();
  }, [storage]);

  if (!profile || !goals || !adaptive) return null;

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const updated = { ...profile, ...updates, updatedAt: Date.now() };
    setProfile(updated);
    await storage.setUserProfile(updated);
  };

  const updateGoals = async (updates: Partial<GoalSettings>) => {
    setSaving(true);
    const updated = { ...goals, ...updates, updatedAt: Date.now() };
    setGoals(updated);
    await storage.setGoalSettings(updated);
    setTimeout(() => setSaving(false), 500);
  };

  const handleReset = async () => {
    if (confirm("Are you sure? This wipes all data locally.")) {
      await storage.resetAllData();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h2 className="text-2xl font-bold">Settings</h2>
      </header>

      <section className="bg-white p-6 rounded-2xl border shadow-sm space-y-6">
        <div className="flex items-center space-x-2">
          <Target className="text-blue-600" size={20} />
          <h3 className="text-lg font-bold">Goals</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select value={goals.mode} onChange={(e) => updateGoals({ mode: e.target.value as GoalMode })} className="p-3 bg-gray-50 border rounded-xl font-medium outline-none">
            <option value="fat-loss">Fat Loss</option>
            <option value="maintenance">Maintenance</option>
            <option value="muscle-gain">Muscle Gain</option>
          </select>
          <select value={goals.activityStyle} onChange={(e) => updateGoals({ activityStyle: e.target.value as ActivityStyle })} className="p-3 bg-gray-50 border rounded-xl font-medium outline-none">
            <option value="low-cardio">Low-cardio</option>
            <option value="standard">Standard</option>
            <option value="high-activity">High-activity</option>
          </select>
        </div>
      </section>

      <section className="bg-white p-6 rounded-2xl border shadow-sm space-y-6">
        <div className="flex items-center space-x-2">
          <User className="text-blue-600" size={20} />
          <h3 className="text-lg font-bold">Profile</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">Age</label>
            <input type="number" value={profile.ageYears} onChange={(e) => updateProfile({ ageYears: parseInt(e.target.value)||profile.ageYears })} className="w-full p-3 bg-gray-50 border rounded-xl" />
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <h3 className="text-lg font-bold">Data Management</h3>
        <div className="flex space-x-2">
          <button onClick={handleReset} className="flex-1 py-3 text-red-600 font-bold border-2 border-dashed border-red-100 rounded-xl">Wipe All Data</button>
        </div>
      </section>
    </div>
  );
}
