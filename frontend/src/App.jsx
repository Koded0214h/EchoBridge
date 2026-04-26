import { useCallback, useEffect, useRef, useState } from 'react'
import { AppProvider, useAppContext } from './context/AppContext.jsx'
import { ResourceModal } from './components/ResourceModal.jsx'
import { VoiceInputButton } from './components/VoiceInputButton.jsx'
import { DEFAULT_RESOURCE, RESOURCES, findBestResource } from './data/resources.js'
import {
  isRecognitionSupported,
  isSpeechSupported,
  speak,
  speakOnboardingPrompt,
  speakWelcomeMessage,
  stopSpeaking,
} from './services/audioService.js'
import './App.css'

const ROUTES = new Set(['/', '/home', '/resources', '/settings'])

function getPathname() {
  return window.location.pathname || '/'
}

function navigate(pathname, replace = false) {
  if (replace) {
    window.history.replaceState({}, '', pathname)
  } else {
    window.history.pushState({}, '', pathname)
  }

  window.dispatchEvent(new PopStateEvent('popstate'))
}

function readSessionValue(key) {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSessionValue(key, value) {
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    return undefined
  }
}

function clearSessionValue(key) {
  try {
    window.sessionStorage.removeItem(key)
  } catch {
    return undefined
  }
}

function AppFrame() {
  const {
    appState,
    markOnboardingSeen,
    markVisited,
    responseCache,
    setCurrentPage,
    setLastInputMode,
    setResponseCache,
    updatePreferences,
    userPreferences,
  } = useAppContext()
  const [pathname, setPathname] = useState(() => getPathname())
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const handlePopState = () => setPathname(getPathname())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    setCurrentPage(pathname)
    document.documentElement.dataset.textSize = userPreferences.textSize
    document.documentElement.dataset.contrast = userPreferences.highContrast
    document.documentElement.dataset.motion = userPreferences.motion
  }, [pathname, setCurrentPage, userPreferences])

  useEffect(() => {
    if (pathname === '/' && appState.isFirstVisit === false) {
      navigate('/home', true)
    }
  }, [appState.isFirstVisit, pathname])

  let content

  if (!ROUTES.has(pathname)) {
    content = <NotFoundPage onNavigate={navigate} />
  } else if (pathname === '/') {
    content = (
      <SplashScreen
        onAdvance={() => {
          markVisited()
          navigate('/home', true)
        }}
        onNotify={setNotice}
        preferences={userPreferences}
      />
    )
  } else if (pathname === '/resources') {
    content = (
      <ResourcesPage
        onNavigate={navigate}
        onNotify={setNotice}
        preferences={userPreferences}
      />
    )
  } else if (pathname === '/settings') {
    content = <SettingsPage onNavigate={navigate} />
  } else {
    content = (
      <HomePage
        appState={appState}
        markOnboardingSeen={markOnboardingSeen}
        onNavigate={navigate}
        onNotify={setNotice}
        responseCache={responseCache}
        setLastInputMode={setLastInputMode}
        setResponseCache={setResponseCache}
        updatePreferences={updatePreferences}
        userPreferences={userPreferences}
      />
    )
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="site-header">
        <div className="brand-lockup">
          <p className="eyebrow">EchoBridge</p>
          <h1>Help that speaks and listens.</h1>
        </div>

        <nav aria-label="Primary navigation" className="site-nav">
          <a className="site-nav__link" href="/home" onClick={(event) => { event.preventDefault(); navigate('/home') }}>
            Home
          </a>
          <a className="site-nav__link" href="/resources" onClick={(event) => { event.preventDefault(); navigate('/resources') }}>
            Resources
          </a>
          <a className="site-nav__link" href="/settings" onClick={(event) => { event.preventDefault(); navigate('/settings') }}>
            Settings
          </a>
        </nav>
      </header>

      {notice ? (
        <div aria-live="polite" className="global-notice" role="status">
          {notice}
        </div>
      ) : null}

      <main id="main-content" className="main-stage" tabIndex={-1}>
        {content}
      </main>

      <footer className="site-footer">
        <p>
          Keyboard ready, speech ready, and designed to stay clear when speech is not available.
        </p>
        <p>
          Speech recognition support: {isRecognitionSupported() ? 'available' : 'typing only'} · TTS support: {isSpeechSupported() ? 'available' : 'not available'}
        </p>
      </footer>
    </div>
  )
}

