
"use client";

import React, { useState } from 'react';
import { useStorage } from '../../components/StorageContext';
import { UserProfile, GoalSettings, Sex, ActivityStyle, GoalMode } from '../../lib/types';
import { DEFAULT_TIMEZONE } from '../../lib/constants';
import { feetInchesToCm } from '../../lib/calculators';

interface OnboardingPageProps {
  onComplete: (profile: UserProfile) => void;
}

export default function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const storage = useStorage();
  const [step, setStep] = useState(1);
  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState(25);
  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(9);
  const [weight, setWeight] = useState(165);
  const [mode, setMode] = useState<GoalMode>('fat-loss');

  const handleFinish = async () => {
    const heightCm = feetInchesToCm(heightFt, heightIn);
    const profile: UserProfile = { id: 'me', sex, ageYears: age, heightCm, startingWeightLb: weight, timezone: DEFAULT_TIMEZONE, createdAt: Date.now(), updatedAt: Date.now() };
    const goals: GoalSettings = { id: 'current', mode, goalRate: 1, activityStyle: 'standard', targetWeightCustomized: false, startDateISO: new Date().toISOString().split('T')[0], updatedAt: Date.now() };
    await storage.setUserProfile(profile);
    await storage.setGoalSettings(goals);
    onComplete(profile);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">Welcome</h1>
        {step === 1 ? (
          <div className="space-y-6">
            <button onClick={() => setStep(2)} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg">Start Profile</button>
          </div>
        ) : (
          <div className="space-y-6">
            <input type="number" value={weight} onChange={e => setWeight(parseInt(e.target.value))} className="w-full p-4 border rounded-xl" placeholder="Weight (lb)" />
            <button onClick={handleFinish} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold">Finish</button>
          </div>
        )}
      </div>
    </div>
  );
}
