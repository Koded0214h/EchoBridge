function getSpeechSynthesis() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.speechSynthesis ?? null
}

function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

function emitSpeechState(detail) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new CustomEvent('echobridge:speechstate', { detail }))
}

function getVoice(voices) {
  if (!voices.length) {
    return null
  }

  return (
    voices.find((voice) => voice.default && voice.lang.startsWith('en')) ??
    voices.find((voice) => voice.lang.startsWith('en')) ??
    voices[0]
  )
}

async function loadVoices(speechSynthesis) {
  const voices = speechSynthesis.getVoices()
  if (voices.length) {
    return voices
  }

  return new Promise((resolve) => {
    const handleVoicesChanged = () => {
      speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
      resolve(speechSynthesis.getVoices())
    }

    speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged)
    window.setTimeout(() => {
      speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
      resolve(speechSynthesis.getVoices())
    }, 300)
  })
}

export function isSpeechSupported() {
  return Boolean(getSpeechSynthesis())
}

export function isRecognitionSupported() {
  return Boolean(getSpeechRecognitionConstructor())
}

export async function speak(text, rate = 0.9, pitch = 1.0) {
  const speechSynthesis = getSpeechSynthesis()

  if (!speechSynthesis) {
    throw new Error('Speech synthesis is not available in this browser.')
  }

  speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = rate
  utterance.pitch = pitch

  const voices = await loadVoices(speechSynthesis)
  const selectedVoice = getVoice(voices)

  if (selectedVoice) {
    utterance.voice = selectedVoice
  }

  return new Promise((resolve, reject) => {
    utterance.onstart = () => {
      emitSpeechState({ isSpeaking: true, text })
    }

    utterance.onend = () => {
      emitSpeechState({ isSpeaking: false, text })
      resolve()
    }

    utterance.onerror = (event) => {
      emitSpeechState({ isSpeaking: false, text })
      reject(new Error(event.error || 'Speech synthesis failed.'))
    }

    speechSynthesis.speak(utterance)
  })
}

export function stopSpeaking() {
  const speechSynthesis = getSpeechSynthesis()

  if (!speechSynthesis) {
    return
  }

  speechSynthesis.cancel()
  emitSpeechState({ isSpeaking: false })
}

export function speakWelcomeMessage(rate = 0.9) {
  return speak('Welcome to EchoBridge. You are not alone. Help is here.', rate)
}

export function speakOnboardingPrompt(rate = 0.9) {
  return speak('How would you like to get help today? You can speak or type.', rate)
}

export function createSpeechRecognizer({ lang = 'en-US', onEnd, onError, onResult, onStart }) {
  const RecognitionConstructor = getSpeechRecognitionConstructor()

  if (!RecognitionConstructor) {
    return null
  }

  const recognition = new RecognitionConstructor()
  recognition.lang = lang
  recognition.continuous = false
  recognition.interimResults = false
  recognition.maxAlternatives = 1

  recognition.onstart = () => {
    onStart?.()
  }

  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript?.trim() ?? ''
    onResult?.(transcript)
  }

  recognition.onerror = (event) => {
    onError?.(event.error || 'recognition-failed')
  }

  recognition.onend = () => {
    onEnd?.()
  }

  return recognition
}
