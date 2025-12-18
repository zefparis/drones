/**
 * HCS Store - State management avec Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, TamperReport } from '../index';

interface HcsState {
  // Profile
  profile: UserProfile | null;
  isAuthenticated: boolean;
  deviceCredential: string | null;
  
  // Security
  isDuressMode: boolean;
  tamperReport: TamperReport | null;
  isLocked: boolean;
  
  // Tests
  completedTests: string[];
  currentTestType: string | null;
  
  // HCS Code
  hcsCode: string | null;
  
  // Actions
  setProfile: (profile: UserProfile | null) => void;
  setAuthenticated: (auth: boolean) => void;
  setDeviceCredential: (cred: string | null) => void;
  setDuressMode: (active: boolean) => void;
  setTamperReport: (report: TamperReport | null) => void;
  setLocked: (locked: boolean) => void;
  addCompletedTest: (testType: string) => void;
  setCurrentTestType: (type: string | null) => void;
  setHcsCode: (code: string | null) => void;
  reset: () => void;
}

const initialState = {
  profile: null,
  isAuthenticated: false,
  deviceCredential: null,
  isDuressMode: false,
  tamperReport: null,
  isLocked: false,
  completedTests: [],
  currentTestType: null,
  hcsCode: null,
};

export const useHcsStore = create<HcsState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setProfile: (profile) => set({ profile }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setDeviceCredential: (deviceCredential) => set({ deviceCredential }),
      setDuressMode: (isDuressMode) => set({ isDuressMode }),
      setTamperReport: (tamperReport) => set({ tamperReport }),
      setLocked: (isLocked) => set({ isLocked }),
      addCompletedTest: (testType) => set((state) => ({
        completedTests: state.completedTests.includes(testType) 
          ? state.completedTests 
          : [...state.completedTests, testType]
      })),
      setCurrentTestType: (currentTestType) => set({ currentTestType }),
      setHcsCode: (hcsCode) => set({ hcsCode }),
      reset: () => set(initialState),
    }),
    {
      name: 'hcs-storage',
      partialize: (state) => ({
        deviceCredential: state.deviceCredential,
        completedTests: state.completedTests,
        hcsCode: state.hcsCode,
      }),
    }
  )
);

/**
 * Hook pour accéder au profil avec gestion duress
 */
export function useProfile() {
  const { profile, isDuressMode } = useHcsStore();
  return { profile, isDuressMode };
}

/**
 * Hook pour la sécurité
 */
export function useSecurity() {
  const { tamperReport, isLocked, isDuressMode, setLocked, setTamperReport } = useHcsStore();
  return { tamperReport, isLocked, isDuressMode, setLocked, setTamperReport };
}

/**
 * Hook pour les tests cognitifs
 */
export function useCognitiveTests() {
  const { completedTests, currentTestType, addCompletedTest, setCurrentTestType } = useHcsStore();
  
  const isTestCompleted = (testType: string) => completedTests.includes(testType);
  const completedCount = completedTests.length;
  const allTestsCompleted = completedCount >= 5;
  
  return {
    completedTests,
    currentTestType,
    addCompletedTest,
    setCurrentTestType,
    isTestCompleted,
    completedCount,
    allTestsCompleted,
  };
}
