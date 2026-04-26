/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEYS = {
  preferences: 'echobridge.preferences',
  hasVisited: 'echobridge.hasVisited',
  lastInputMode: 'echobridge.lastInputMode',
  onboardingSeen: 'echobridge.onboardingSeen',
}

const defaultPreferences = {
  textSize: 'medium',
  ttsRate: 0.9,
  autoPlay: true,
  highContrast: 'system',
  motion: 'system',
}

const defaultAppState = {
  isFirstVisit: true,
  hasSeenOnboarding: false,
  lastInputMode: 'voice',
  currentPage: '/',
}

const defaultContextValue = {
  userPreferences: defaultPreferences,
  updatePreferences: () => undefined,
  appState: defaultAppState,
  setCurrentPage: () => undefined,
  markVisited: () => undefined,
  markOnboardingSeen: () => undefined,
  setLastInputMode: () => undefined,
  responseCache: {
    lastRequest: '',
    lastResponse: null,
  },
  setResponseCache: () => undefined,
}

const AppContext = createContext(defaultContextValue)

function readJSONStorage(key, fallback) {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const rawValue = window.localStorage.getItem(key)

    if (!rawValue) {
      return fallback
    }

    return {
      ...fallback,
      ...JSON.parse(rawValue),
    }
  } catch {
    return fallback
  }
}

function readBooleanStorage(key, fallback) {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const rawValue = window.localStorage.getItem(key)
    return rawValue === null ? fallback : rawValue === 'true'
  } catch {
    return fallback
  }
}

function readSessionBoolean(key, fallback) {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const rawValue = window.sessionStorage.getItem(key)
    return rawValue === null ? fallback : rawValue === 'true'
  } catch {
    return fallback
  }
}

function readSessionValue(key, fallback) {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const rawValue = window.sessionStorage.getItem(key)
    return rawValue === null ? fallback : rawValue
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
    hasSeenOnboarding: readSessionBoolean(STORAGE_KEYS.onboardingSeen, false),
    lastInputMode: readSessionValue(STORAGE_KEYS.lastInputMode, 'voice'),
    currentPage: '/',
  }))
  const [responseCache, setResponseCache] = useState({
    lastRequest: '',
    lastResponse: null,
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(userPreferences))
    } catch {
      return undefined
    }
  }, [userPreferences])

  const updatePreferences = (patch) => {
    setUserPreferences((currentPreferences) => ({
      ...currentPreferences,
      ...patch,
    }))
  }

  const setCurrentPage = (currentPage) => {
    setAppState((currentState) => ({
      ...currentState,
      currentPage,
    }))
  }

  const markVisited = () => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.hasVisited, 'true')
    } catch {
      return undefined
    }

    setAppState((currentState) => ({
      ...currentState,
      isFirstVisit: false,
    }))
  }

  const markOnboardingSeen = () => {
    try {
      window.sessionStorage.setItem(STORAGE_KEYS.onboardingSeen, 'true')
    } catch {
      return undefined
    }

    setAppState((currentState) => ({
      ...currentState,
      hasSeenOnboarding: true,
    }))
  }

  const setLastInputMode = (mode) => {
    try {
      window.sessionStorage.setItem(STORAGE_KEYS.lastInputMode, mode)
    } catch {
      return undefined
    }

    setAppState((currentState) => ({
      ...currentState,
      lastInputMode: mode,
    }))
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

  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }

  return context
}
