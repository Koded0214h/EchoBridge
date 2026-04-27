/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useRef, useState } from 'react'

const STORAGE_KEYS = {
  preferences: 'echobridge.preferences',
  hasVisited: 'echobridge.hasVisited',
  lastInputMode: 'echobridge.lastInputMode',
  onboardingSeen: 'echobridge.onboardingSeen',
}

const defaultPreferences = {
  textSize: 'medium',
  ttsRate: 0.9,
  ttsVoice: '',   // empty = auto-select best available voice
  autoPlay: true,
  highContrast: 'system',
  motion: 'system',
}

const defaultContextValue = {
  userPreferences: defaultPreferences,
  updatePreferences: () => { throw new Error('useAppContext must be used within AppProvider') },
  appState: { isFirstVisit: true, hasSeenOnboarding: false, lastInputMode: 'voice', currentPage: '/' },
  setCurrentPage: () => { throw new Error('useAppContext must be used within AppProvider') },
  markVisited: () => { throw new Error('useAppContext must be used within AppProvider') },
  markOnboardingSeen: () => { throw new Error('useAppContext must be used within AppProvider') },
  setLastInputMode: () => { throw new Error('useAppContext must be used within AppProvider') },
  responseCache: { lastRequest: '', lastResponse: null },
  setResponseCache: () => { throw new Error('useAppContext must be used within AppProvider') },
}

const AppContext = createContext(defaultContextValue)

function readJSONStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return { ...fallback, ...JSON.parse(raw) }
  } catch {
    return fallback
  }
}

function readBooleanStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) === true
  } catch {
    return fallback
  }
}

function readStringStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    return window.localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

export function AppProvider({ children }) {
  const [userPreferences, setUserPreferences] = useState(() =>
    readJSONStorage(STORAGE_KEYS.preferences, defaultPreferences),
  )

  const [appState, setAppState] = useState(() => ({
    isFirstVisit: !readBooleanStorage(STORAGE_KEYS.hasVisited, false),
    hasSeenOnboarding: readBooleanStorage(STORAGE_KEYS.onboardingSeen, false),
    lastInputMode: readStringStorage(STORAGE_KEYS.lastInputMode, 'voice'),
    currentPage: '/',
  }))

  const [responseCache, setResponseCache] = useState({ lastRequest: '', lastResponse: null })

  // Apply theme attributes whenever preferences change
  useEffect(() => {
    document.documentElement.dataset.textSize = userPreferences.textSize
    document.documentElement.dataset.contrast = userPreferences.highContrast
    document.documentElement.dataset.motion = userPreferences.motion
  }, [userPreferences])

  // Debounced localStorage write — batches rapid preference toggles
  const debounceRef = useRef(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(userPreferences))
      } catch { /* quota exceeded or private browsing */ }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [userPreferences])

  const updatePreferences = (patch) => {
    setUserPreferences((prev) => ({ ...prev, ...patch }))
  }

  const setCurrentPage = (currentPage) => {
    setAppState((prev) => ({ ...prev, currentPage }))
  }

  const markVisited = () => {
    try { window.localStorage.setItem(STORAGE_KEYS.hasVisited, 'true') } catch { /* ignore */ }
    setAppState((prev) => ({ ...prev, isFirstVisit: false }))
  }

  const markOnboardingSeen = () => {
    // localStorage so onboarding doesn't repeat in new tabs
    try { window.localStorage.setItem(STORAGE_KEYS.onboardingSeen, 'true') } catch { /* ignore */ }
    setAppState((prev) => ({ ...prev, hasSeenOnboarding: true }))
  }

  const setLastInputMode = (mode) => {
    try { window.localStorage.setItem(STORAGE_KEYS.lastInputMode, mode) } catch { /* ignore */ }
    setAppState((prev) => ({ ...prev, lastInputMode: mode }))
  }

  return (
    <AppContext.Provider
      value={{
        userPreferences,
        updatePreferences,
        appState,
        setCurrentPage,
        markVisited,
        markOnboardingSeen,
        setLastInputMode,
        responseCache,
        setResponseCache,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppContext must be used within AppProvider')
  return context
}
