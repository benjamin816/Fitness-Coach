
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
import { 
  Dumbbell, Play, Sparkles, ChevronRight, 
  Check, X, ArrowLeft, Save, TrendingUp, List, Zap, CalendarCheck
} from 'lucide-react';

export default function LiftingPage() {
  const storage = useStorage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<GoalSettings | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activeState, setActiveState] = useState<ActiveProgramState | null>(null);
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [lastSession, setLastSession] = useState<WorkoutSession | null>(null);
  
  const [view, setView] = useState<'list' | 'logging'>('list');
  const [previewProgram, setPreviewProgram] = useState<Program | null>(null);
  const [previewData, setPreviewData] = useState<{ workouts: ProgramWorkout[], exercises: Record<string, ProgramExercise[]> } | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generated, setGenerated] = useState<{ program: Program, workouts: ProgramWorkout[], exercises: ProgramExercise[] } | null>(null);

  const [genEquipment, setGenEquipment] = useState({ db: true, barbell: false, bench: true, pullup: false });
  const [genExperience, setGenExperience] = useState<'beginner' | 'intermediate'>('beginner');
  const [genNotes, setGenNotes] = useState('');
  
  const [currentWorkout, setCurrentWorkout] = useState<{
    workout: ProgramWorkout;
    exercises: ProgramExercise[];
    logs: Record<string, { weight: number, reps: number, hitFailure: boolean }[]>;
    targets: Record<string, ProgressionTarget>;
  } | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const init = async () => {
      const [p, g, progs, state, log, sessions] = await Promise.all([
        storage.getUserProfile(),
        storage.getGoalSettings(),
        storage.getPrograms(),
        storage.getActiveProgramState(),
        storage.getDailyLogByDate(todayStr),
        storage.getWorkoutSessions(1)
      ]);
      setProfile(p);
      setGoals(g);
      setPrograms(progs);
      setActiveState(state);
      setTodayLog(log);
      setLastSession(sessions[0] || null);
    };
    init();
  }, [storage, todayStr, view]);

  useEffect(() => {
    const loadPreview = async () => {
      if (previewProgram) {
        const workouts = await storage.getProgramWorkouts(previewProgram.id);
        const exerciseMap: Record<string, ProgramExercise[]> = {};
        for (const w of workouts) {
          exerciseMap[w.id] = await storage.getProgramExercises(w.id);
        }
        setPreviewData({ workouts, exercises: exerciseMap });
      }
    };
    loadPreview();
  }, [previewProgram, storage]);

  const handleConfirmStartProgram = async (programId: string) => {
    const newState: ActiveProgramState = {
      id: 'active',
      activeProgramId: programId,
      startDateISO: new Date().toISOString().split('T')[0],
      currentWeekNumber: 1,
      cycleMode: 'deterministic',
      updatedAt: Date.now()
    };
    await storage.setActiveProgramState(newState);
    setActiveState(newState);
    setPreviewProgram(null);
  };

  const handleStartWorkout = async () => {
    if (!activeState || !activeProgram || !profile) return;
    const workouts = await storage.getProgramWorkouts(activeProgram.id);
    const recentSessions = await storage.getWorkoutSessions(10);
    let nextDayLabel = 'A';
    if (recentSessions.length > 0 && recentSessions[0].programId === activeProgram.id) {
      nextDayLabel = recentSessions[0].dayLabel === 'A' ? 'B' : 'A';
    }
    const workout = workouts.find(w => w.dayLabel === nextDayLabel) || workouts[0];
    const exercises = await storage.getProgramExercises(workout.id);
    const initialLogs: any = {};
    const targets: any = {};
    for (const ex of exercises) {
      const history = await storage.getRecentExerciseEntries(ex.exerciseKey);
      const target = calculateNextTarget(ex, history);
      targets[ex.id] = target;
      const initialWeight = target.weight ?? (history.length > 0 ? history[0].weight : getStartingWeightSuggestion(profile, ex.exerciseKey)) ?? 0;
      initialLogs[ex.id] = Array.from({ length: ex.sets }, () => ({ 
        weight: initialWeight, 
        reps: target.reps, 
        hitFailure: false 
      }));
    }
    setCurrentWorkout({ workout, exercises, logs: initialLogs, targets });
    setView('logging');
  };

  const handleSaveWorkout = async () => {
    if (!currentWorkout || !activeProgram) return;
    const sessionId = crypto.randomUUID();
    const session: WorkoutSession = { id: sessionId, dateISO: todayStr, programId: activeProgram.id, dayLabel: currentWorkout.workout.dayLabel, createdAt: Date.now() };
    const entries: ExerciseEntry[] = [];
    Object.entries(currentWorkout.logs).forEach(([exId, sets]: [string, any]) => {
      const exercise = currentWorkout.exercises.find(e => e.id === exId);
      if (!exercise) return;
      sets.forEach((set: any, idx: number) => {
        if (set.reps > 0) entries.push({ id: crypto.randomUUID(), sessionId, exerciseKey: exercise.exerciseKey, setIndex: idx, reps: set.reps, weight: set.weight, hitFailure: set.hitFailure, createdAt: Date.now() });
      });
    });
    await storage.saveWorkoutSession(session, entries);
    const log = await storage.getDailyLogByDate(todayStr);
    await storage.upsertDailyLog({ ...(log || { dateISO: todayStr, calories: 0, steps: 0, azm: 0, createdAt: Date.now() }), workoutDone: true, updatedAt: Date.now() } as DailyLog);
    setView('list');
    setCurrentWorkout(null);
  };

  const activeProgram = programs.find(p => p.id === activeState?.activeProgramId);
  const workoutDoneToday = todayLog?.workoutDone || (lastSession?.dateISO === todayStr);

  if (view === 'logging' && currentWorkout) {
    return (
      <div className="space-y-6">
        <header className="flex items-center space-x-4">
          <button onClick={() => setView('list')} className="p-2 bg-white border rounded-full shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div><h2 className="text-xl font-bold">Session {currentWorkout.workout.dayLabel}</h2></div>
        </header>
        <div className="space-y-4">
          {currentWorkout.exercises.map((ex) => {
            const meta = getExerciseMetadata(ex.exerciseKey);
            const target = currentWorkout.targets[ex.id];
            return (
              <div key={ex.id} className="bg-white p-4 rounded-2xl border shadow-sm">
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900">{meta.name}</h3>
                  <p className="text-[10px] text-purple-600 font-bold uppercase">Target: {target.weight ? `${target.weight}lb ` : ''}{target.reps} reps</p>
                </div>
                <div className="space-y-3">
                  {currentWorkout.logs[ex.id].map((set, setIdx) => (
                    <div key={setIdx} className="flex items-center gap-2">
                      <span className="w-8 text-[10px] font-bold text-gray-400">Set {setIdx+1}</span>
                      <input type="number" placeholder="lb" value={set.weight || ''} onChange={(e) => { const n = {...currentWorkout.logs}; n[ex.id][setIdx].weight = parseFloat(e.target.value)||0; setCurrentWorkout({...currentWorkout, logs: n}) }} className="w-20 p-2 bg-gray-50 border rounded-xl text-center font-bold" />
                      <input type="number" placeholder="reps" value={set.reps || ''} onChange={(e) => { const n = {...currentWorkout.logs}; n[ex.id][setIdx].reps = parseInt(e.target.value)||0; setCurrentWorkout({...currentWorkout, logs: n}) }} className="w-20 p-2 bg-gray-50 border rounded-xl text-center font-bold" />
                      <button onClick={() => { const n = {...currentWorkout.logs}; n[ex.id][setIdx].hitFailure = !n[ex.id][setIdx].hitFailure; setCurrentWorkout({...currentWorkout, logs: n}) }} className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 ${set.hitFailure ? 'bg-red-50 border-red-200 text-red-500' : 'bg-gray-50 text-gray-300'}`}><Zap size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={handleSaveWorkout} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center space-x-2"><Save size={20} /><span>Save Session</span></button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div><h2 className="text-2xl font-bold">Lifting</h2></div>
        <button onClick={() => setShowGenerator(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 font-bold text-sm shadow-lg"><Sparkles size={18} /><span>AI Builder</span></button>
      </header>

      {activeState && activeProgram ? (
        <section className={`p-6 rounded-3xl text-white shadow-xl relative overflow-hidden ${workoutDoneToday ? 'bg-emerald-600' : 'bg-blue-600'}`}>
          <div className="relative z-10 space-y-4">
            <h3 className="text-xl font-bold">{activeProgram.name}</h3>
            {workoutDoneToday ? <p className="text-sm">Great work! You're done for today.</p> : <button onClick={handleStartWorkout} className="w-full bg-white text-blue-700 font-bold py-4 rounded-2xl flex items-center justify-center space-x-2"><Play size={20} fill="currentColor" /><span>Start Session</span></button>}
          </div>
        </section>
      ) : (
        <div className="bg-white p-12 rounded-3xl border-2 border-dashed text-center"><Dumbbell className="mx-auto text-gray-200 mb-2" size={48} /><p className="text-gray-500">Choose a program to start.</p></div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {programs.map(p => (
          <div key={p.id} onClick={() => setPreviewProgram(p)} className="bg-white p-5 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer">
            <div><h4 className="font-bold">{p.name}</h4><p className="text-xs text-gray-400">{p.lengthWeeks} weeks</p></div>
            <ChevronRight size={18} className="text-gray-300" />
          </div>
        ))}
      </div>

      {previewProgram && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6">
            <div className="flex justify-between items-center"><div><h3 className="text-xl font-bold">{previewProgram.name}</h3></div><button onClick={() => setPreviewProgram(null)}><X size={24} /></button></div>
            <button onClick={() => handleConfirmStartProgram(previewProgram.id)} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl">Start Program</button>
          </div>
        </div>
      )}

      {showGenerator && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full space-y-6">
            <h3 className="text-2xl font-bold">AI Program Builder</h3>
            <div className="space-y-4">
              <textarea placeholder="Any specific requirements?" value={genNotes} onChange={(e) => setGenNotes(e.target.value)} className="w-full p-4 bg-gray-50 border rounded-2xl h-24" />
              <button onClick={() => { if(profile && goals) setGenerated(generateHeuristicProgram(profile, goals.mode, { equipment: genEquipment, experience: genExperience, userNotes: genNotes })); setShowGenerator(false); }} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl">Generate</button>
            </div>
          </div>
        </div>
      )}

      {generated && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-8 space-y-6">
            <h3 className="text-xl font-bold">Plan Ready</h3>
            <div className="flex space-x-2">
              <button onClick={() => setGenerated(null)} className="flex-1 py-4 font-bold text-gray-400">Discard</button>
              <button onClick={async () => { await storage.saveCustomProgram(generated.program, generated.workouts, generated.exercises); setPrograms([...programs, generated.program]); setGenerated(null); }} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
