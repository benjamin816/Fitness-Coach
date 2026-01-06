
"use client";

import React, { useState, useEffect } from 'react';
import { useStorage } from '../../components/StorageContext';
import { 
  Program, ProgramWorkout, ProgramExercise, ActiveProgramState, 
  WorkoutSession, ExerciseEntry, UserProfile, GoalSettings, DailyLog
} from '../../lib/types';
import { generateHeuristicProgram } from '../../lib/training/generator';
import { getExerciseMetadata } from '../../lib/training/catalog';
import { getStartingWeightSuggestion, calculateNextTarget, ProgressionTarget } from '../../lib/training/progression';
import { Dumbbell, Play, Sparkles, ChevronRight, X, ArrowLeft, Save, Zap } from 'lucide-react';

export default function LiftingPage() {
  const storage = useStorage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<GoalSettings | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activeState, setActiveState] = useState<ActiveProgramState | null>(null);
  const [view, setView] = useState<'list' | 'logging'>('list');
  const [currentWorkout, setCurrentWorkout] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const todayISO = new Date().toISOString().split('T')[0];
      const [p, g, progs, state] = await Promise.all([
        storage.getUserProfile(),
        storage.getGoalSettings(),
        storage.getPrograms(),
        storage.getActiveProgramState()
      ]);
      setProfile(p);
      setGoals(g);
      setPrograms(progs);
      setActiveState(state);
    };
    init();
  }, [storage, view]);

  const handleStartWorkout = async () => {
    if (!activeState || !profile) return;
    const workouts = await storage.getProgramWorkouts(activeState.activeProgramId);
    const workout = workouts[0];
    const exercises = await storage.getProgramExercises(workout.id);
    const initialLogs: any = {};
    const targets: any = {};
    for (const ex of exercises) {
      const history = await storage.getRecentExerciseEntries(ex.exerciseKey);
      const target = calculateNextTarget(ex, history);
      targets[ex.id] = target;
      initialLogs[ex.id] = Array.from({ length: ex.sets }, () => ({ 
        weight: target.weight || 0, 
        reps: target.reps, 
        hitFailure: false 
      }));
    }
    setCurrentWorkout({ workout, exercises, logs: initialLogs, targets });
    setView('logging');
  };

  const activeProgram = programs.find(p => p.id === activeState?.activeProgramId);

  if (view === 'logging' && currentWorkout) {
    return (
      <div className="space-y-6">
        <header className="flex items-center space-x-4">
          <button onClick={() => setView('list')} className="p-2 bg-white border rounded-full shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold">Session {currentWorkout.workout.dayLabel}</h2>
        </header>
        <div className="space-y-4">
          {currentWorkout.exercises.map((ex: any) => (
            <div key={ex.id} className="bg-white p-4 rounded-2xl border shadow-sm">
              <h3 className="font-bold">{getExerciseMetadata(ex.exerciseKey).name}</h3>
              <div className="mt-4 space-y-3">
                {currentWorkout.logs[ex.id].map((set: any, idx: number) => (
                  <div key={idx} className="flex gap-2">
                     <input 
                       type="number" 
                       value={set.weight} 
                       onChange={(e) => { 
                         const n = {...currentWorkout.logs}; 
                         n[ex.id][idx].weight = parseFloat(e.target.value) || 0; 
                         setCurrentWorkout({...currentWorkout, logs: n}) 
                       }} 
                       className="w-20 p-2 border rounded-xl bg-gray-50" 
                       placeholder="lb"
                     />
                     <input 
                       type="number" 
                       value={set.reps} 
                       onChange={(e) => { 
                         const n = {...currentWorkout.logs}; 
                         n[ex.id][idx].reps = parseInt(e.target.value) || 0; 
                         setCurrentWorkout({...currentWorkout, logs: n}) 
                       }} 
                       className="w-20 p-2 border rounded-xl bg-gray-50" 
                       placeholder="reps"
                     />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setView('list')} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg">
          Save Session
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Lifting</h2>
        <button 
          onClick={() => {}} 
          className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 shadow-sm font-bold text-sm"
        >
          <Sparkles size={18} />
          <span>AI Builder</span>
        </button>
      </header>

      {activeState && activeProgram ? (
        <section className="p-6 rounded-3xl bg-blue-600 text-white shadow-xl">
          <h3 className="text-xl font-bold">{activeProgram.name}</h3>
          <button 
            onClick={handleStartWorkout} 
            className="mt-6 w-full bg-white text-blue-700 font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 shadow-sm"
          >
            <Play size={20} fill="currentColor" />
            <span>Start Session</span>
          </button>
        </section>
      ) : (
        <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-gray-200 text-center flex flex-col items-center">
          <Dumbbell className="text-gray-200 mb-4" size={48} />
          <p className="text-gray-500 font-medium">Select a program to begin training.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {programs.map(p => (
          <div 
            key={p.id} 
            className="bg-white p-5 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer hover:border-blue-400 transition-all"
          >
            <div>
              <h4 className="font-bold">{p.name}</h4>
              <p className="text-xs text-gray-400">{p.lengthWeeks} weeks</p>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </div>
        ))}
      </div>
    </div>
  );
}
