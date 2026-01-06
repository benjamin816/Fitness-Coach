
"use client";

import React, { useState } from 'react';
import { useStorage } from '../../components/StorageContext';
import { UserProfile, GoalSettings, Sex, GoalMode } from '../../lib/types';
import { DEFAULT_TIMEZONE } from '../../lib/constants';
import { feetInchesToCm } from '../../lib/calculators';

export default function OnboardingPage({ onComplete }: { onComplete: (p: UserProfile) => void }) {
  const storage = useStorage();
  const [step, setStep] = useState(1);
  const [weight, setWeight] = useState(165);

  const handleFinish = async () => {
    const p: UserProfile = { id: 'me', sex: 'male', ageYears: 25, heightCm: 175, startingWeightLb: weight, timezone: DEFAULT_TIMEZONE, createdAt: Date.now(), updatedAt: Date.now() };
    const g: GoalSettings = { id: 'current', mode: 'fat-loss', goalRate: 1, activityStyle: 'standard', targetWeightCustomized: false, startDateISO: new Date().toISOString().split('T')[0], updatedAt: Date.now() };
    await storage.setUserProfile(p);
    await storage.setGoalSettings(g);
    onComplete(p);
  };

  return (
    <div className="max-w-md mx-auto py-20 px-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl border">
        <h1 className="text-2xl font-bold mb-6">Setup Profile</h1>
        {step === 1 ? (
          <button onClick={() => setStep(2)} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold">Start</button>
        ) : (
          <div className="space-y-4">
            <input type="number" value={weight} onChange={e => setWeight(parseInt(e.target.value))} className="w-full p-4 border rounded-xl" placeholder="Weight" />
            <button onClick={handleFinish} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold">Finish</button>
          </div>
        )}
      </div>
    </div>
  );
}
