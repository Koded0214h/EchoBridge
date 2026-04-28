// Strings extracted here so they can be updated without touching service logic.
export const WELCOME_MESSAGE = 'Welcome to EchoBridge. You are not alone. Help is here.'
export const ONBOARDING_PROMPT = 'How would you like to get help today? You can speak or type.'

const SPEECH_TIMEOUT_MS = 30_000

// Monotonic counter used to detect superseded speak() calls. When React
// StrictMode double-invokes an effect both calls increment this; the first
// call sees a stale ID after loadVoices() resolves and bails out silently.
let _callId = 0

function getSpeechSynthesis() {
  if (typeof window === 'undefined') return null
  return window.speechSynthesis ?? null
}

function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') return null
  // Prefer webkitSpeechRecognition in Chromium-based browsers (Chrome, Edge)
  // as the unprefixed SpeechRecognition is sometimes present but broken or experimental.
  return window.webkitSpeechRecognition ?? window.SpeechRecognition ?? null
}

function emitSpeechState(detail) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('echobridge:speechstate', { detail }))
}

// Voices ranked roughly by quality. Checked by substring so partial names work
// across OS versions (e.g. "Samantha" matches "Samantha (Enhanced)").
const PREFERRED_VOICES = [
  'Google US English',       // Chrome — neural, best available in-browser
  'Google UK English Female',
  'Google UK English Male',
  'Microsoft Aria Online',   // Edge — neural
  'Microsoft Jenny Online',
  'Microsoft Guy Online',
  'Samantha',                // macOS / iOS — clear, natural
  'Alex',                    // macOS — older but still good
  'Karen',                   // macOS Australian
  'Daniel',                  // macOS British
]

function getVoice(voices) {
  if (!voices.length) return null

  const english = voices.filter((v) => v.lang.startsWith('en'))
  if (!english.length) return voices[0]

  // 1. Explicitly preferred voices (neural / high-quality).
  for (const preferred of PREFERRED_VOICES) {
    const match = english.find((v) => v.name.includes(preferred))
    if (match) return match
  }

  // 2. Any voice advertised as enhanced, neural, natural, or online.
  const enhanced = english.find((v) => /enhanced|neural|natural|online/i.test(v.name))
  if (enhanced) return enhanced

  // 3. System default English voice.
  return english.find((v) => v.default) ?? english[0]
}

async function loadVoices(synth) {
  const voices = synth.getVoices()
  if (voices.length) return voices

  return new Promise((resolve) => {
    let timeoutId

    // { once: true } auto-removes the listener after first fire — no leak.
    synth.addEventListener(
      'voiceschanged',
      () => {
        clearTimeout(timeoutId)
        resolve(synth.getVoices())
      },
      { once: true },
    )

    // Fallback for browsers that never fire voiceschanged (Firefox is slow here).
    timeoutId = window.setTimeout(() => resolve(synth.getVoices()), 2500)
  })
}

export function isSpeechSupported() {
  return Boolean(getSpeechSynthesis())
}

// Returns all available English voices sorted by quality tier, useful for
// letting users pick a voice in Settings.
export async function listEnglishVoices() {
  const synth = getSpeechSynthesis()
  if (!synth) return []
  const voices = await loadVoices(synth)
  return voices
    .filter((v) => v.lang.startsWith('en'))
    .sort((a, b) => {
      const score = (v) => (/enhanced|neural|natural|online/i.test(v.name) ? 0 : 1)
      return score(a) - score(b) || a.name.localeCompare(b.name)
    })
}

export function isRecognitionSupported() {
  return Boolean(getSpeechRecognitionConstructor())
}