function SplashScreen({ onAdvance, onNotify, preferences }) {
  const [closing, setClosing] = useState(false)
  const [needsGesture, setNeedsGesture] = useState(false)
  const autoAdvanceTimer = useRef(null)

  const handleAdvance = useCallback(() => {
    if (closing) {
      return
    }

    setClosing(true)
    window.setTimeout(onAdvance, 500)
  }, [closing, onAdvance])

  useEffect(() => {
    let cancelled = false

    const speakWelcome = async () => {
      if (!isSpeechSupported()) {
        setNeedsGesture(true)
        return
      }

      try {
        await speakWelcomeMessage(preferences.ttsRate)
      } catch {
        if (!cancelled) {
          setNeedsGesture(true)
        }
      }
    }

    speakWelcome()
    autoAdvanceTimer.current = window.setTimeout(() => {
      if (!cancelled) {
        handleAdvance()
      }
    }, 4000)

    return () => {
      cancelled = true

      if (autoAdvanceTimer.current) {
        window.clearTimeout(autoAdvanceTimer.current)
      }
    }
  }, [handleAdvance, preferences.ttsRate])

  async function handleReplay(event) {
    event.stopPropagation()

    try {
      await speakWelcomeMessage(preferences.ttsRate)
      setNeedsGesture(false)
    } catch {
      setNeedsGesture(true)
      onNotify('Welcome speech is blocked. You can continue without audio.')
    }
  }

  return (
    <section
      aria-describedby="welcome-copy"
      aria-labelledby="welcome-title"
      className={`splash-screen ${closing ? 'splash-screen--closing' : ''}`}
      onClick={handleAdvance}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleAdvance()
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="splash-screen__panel">
        <p className="eyebrow eyebrow--gold">Welcome</p>
        <h2 id="welcome-title">You are not alone.</h2>
        <p id="welcome-copy">
          Help is here. EchoBridge can speak with you, listen to you, and let you type when that is easier.
        </p>

        {needsGesture ? (
          <button className="primary-button primary-button--gold" type="button" onClick={handleReplay}>
            Click here to hear the welcome message
          </button>
        ) : null}

        <p className="splash-screen__hint">Tap, click, or press Enter to continue.</p>
      </div>
    </section>
  )
}

function OnboardingPrompt({ onBrowse, onComplete, onNotify, onRequest, preferences }) {
  const [draft, setDraft] = useState('')
  const [needsGesture, setNeedsGesture] = useState(false)

  useEffect(() => {
    let cancelled = false

    const speakPrompt = async () => {
      if (!isSpeechSupported()) {
        setNeedsGesture(true)
        return
      }

      try {
        await speakOnboardingPrompt(preferences.ttsRate)
      } catch {
        if (!cancelled) {
          setNeedsGesture(true)
        }
      }
    }

    speakPrompt()

    return () => {
      cancelled = true
    }
  }, [preferences.ttsRate])

  function submitRequest(requestText, mode) {
    const trimmedText = requestText.trim()

    if (!trimmedText) {
      onNotify('Please speak or type a request before continuing.')
      return
    }

    writeSessionValue('echobridge.pendingRequest', trimmedText)
    writeSessionValue('echobridge.pendingInputMode', mode)
    onRequest(mode)
    onComplete()
  }

  return (
    <section className="onboarding-card" aria-labelledby="onboarding-title">
      <div className="panel-header">
        <p className="eyebrow">Onboarding</p>
        <h2 id="onboarding-title">How would you like to get help today?</h2>
        <p>Speak, type, or browse the help catalog. Choose the path that is easiest right now.</p>
      </div>

      {needsGesture ? (
        <button
          className="secondary-button"
          type="button"
          onClick={async () => {
            try {
              await speakOnboardingPrompt(preferences.ttsRate)
              setNeedsGesture(false)
            } catch {
              onNotify('Speech is blocked in this browser. Continue with typing or browsing.')
            }
          }}
        >
          Read the prompt aloud
        </button>
      ) : null}

      <div className="onboarding-card__actions">
        <VoiceInputButton
          aria-label="Speak your request"
          lang="en-US"
          onError={(message) => onNotify(message)}
          onStatusChange={(status) => {
            if (status === 'listening') {
              onNotify('Listening for your request.')
            }
          }}
          onTranscript={(transcript) => submitRequest(transcript, 'voice')}
        />

        <label className="field">
          <span className="field__label">Type your request here</span>
          <textarea
            aria-label="Type your request here"
            className="field__control field__control--textarea"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault()
                submitRequest(draft, 'type')
              }
            }}
            placeholder="Example: I feel lonely today"
            rows={3}
            value={draft}
          />
        </label>

        <div className="button-row button-row--wrap">
          <button className="primary-button" type="button" onClick={() => submitRequest(draft, 'type')}>
            Continue with this request
          </button>
          <a
            className="secondary-button"
            href="/resources"
            onClick={(event) => {
              event.preventDefault()
              writeSessionValue('echobridge.onboardingSeen', 'true')
              onBrowse()
            }}
          >
            Browse all help resources
          </a>
        </div>

        <button
          className="ghost-button"
          type="button"
          onClick={() => {
            onComplete()
          }}
        >
          Continue without answering
        </button>
      </div>
    </section>
  )
}

