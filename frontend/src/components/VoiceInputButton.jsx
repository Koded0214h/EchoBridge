import { forwardRef, useEffect, useId, useRef, useState } from 'react'
import { createSpeechRecognizer, isRecognitionSupported } from '../services/audioService.js'

const IDLE_MESSAGE = isRecognitionSupported()
  ? 'Press to speak your request.'
  : 'Typing only: microphone input is unavailable in this browser.'

export const VoiceInputButton = forwardRef(function VoiceInputButton(
  { className = '', onError, onStatusChange, onTranscript, ...buttonProps },
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
      try {
        recognitionRef.current.stop()
      } catch {
        // Ignore stop errors and fall back to idle state.
      }
    }

    recognitionRef.current = null
    resetState(nextMessage)
  }

  function startListening() {
    if (!isRecognitionSupported()) {
      const unavailableMessage = 'Your browser supports typing only. Microphone input is unavailable.'
      setMessage(unavailableMessage)
      onError?.(unavailableMessage)
      return
    }

    if (status === 'listening') {
      stopListening()
      return
    }

    const recognition = createSpeechRecognizer({
      lang: 'en-US',
      onStart: () => {
        setStatus('listening')
        setMessage('Listening...')
        onStatusChange?.('listening')
        clearSilenceTimer()
        silenceTimerRef.current = window.setTimeout(() => {
          if (!transcriptHandledRef.current) {
            stopListening('No speech detected. Please try again or type your request.')
            onError?.('No speech detected. Please try again or type your request.')
          }
        }, 10000)
      },
      onResult: (transcript) => {
        if (!transcript) {
          stopListening('No speech detected. Please try again or type your request.')
          onError?.('No speech detected. Please try again or type your request.')
          return
        }

        transcriptHandledRef.current = true
        clearSilenceTimer()
        setStatus('processing')
        setMessage('Processing your request.')
        onStatusChange?.('processing')

        window.setTimeout(() => {
          onTranscript?.(transcript)
          resetState('Request captured. You can speak again anytime.')
        }, 150)
      },
      onError: (error) => {
        let errorMessage = 'Microphone input failed.'

        if (error === 'not-allowed' || error === 'service-not-allowed') {
          errorMessage = 'Microphone permission was denied. You can still type your request.'
        }

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
      const unavailableMessage = 'Your browser supports typing only. Microphone input is unavailable.'
      setMessage(unavailableMessage)
      onError?.(unavailableMessage)
      return
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch {
      recognitionRef.current = null
      const unavailableMessage = 'Microphone could not start. You can still type your request.'
      setMessage(unavailableMessage)
      onError?.(unavailableMessage)
    }
  }

  useEffect(() => {
    return () => {
      clearSilenceTimer()

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {
          // Ignore teardown errors.
        }
      }
    }
  }, [])

  return (
    <div className={`voice-input ${className}`.trim()}>
      <button
        {...buttonProps}
        ref={forwardedRef}
        className={`voice-input__button voice-input__button--${status}`.trim()}
        onClick={startListening}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && status === 'listening') {
            event.preventDefault()
            stopListening()
          }
        }}
        type="button"
      >
        <span aria-hidden="true" className="voice-input__icon">
          {status === 'listening' ? '◌' : '🎙'}
        </span>
        <span className="voice-input__label">
          {status === 'listening'
            ? 'Listening...'
            : status === 'processing'
              ? 'Processing...'
              : 'Speak'}
        </span>
      </button>

      <div aria-live="polite" className="voice-input__status" id={liveRegionId} role="status">
        {message}
      </div>
    </div>
  )
})
