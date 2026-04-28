import PropTypes from 'prop-types'
import { forwardRef, useEffect, useId, useRef, useState } from 'react'
import { createSpeechRecognizer, isRecognitionSupported } from '../services/audioService.js'

const IDLE_MESSAGE = isRecognitionSupported()
  ? 'Press to speak your request.'
  : 'Typing only: microphone input is unavailable in this browser.'

const ERROR_MESSAGES = {
  'not-allowed': 'Please allow microphone access in your browser settings, then try again.',
  'service-not-allowed': 'Please allow microphone access in your browser settings, then try again.',
  'audio-capture': 'No microphone was found. Please connect one and try again.',
  'network-error': 'A network error occurred during speech recognition. Please try again.',
  'no-speech': 'No speech was detected. Please try again or type your request.',
  'aborted': 'Listening was stopped.',
  'language-not-supported': 'The selected language is not supported by this browser.',
}

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
    </svg>
  )
}

export const VoiceInputButton = forwardRef(function VoiceInputButton(
  {
    className = '',
    onError,
    onStatusChange,
    onTranscript,
    silenceTimeoutMs = 10_000,
    ...buttonProps
  },
  forwardedRef,
) {
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState(IDLE_MESSAGE)
  const recognitionRef = useRef(null)
  const silenceTimerRef = useRef(null)
  const transcriptHandledRef = useRef(false)
  const liveRegionId = useId()

  function clearSilenceTimer() {
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }

  function resetState(nextMessage = IDLE_MESSAGE) {
    clearSilenceTimer()
    recognitionRef.current = null
    transcriptHandledRef.current = false
    setStatus('idle')
    setMessage(nextMessage)
    onStatusChange?.('idle')
  }

  function stopListening(nextMessage = 'Listening stopped.') {
    clearSilenceTimer()
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* ignore */ }
    }
    recognitionRef.current = null
    resetState(nextMessage)
  }

  function startListening() {
    if (!isRecognitionSupported()) {
      const msg = 'Your browser supports typing only. Microphone input is unavailable.'
      setMessage(msg)
      onError?.(msg)
      return
    }

    if (status === 'listening' || status === 'starting') {
      stopListening()
      return
    }

    setStatus('starting')
    setMessage('Starting microphone…')

    const recognition = createSpeechRecognizer({
      lang: 'en-US',
      onStart: () => {
        setStatus('listening')
        setMessage('Listening…')
        onStatusChange?.('listening')
        clearSilenceTimer()
        // Fallback timer: fire if no speech is detected at all within the window.
        silenceTimerRef.current = window.setTimeout(() => {
          if (!transcriptHandledRef.current) {
            stopListening('No speech detected. Please try again or type your request.')
            onError?.('No speech detected. Please try again or type your request.')
          }
        }, silenceTimeoutMs)
      },
      onResult: (transcript, confident) => {
        if (!transcript) {
          stopListening('No speech detected. Please try again or type your request.')
          onError?.('No speech detected. Please try again or type your request.')
          return
        }

        if (!confident) {
          stopListening("Couldn't understand that clearly. Please try again or type your request.")
          onError?.("Couldn't understand that clearly. Please try again or type your request.")
          return
        }

        transcriptHandledRef.current = true
        clearSilenceTimer()
        setStatus('processing')
        setMessage('Processing your request.')
        onStatusChange?.('processing')
        // Call immediately — no artificial delay.
        onTranscript?.(transcript)
        resetState('Request captured. You can speak again anytime.')
      },
      onError: (error) => {
        const errorMessage =
          ERROR_MESSAGES[error] ?? `Microphone error: ${error}. You can still type your request.`
        stopListening(errorMessage)
        onError?.(errorMessage)
      },
      onEnd: () => {
        clearSilenceTimer()
        if (status === 'listening' && !transcriptHandledRef.current) {
          resetState('Listening stopped.')
        }
      },
    })

    if (!recognition) {
      const msg = 'Your browser supports typing only. Microphone input is unavailable.'
      setMessage(msg)
      onError?.(msg)
      return
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch {
      recognitionRef.current = null
      const msg = 'Microphone could not start. You can still type your request.'
      setMessage(msg)
      onError?.(msg)
    }
  }

  useEffect(() => {
    return () => {
      clearSilenceTimer()
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch { /* ignore */ }
      }
    }
  }, [])

  const isActive = status === 'listening' || status === 'starting'
  const notSupported = !isRecognitionSupported()

  return (
    <div className={`voice-input ${className}`.trim()}>
      <button
        {...buttonProps}
        ref={forwardedRef}
        aria-disabled={notSupported}
        aria-pressed={isActive}
        className={`voice-input__button voice-input__button--${status}`}
        onClick={startListening}
        title={notSupported ? 'Voice input unavailable — use Chrome or Edge' : undefined}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && isActive) {
            event.preventDefault()
            stopListening()
          }
        }}
        type="button"
      >
        <span className={`voice-input__icon ${status === 'listening' ? 'voice-input__icon--wave' : ''}`}>
          <MicIcon />
        </span>
        <span className="voice-input__label">
          {status === 'starting'
            ? 'Starting…'
            : status === 'listening'
              ? 'Listening…'
              : status === 'processing'
                ? 'Processing…'
                : 'Speak'}
        </span>
      </button>

      <div aria-live="polite" className="voice-input__status" id={liveRegionId} role="status">
        {message}
      </div>
    </div>
  )
})

VoiceInputButton.propTypes = {
  className: PropTypes.string,
  onError: PropTypes.func,
  onStatusChange: PropTypes.func,
  onTranscript: PropTypes.func,
  silenceTimeoutMs: PropTypes.number,
}