function HomePage({ appState, markOnboardingSeen, onNavigate, onNotify, responseCache, setLastInputMode, setResponseCache, userPreferences }) {
  const [draft, setDraft] = useState(() => readSessionValue('echobridge.pendingRequest') ?? responseCache.lastRequest ?? '')
  const [response, setResponse] = useState(responseCache.lastResponse ?? DEFAULT_RESOURCE)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showOnboarding, setShowOnboarding] = useState(() => (appState.hasSeenOnboarding ? false : true))
  const voiceButtonRef = useRef(null)
  const textAreaRef = useRef(null)

  const processRequest = useCallback(
    (inputText, mode) => {
      const trimmedText = inputText.trim()

      if (!trimmedText) {
        setErrorMessage('Enter or speak a request before searching for help.')
        return
      }

      setLastInputMode(mode)
      setErrorMessage('')
      setIsProcessing(true)

      window.setTimeout(() => {
        const matchedResource = findBestResource(trimmedText)
        setResponse(matchedResource)
        setResponseCache({
          lastRequest: trimmedText,
          lastResponse: matchedResource,
        })
        setDraft(trimmedText)
        setIsProcessing(false)
        onNotify(`Matched ${matchedResource.title}.`)

        if (userPreferences.autoPlay && isSpeechSupported()) {
          setIsSpeaking(true)
          speak(matchedResource.audioText, userPreferences.ttsRate)
            .catch(() => {
              setErrorMessage('Speech playback was blocked or is unavailable.')
            })
            .finally(() => setIsSpeaking(false))
        }
      }, 180)
    },
    [onNotify, setLastInputMode, setResponseCache, userPreferences.autoPlay, userPreferences.ttsRate],
  )

  useEffect(() => {
    const pendingRequest = readSessionValue('echobridge.pendingRequest')
    const pendingMode = readSessionValue('echobridge.pendingInputMode')
    let cancelled = false

    if (pendingRequest) {
      window.setTimeout(() => {
        if (cancelled) {
          return
        }

        clearSessionValue('echobridge.pendingRequest')
        clearSessionValue('echobridge.pendingInputMode')
        setDraft(pendingRequest)
        processRequest(pendingRequest, pendingMode === 'voice' ? 'voice' : 'type')
      }, 0)
    }

    return () => {
      cancelled = true
    }
  }, [processRequest])

  function handleSubmit(event) {
    event.preventDefault()
    processRequest(draft, 'type')
  }

  function handlePlayResponse() {
    if (!isSpeechSupported()) {
      setErrorMessage('Speech playback is not available in this browser.')
      return
    }

    setErrorMessage('')
    setIsSpeaking(true)
    speak(response.audioText, userPreferences.ttsRate)
      .catch(() => {
        setErrorMessage('Speech playback was blocked or is unavailable.')
      })
      .finally(() => setIsSpeaking(false))
  }

  return (
    <div className="page page--home">
      {showOnboarding ? (
        <div className="page-overlay" role="presentation">
          <OnboardingPrompt
            onBrowse={() => {
              markOnboardingSeen()
              setShowOnboarding(false)
              onNavigate('/resources')
            }}
            onComplete={() => {
              markOnboardingSeen()
              setShowOnboarding(false)
            }}
            onNotify={onNotify}
            onRequest={(mode) => setLastInputMode(mode)}
            preferences={userPreferences}
          />
        </div>
      ) : null}

      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__heading">
          <p className="eyebrow">Main interaction hub</p>
          <h2 id="home-title">Speak or type a request. EchoBridge will answer in text and speech.</h2>
        </div>

        <div aria-label="Input mode controls" className="home-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setLastInputMode('voice')
              voiceButtonRef.current?.focus()
            }}
          >
            Speak
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setLastInputMode('type')
              textAreaRef.current?.focus()
            }}
          >
            Type
          </button>
        </div>
      </section>

      <section className="home-grid">
        <article className="panel panel--input" aria-labelledby="request-title">
          <div className="panel-header">
            <p className="eyebrow">Request</p>
            <h3 id="request-title">Tell us what you need</h3>
          </div>

          <form className="request-form" onSubmit={handleSubmit}>
            <VoiceInputButton
              ref={voiceButtonRef}
              aria-label="Speak your request"
              lang="en-US"
              onError={(message) => {
                setErrorMessage(message)
                onNotify(message)
              }}
              onStatusChange={(status) => {
                if (status === 'listening') {
                  setLastInputMode('voice')
                }
              }}
              onTranscript={(transcript) => processRequest(transcript, 'voice')}
            />

            <label className="field">
              <span className="field__label">Type your request here</span>
              <textarea
                ref={textAreaRef}
                aria-label="Type your request here"
                className="field__control field__control--textarea field__control--large"
                onChange={(event) => {
                  setLastInputMode('type')
                  setDraft(event.target.value)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                    event.preventDefault()
                    handleSubmit(event)
                  }
                }}
                placeholder="Example: I need food support near me"
                rows={5}
                value={draft}
              />
            </label>

            <div className="button-row button-row--wrap">
              <button className="primary-button" type="submit">
                Find help
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  stopSpeaking()
                  setIsSpeaking(false)
                }}
              >
                Stop speaking
              </button>
            </div>
          </form>

          {errorMessage ? (
            <div className="inline-alert" role="alert">
              {errorMessage}
            </div>
          ) : null}
        </article>

        <article aria-live="polite" aria-labelledby="response-title" className="panel panel--response">
          <div className="panel-header">
            <p className="eyebrow">Support response</p>
            <h3 id="response-title">Recommended resource</h3>
          </div>

          {isProcessing ? <p className="status-copy">Finding the best match...</p> : null}

          <div className="response-card">
            <p className="response-card__category">{response.category}</p>
            <h4>{response.title}</h4>
            <p>{response.description}</p>
            <p className="response-card__contact">{response.contact}</p>
            <p className="response-card__audio-text">{response.audioText}</p>
          </div>

          <div className="button-row button-row--wrap">
            <button className="primary-button" disabled={isSpeaking} type="button" onClick={handlePlayResponse}>
              {isSpeaking ? 'Playing...' : 'Play again'}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setDraft('')
                setResponse(DEFAULT_RESOURCE)
                setResponseCache({ lastRequest: '', lastResponse: DEFAULT_RESOURCE })
                setErrorMessage('')
                stopSpeaking()
                setIsSpeaking(false)
              }}
            >
              New request
            </button>
            <button className="ghost-button" type="button" onClick={() => onNavigate('/resources')}>
              Browse resources
            </button>
          </div>
        </article>
      </section>
    </div>
  )
}

