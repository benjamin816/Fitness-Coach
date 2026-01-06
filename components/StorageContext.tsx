
"use client";

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { LocalIndexedDbProvider } from '../lib/storage';
import { StorageProvider, UserProfile } from '../lib/types';

const StorageContext = createContext<StorageProvider | null>(null);

export const StorageProviderComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const storage = useMemo(() => new LocalIndexedDbProvider(), []);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <StorageContext.Provider value={storage}>
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (!context) throw new Error('useStorage must be used within StorageProvider');
  return context;
};
