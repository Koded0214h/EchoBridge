import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useOutletContext } from 'react-router-dom'
import { useAppContext } from '../context/AppContext.jsx'
import { isSpeechSupported, speakWelcomeMessage, stopSpeaking } from '../services/audioService.js'

const ADVANCE_DELAY = 4000

export function SplashPage() {
  const { appState, markVisited } = useAppContext()
  const { setNotice } = useOutletContext()
  const navigate = useNavigate()

  const [closing, setClosing] = useState(false)
  const [needsGesture, setNeedsGesture] = useState(false)
  const [preferences] = useState(() => ({ ttsRate: 0.9 }))
  const timerRef = useRef(null)

  const { userPreferences } = useAppContext()

  const handleAdvance = useCallback(() => {
    if (closing) return
    setClosing(true)
    markVisited()
    window.setTimeout(() => navigate('/home', { replace: true }), 500)
  }, [closing, markVisited, navigate])

  useEffect(() => {
    let cancelled = false

    const speakWelcome = async () => {
      if (!isSpeechSupported()) {
        setNeedsGesture(true)
        return
      }
      try {
        await speakWelcomeMessage(userPreferences.ttsRate, userPreferences.ttsVoice)
      } catch {
        if (!cancelled) setNeedsGesture(true)
      }
    }

    speakWelcome()
    timerRef.current = window.setTimeout(() => {
      if (!cancelled) handleAdvance()
    }, ADVANCE_DELAY)

    return () => {
      cancelled = true
      stopSpeaking()
      window.clearTimeout(timerRef.current)
    }
  }, [handleAdvance, userPreferences.ttsRate])

  // Returning users skip the splash entirely
  if (appState.isFirstVisit === false) {
    return <Navigate to="/home" replace />
  }

  async function handleReplay(event) {
    event.stopPropagation()
    stopSpeaking()
    try {
      await speakWelcomeMessage(userPreferences.ttsRate, userPreferences.ttsVoice)
      setNeedsGesture(false)
    } catch {
      setNeedsGesture(true)
      setNotice('Welcome speech is blocked. You can continue without audio.')
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

        <div className="splash-screen__progress" aria-hidden="true">
          <div className="splash-screen__progress-fill" style={{ animationDuration: `${ADVANCE_DELAY}ms` }} />
        </div>

        <p className="splash-screen__hint">Tap, click, or press Enter to continue.</p>
      </div>
    </section>
  )
}