function ResourcesPage({ onNavigate, onNotify, preferences }) {
  const [selectedResource, setSelectedResource] = useState(null)

  return (
    <div className="page">
      <section className="page-intro" aria-labelledby="resources-title">
        <p className="eyebrow">Resource hub</p>
        <h2 id="resources-title">Browse help by category</h2>
        <p>Every card is a button. Open one to read details or hear the resource read aloud.</p>
      </section>

      <section aria-label="Help resources" className="resource-grid">
        {RESOURCES.map((resource) => (
          <button
            key={resource.id}
            className="resource-card"
            type="button"
            onClick={() => setSelectedResource(resource)}
          >
            <span aria-hidden="true" className="resource-card__icon">
              {resource.icon}
            </span>
            <span className="resource-card__body">
              <span className="resource-card__category">{resource.category}</span>
              <span className="resource-card__title">{resource.title}</span>
              <span className="resource-card__description">{resource.description}</span>
            </span>
          </button>
        ))}
      </section>

      {selectedResource ? (
        <ResourceModal
          onClose={() => setSelectedResource(null)}
          onReadAloud={async () => {
            if (!isSpeechSupported()) {
              onNotify('Speech playback is not available in this browser.')
              return
            }

            try {
              await speak(selectedResource.audioText, preferences.ttsRate)
            } catch {
              onNotify('Speech playback was blocked or is unavailable.')
            }
          }}
          resource={selectedResource}
        />
      ) : null}

      <div className="button-row">
        <button className="secondary-button" type="button" onClick={() => onNavigate('/home')}>
          Back to home
        </button>
        <button className="ghost-button" type="button" onClick={() => onNavigate('/settings')}>
          Accessibility settings
        </button>
      </div>
    </div>
  )
}

