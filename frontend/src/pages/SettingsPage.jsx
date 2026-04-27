import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext.jsx'
import { listEnglishVoices, speak, stopSpeaking } from '../services/audioService.js'

const VOICE_PREVIEW_TEXT = 'Hello, this is how I sound. I hope this voice is comfortable for you.'

export function SettingsPage() {
  const { updatePreferences, userPreferences } = useAppContext()
  const navigate = useNavigate()

  const [availableVoices, setAvailableVoices] = useState([])
  const [isPreviewing, setIsPreviewing] = useState(false)

  useEffect(() => {
    listEnglishVoices().then(setAvailableVoices)
  }, [])

  async function handlePreviewVoice() {
    if (isPreviewing) {
      stopSpeaking()
      setIsPreviewing(false)
      return
    }
    stopSpeaking()
    setIsPreviewing(true)
    try {
      await speak(VOICE_PREVIEW_TEXT, userPreferences.ttsRate, 1.0, userPreferences.ttsVoice)
    } finally {
      setIsPreviewing(false)
    }
  }

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
            onChange={(e) => updatePreferences({ textSize: e.target.value })}
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
            onChange={(e) => updatePreferences({ ttsRate: Number(e.target.value) })}
          >
            <option value="0.7">0.7 — Slow</option>
            <option value="0.9">0.9 — Comfortable</option>
            <option value="1.1">1.1 — Fast</option>
            <option value="1.3">1.3 — Very fast</option>
          </select>
        </label>

        {availableVoices.length > 0 && (
          <div className="field">
            <label className="field__label" htmlFor="voice-select">Voice</label>
            <div className="voice-picker">
              <select
                id="voice-select"
                className="field__control"
                value={userPreferences.ttsVoice}
                onChange={(e) => updatePreferences({ ttsVoice: e.target.value })}
              >
                <option value="">Auto — best available</option>
                {availableVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name}{/enhanced|neural|natural|online/i.test(v.name) ? ' ✦' : ''}
                  </option>
                ))}
              </select>
              <button
                className="secondary-button"
                type="button"
                onClick={handlePreviewVoice}
                aria-label={isPreviewing ? 'Stop voice preview' : 'Preview selected voice'}
              >
                {isPreviewing ? 'Stop' : 'Preview'}
              </button>
            </div>
            <p className="field__hint">Voices marked ✦ are higher quality.</p>
          </div>
        )}

        <label className="toggle-row">
          <span>
            <strong>Auto-play responses</strong>
            <small>Speak responses automatically when speech is available.</small>
          </span>
          <input
            checked={userPreferences.autoPlay}
            onChange={(e) => updatePreferences({ autoPlay: e.target.checked })}
            type="checkbox"
          />
        </label>

        <label className="field">
          <span className="field__label">High contrast mode</span>
          <select
            className="field__control"
            value={userPreferences.highContrast}
            onChange={(e) => updatePreferences({ highContrast: e.target.value })}
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
            onChange={(e) => updatePreferences({ motion: e.target.value })}
          >
            <option value="system">Follow system</option>
            <option value="reduce">Reduce motion</option>
          </select>
        </label>
      </section>

      <div className="button-row">
        <button className="primary-button" type="button" onClick={() => navigate('/home')}>
          Back to home
        </button>
        <button className="ghost-button" type="button" onClick={() => navigate('/resources')}>
          Browse resources
        </button>
      </div>
    </div>
  )
}
