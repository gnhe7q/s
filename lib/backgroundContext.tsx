'use client';
import { createContext, useContext, ReactNode } from 'react';

interface BackgroundContextType {
  // 保留空接口以保持兼容性
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export function BackgroundProvider({ children }: { children: ReactNode }) {
  return (
    <BackgroundContext.Provider value={{}}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
}