function SettingsPage({ onNavigate }) {
  const { updatePreferences, userPreferences } = useAppContext()

  return (
    <div className="page">
      <section className="page-intro" aria-labelledby="settings-title">
        <p className="eyebrow">Accessibility preferences</p>
        <h2 id="settings-title">Adjust the experience to fit the person using it.</h2>
        <p>Settings persist in local storage and update the interface immediately.</p>
      </section>

      <section className="settings-grid">
        <label className="field">
          <span className="field__label">Text size</span>
          <select
            className="field__control"
            value={userPreferences.textSize}
            onChange={(event) => updatePreferences({ textSize: event.target.value })}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="extra-large">Extra large</option>
          </select>
        </label>

        <label className="field">
          <span className="field__label">TTS speed</span>
          <select
            className="field__control"
            value={String(userPreferences.ttsRate)}
            onChange={(event) => updatePreferences({ ttsRate: Number(event.target.value) })}
          >
            <option value="0.7">0.7 - Slow</option>
            <option value="0.9">0.9 - Comfortable</option>
            <option value="1.1">1.1 - Fast</option>
            <option value="1.3">1.3 - Very fast</option>
          </select>
        </label>

        <label className="toggle-row">
          <span>
            <strong>Auto-play responses</strong>
            <small>Speak responses automatically when speech is available.</small>
          </span>
          <input
            checked={userPreferences.autoPlay}
            onChange={(event) => updatePreferences({ autoPlay: event.target.checked })}
            type="checkbox"
          />
        </label>

        <label className="field">
          <span className="field__label">High contrast mode</span>
          <select
            className="field__control"
            value={userPreferences.highContrast}
            onChange={(event) => updatePreferences({ highContrast: event.target.value })}
          >
            <option value="system">Follow system</option>
            <option value="force">Force high contrast</option>
          </select>
        </label>

        <label className="field">
          <span className="field__label">Motion</span>
          <select
            className="field__control"
            value={userPreferences.motion}
            onChange={(event) => updatePreferences({ motion: event.target.value })}
          >
            <option value="system">Follow system</option>
            <option value="reduce">Reduce motion</option>
          </select>
        </label>
      </section>

      <div className="button-row">
        <button className="primary-button" type="button" onClick={() => onNavigate('/home')}>
          Back to home
        </button>
        <button className="ghost-button" type="button" onClick={() => onNavigate('/resources')}>
          Browse resources
        </button>
      </div>
    </div>
  )
}

function NotFoundPage({ onNavigate }) {
  return (
    <section className="page page--not-found" aria-labelledby="not-found-title">
      <p className="eyebrow">404</p>
      <h2 id="not-found-title">This page is not available.</h2>
      <p>The app still works. Use the buttons below to get back to a supported screen.</p>
      <div className="button-row">
        <button className="primary-button" type="button" onClick={() => onNavigate('/home')}>
          Go home
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/resources')}>
          Browse resources
        </button>
      </div>
    </section>
  )
}

function App() {
  return (
    <AppProvider>
      <AppFrame />
    </AppProvider>
  )
}

export default App
