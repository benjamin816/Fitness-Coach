
import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, TrendingUp, Settings as SettingsIcon, Dumbbell, 
  ChevronRight, Plus, CheckCircle, AlertCircle, Trash2, Download, Upload 
} from 'lucide-react';

import { LocalIndexedDbProvider } from './db/DexieStorage';
import { 
  UserProfile, GoalSettings, DailyLog, StorageProvider, 
  AdaptiveModel, ActiveProgramState 
} from './types';
import { DEFAULT_TIMEZONE } from './constants';

import TodayPage from './pages/TodayPage';
import ProgressPage from './pages/ProgressPage';
import LiftingPage from './pages/LiftingPage';
import SettingsPage from './pages/SettingsPage';
import OnboardingPage from './pages/OnboardingPage';

const StorageContext = createContext<StorageProvider | null>(null);

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (!context) throw new Error('useStorage must be used within StorageProvider');
  return context;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navItems = [
    { label: 'Today', path: '/today', icon: LayoutDashboard },
    { label: 'Progress', path: '/progress', icon: TrendingUp },
    { label: 'Lifting', path: '/lifting', icon: Dumbbell },
    { label: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-0">
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-30 flex justify-between items-center md:hidden">
        <h1 className="text-xl font-bold text-blue-600">Fitness Coach</h1>
      </header>
      
      {/* Desktop Nav */}
      <nav className="hidden md:flex bg-white border-b sticky top-0 z-30 px-6 py-4 justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">Fitness Coach</h1>
        <div className="flex space-x-8">
          {navItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path} 
              className={`flex items-center space-x-2 font-medium ${
                location.pathname === item.path ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <main className="flex-grow p-4 md:p-8 max-w-4xl mx-auto w-full">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-3 px-2 z-30">
        {navItems.map((item) => (
          <Link 
            key={item.path}
            to={item.path} 
            className={`flex flex-col items-center space-y-1 ${
              location.pathname === item.path ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <item.icon size={24} />
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const storage = useMemo(() => new LocalIndexedDbProvider(), []);

  useEffect(() => {
    const init = async () => {
      const p = await storage.getUserProfile();
      setProfile(p);
      setLoading(false);
    };
    init();
  }, [storage]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <StorageContext.Provider value={storage}>
      <HashRouter>
        {!profile ? (
          <Routes>
            <Route path="*" element={<OnboardingPage onComplete={setProfile} />} />
          </Routes>
        ) : (
          <Layout>
            <Routes>
              <Route path="/today" element={<TodayPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/lifting" element={<LiftingPage />} />
              <Route path="/settings" element={<SettingsPage onReset={() => setProfile(null)} />} />
              <Route path="*" element={<Navigate to="/today" replace />} />
            </Routes>
          </Layout>
        )}
      </HashRouter>
    </StorageContext.Provider>
  );
};

export default App;