// Callers that want to interrupt in-progress speech should call stopSpeaking()
// before speak(). speak() itself does not cancel previous utterances so that
// concurrent callers don't silently clobber each other's promise.
export async function speak(text, rate = 0.9, pitch = 1.0, voiceName = '') {
  const synth = getSpeechSynthesis()
  if (!synth) throw new Error('Speech synthesis is not available in this browser.')

  // Claim a slot. If another speak() (or stopSpeaking()) runs before loadVoices
  // resolves, our callId will be stale and we bail — prevents double-speech from
  // React StrictMode double-invoking effects.
  const callId = ++_callId

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = rate
  utterance.pitch = pitch

  const voices = await loadVoices(synth)

  if (callId !== _callId) return  // superseded — bail cleanly

  const voice = voiceName
    ? (voices.find((v) => v.name === voiceName) ?? getVoice(voices))
    : getVoice(voices)
  if (voice) utterance.voice = voice

  return new Promise((resolve, reject) => {
    let settled = false
    let timeoutId

    function settle(fn, ...args) {
      if (settled) return
      settled = true
      clearTimeout(timeoutId)
      fn(...args)
    }

    utterance.onstart = () => emitSpeechState({ isSpeaking: true, text })

    utterance.onend = () => {
      emitSpeechState({ isSpeaking: false, text })
      settle(resolve)
    }

    utterance.onerror = (event) => {
      emitSpeechState({ isSpeaking: false, text })
      // 'interrupted'/'canceled' are normal when stopSpeaking() is called — resolve cleanly.
      if (event.error === 'interrupted' || event.error === 'canceled') {
        settle(resolve)
      } else {
        // Chrome: 'not-allowed' leaves the synth in a stuck state where all
        // subsequent speak() calls also fail. cancel()+resume() resets it.
        if (event.error === 'not-allowed') {
          try { synth.cancel() } catch { /* ignore */ }
          try { synth.resume() } catch { /* ignore */ }
        }
        settle(reject, new Error(event.error || 'Speech synthesis failed.'))
      }
    }

    // Safety valve: some mobile browsers stall indefinitely.
    timeoutId = window.setTimeout(() => {
      synth.cancel()
      settle(reject, new Error('Speech timed out.'))
    }, SPEECH_TIMEOUT_MS)

    // Firefox: cancel() leaves speechSynthesis paused; un-pause before speaking
    // or the new utterance is silently dropped. Chrome is never paused here so
    // this check is a no-op in Chrome — do NOT use a deferred setTimeout because
    // calling resume() while Chrome is actively speaking interrupts the utterance.
    if (synth.paused) synth.resume()
    synth.speak(utterance)
  })
}

export function stopSpeaking() {
  const synth = getSpeechSynthesis()
  if (!synth) return
  ++_callId  // invalidate any in-flight speak() calls that haven't reached synth.speak() yet
  synth.cancel()
  // Firefox: cancel() synchronously sets paused=true; resume() immediately clears
  // that so the next speak() isn't silently dropped. Chrome sets paused=false after
  // cancel() so this is a no-op there — safe to call unconditionally.
  if (synth.paused) synth.resume()
  emitSpeechState({ isSpeaking: false })
}

export function speakWelcomeMessage(rate = 0.9, voiceName = '') {
  return speak(WELCOME_MESSAGE, rate, 1.0, voiceName)
}

export function speakOnboardingPrompt(rate = 0.9, voiceName = '') {
  return speak(ONBOARDING_PROMPT, rate, 1.0, voiceName)
}

export function createSpeechRecognizer({ lang = 'en-US', onEnd, onError, onResult, onStart }) {
  const RecognitionConstructor = getSpeechRecognitionConstructor()
  if (!RecognitionConstructor) return null

  const recognition = new RecognitionConstructor()
  recognition.lang = lang
  recognition.continuous = false
  recognition.interimResults = false
  recognition.maxAlternatives = 3 // try up to 3 candidates so we can pick highest confidence

  recognition.onstart = () => onStart?.()

  recognition.onresult = (event) => {
    if (!event.results) return
    const result = event.results[event.resultIndex ?? 0]
    if (!result || !result.length) return

    // Pick the alternative with the highest confidence score.
    let best = result[0]
    for (let i = 1; i < result.length; i++) {
      if (result[i] && result[i].confidence > best.confidence) {
        best = result[i]
      }
    }

    const transcript = (best.transcript || '').trim()
    if (!transcript) return

    // confidence=0 means the browser didn't report it (treat as acceptable).
    // Only reject if the browser reports a meaningful but very low score.
    const confident = best.confidence === 0 || best.confidence >= 0.4

    onResult?.(transcript, confident)
  }

  recognition.onerror = (event) => {
    // Some browsers (like Edge) might fire error with 'service-not-allowed'
    // or other codes that indicate speech service issues.
    const error = event?.error || 'recognition-failed'
    onError?.(error)
  }

  recognition.onend = () => onEnd?.()

  return recognition
}
