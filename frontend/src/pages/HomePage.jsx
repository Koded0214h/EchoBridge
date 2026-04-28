import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { ResourceModal } from '../components/ResourceModal.jsx'
import { VoiceInputButton } from '../components/VoiceInputButton.jsx'
import { useAppContext } from '../context/AppContext.jsx'
import { DEFAULT_RESOURCE, findBestResource } from '../data/resources.js'
import { matchQuery } from '../services/apiService.js'
import {
  isRecognitionSupported,
  isSpeechSupported,
  speak,
  speakOnboardingPrompt,
  stopSpeaking,
} from '../services/audioService.js'

function readSessionValue(key) {
  try { return window.sessionStorage.getItem(key) } catch { return null }
}
function writeSessionValue(key, value) {
  try { window.sessionStorage.setItem(key, value) } catch { /* ignore */ }
}
function clearSessionValue(key) {
  try { window.sessionStorage.removeItem(key) } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// OnboardingPrompt
// ---------------------------------------------------------------------------

function OnboardingPrompt({ onBrowse, onComplete, onRequest, preferences }) {
  const { setNotice } = useOutletContext()
  const [draft, setDraft] = useState('')
  const [needsGesture, setNeedsGesture] = useState(false)

  useEffect(() => {
    let cancelled = false
    const speakPrompt = async () => {
      if (!isSpeechSupported()) { setNeedsGesture(true); return }
      try {
        await speakOnboardingPrompt(preferences.ttsRate, preferences.ttsVoice)
      } catch {
        if (!cancelled) setNeedsGesture(true)
      }
    }
    speakPrompt()
    return () => { cancelled = true; stopSpeaking() }
  }, [preferences.ttsRate])

  function submitRequest(requestText, mode) {
    const trimmedText = requestText.trim()
    if (!trimmedText) {
      setNotice('Please speak or type a request before continuing.')
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
            stopSpeaking()
            try {
              await speakOnboardingPrompt(preferences.ttsRate, preferences.ttsVoice)
              setNeedsGesture(false)
            } catch {
              setNotice('Speech is blocked in this browser. Continue with typing or browsing.')
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
          onError={(message) => setNotice(message)}
          onStatusChange={(status) => {
            if (status === 'listening') setNotice('Listening for your request.')
          }}
          onTranscript={(transcript) => submitRequest(transcript, 'voice')}
        />

        <form
          onSubmit={(event) => {
            event.preventDefault()
            submitRequest(draft, 'type')
          }}
        >
          <label className="field">
            <span className="field__label">Type your request here</span>
            <textarea
              aria-label="Type your request here"
              className="field__control field__control--textarea"
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Example: I feel lonely today"
              rows={3}
              value={draft}
            />
          </label>

          <div className="button-row button-row--wrap">
            <button className="primary-button" type="submit">
              Continue with this request
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                writeSessionValue('echobridge.onboardingSeen', 'true')
                onBrowse()
              }}
            >
              Browse all help resources
            </button>
          </div>
        </form>

        <button className="ghost-button" type="button" onClick={onComplete}>
          Continue without answering
        </button>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// HomePage
// ---------------------------------------------------------------------------

export function HomePage() {
  const { appState, markOnboardingSeen, responseCache, setLastInputMode, setResponseCache, userPreferences } =
    useAppContext()
  const { setNotice } = useOutletContext()
  const navigate = useNavigate()

  const [draft, setDraft] = useState(
    () => readSessionValue('echobridge.pendingRequest') ?? responseCache.lastRequest ?? '',
  )
  const [response, setResponse] = useState(responseCache.lastResponse ?? DEFAULT_RESOURCE)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showOnboarding, setShowOnboarding] = useState(!appState.hasSeenOnboarding)

  const voiceButtonRef = useRef(null)
  const textAreaRef = useRef(null)

  const processRequest = useCallback(
    async (inputText, mode) => {
      const trimmedText = inputText.trim()
      if (!trimmedText) {
        setErrorMessage('Enter or speak a request before searching for help.')
        return
      }

      setLastInputMode(mode)
      setErrorMessage('')
      setIsProcessing(true)
      // Touch the speech synth synchronously inside the gesture window so Chrome
      // registers user activation before we hit any await.
      stopSpeaking()

      try {
        // Try the API first; fall back to local matching if unreachable
        let matchedResource
        try {
          matchedResource = await matchQuery(trimmedText)
        } catch {
          matchedResource = null
        }
        if (!matchedResource) {
          matchedResource = findBestResource(trimmedText)
        }

        setResponse(matchedResource)
        setResponseCache({ lastRequest: trimmedText, lastResponse: matchedResource })
        setDraft(trimmedText)
        setNotice(`Matched: ${matchedResource.title}`)

        if (userPreferences.autoPlay && isSpeechSupported()) {
          setIsSpeaking(true)
          try {
            await speak(matchedResource.audioText, userPreferences.ttsRate, 1.0, userPreferences.ttsVoice)
          } catch (err) {
            // 'not-allowed' = Chrome blocked autoplay before a user gesture unlocked
            // the synth. Don't show an error — the "Play again" button (a direct
            // gesture) will work after the stuck state is cleared in speak().
            if (err?.message !== 'not-allowed') {
              setErrorMessage('Speech playback was blocked or is unavailable.')
            }
          } finally {
            setIsSpeaking(false)
          }
        }
      } finally {
        setIsProcessing(false)
      }
    },
    [setNotice, setLastInputMode, setResponseCache, userPreferences.autoPlay, userPreferences.ttsRate],
  )

  useEffect(() => {
    const pendingRequest = readSessionValue('echobridge.pendingRequest')
    const pendingMode = readSessionValue('echobridge.pendingInputMode')
    let cancelled = false

    if (pendingRequest) {
      clearSessionValue('echobridge.pendingRequest')
      clearSessionValue('echobridge.pendingInputMode')
      setDraft(pendingRequest)
      if (!cancelled) {
        processRequest(pendingRequest, pendingMode === 'voice' ? 'voice' : 'type')
      }
    }

    return () => { cancelled = true }
  }, [processRequest])

  return (
    <div className="page page--home">
      {showOnboarding ? (
        <div className="page-overlay" role="presentation">
          <OnboardingPrompt
            onBrowse={() => {
              markOnboardingSeen()
              setShowOnboarding(false)
              navigate('/resources')
            }}
            onComplete={() => {
              markOnboardingSeen()
              setShowOnboarding(false)
            }}
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
          <button className="secondary-button" type="button" onClick={() => { setLastInputMode('voice'); voiceButtonRef.current?.focus() }}>
            Speak
          </button>
          <button className="secondary-button" type="button" onClick={() => { setLastInputMode('type'); textAreaRef.current?.focus() }}>
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

          <form className="request-form" onSubmit={(e) => { e.preventDefault(); processRequest(draft, 'type') }}>
            <VoiceInputButton
              ref={voiceButtonRef}
              aria-label="Speak your request"
              lang="en-US"
              onError={(message) => { setErrorMessage(message); setNotice(message) }}
              onStatusChange={(status) => { if (status === 'listening') setLastInputMode('voice') }}
              onTranscript={(transcript) => processRequest(transcript, 'voice')}
            />

            <label className="field">
              <span className="field__label">Type your request here</span>
              <textarea
                ref={textAreaRef}
                aria-label="Type your request here"
                className="field__control field__control--textarea field__control--large"
                onChange={(event) => { setLastInputMode('type'); setDraft(event.target.value) }}
                placeholder="Example: I need food support near me"
                rows={5}
                value={draft}
              />
            </label>

            <div className="button-row button-row--wrap">
              <button className="primary-button" type="submit">Find help</button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => { stopSpeaking(); setIsSpeaking(false) }}
              >
                Stop speaking
              </button>
            </div>
          </form>

          {errorMessage ? (
            <div className="inline-alert" role="alert">{errorMessage}</div>
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
            <button
              className="primary-button"
              disabled={isSpeaking}
              type="button"
              onClick={() => {
                if (!isSpeechSupported()) { setErrorMessage('Speech playback is not available in this browser.'); return }
                setErrorMessage('')
                setIsSpeaking(true)
                speak(response.audioText, userPreferences.ttsRate, 1.0, userPreferences.ttsVoice)
                  .catch(() => setErrorMessage('Speech playback was blocked or is unavailable.'))
                  .finally(() => setIsSpeaking(false))
              }}
            >
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
            <button className="ghost-button" type="button" onClick={() => navigate('/resources')}>
              Browse resources
            </button>
          </div>
        </article>
      </section>
    </div>
  )
}
