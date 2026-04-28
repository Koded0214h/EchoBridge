import { Suspense, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { ErrorBoundary } from './ErrorBoundary.jsx'
import { isRecognitionSupported, isSpeechSupported } from '../services/audioService.js'

const speechAvailable = isSpeechSupported()
const recognitionAvailable = isRecognitionSupported()

export function AppShell() {
  const [notice, setNotice] = useState('')

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
          <NavLink className="site-nav__link" to="/home">Home</NavLink>
          <NavLink className="site-nav__link" to="/resources">Resources</NavLink>
          <NavLink className="site-nav__link" to="/settings">Settings</NavLink>
        </nav>
      </header>

      {!recognitionAvailable || !speechAvailable ? (
        <div className="browser-compat-banner" role="note">
          {!recognitionAvailable && !speechAvailable
            ? 'Your browser does not support voice input or text-to-speech. For full audio features, open EchoBridge in Chrome or Edge.'
            : !recognitionAvailable
              ? 'Voice input is not supported in this browser — typing still works fully. For microphone support, try Chrome or Edge.'
              : 'Text-to-speech is not available in this browser. Try Chrome or Edge for audio responses.'}
        </div>
      ) : null}

      {notice ? (
        <div aria-live="polite" className="global-notice" role="status">
          {notice}
        </div>
      ) : null}

      <main id="main-content" className="main-stage" tabIndex={-1}>
        <ErrorBoundary>
          <Suspense fallback={<p className="status-copy" aria-live="polite">Loading…</p>}>
            <Outlet context={{ setNotice }} />
          </Suspense>
        </ErrorBoundary>
      </main>

      <footer className="site-footer">
        <p>
          Keyboard ready, speech ready, and designed to stay clear when speech is not available.
        </p>
        <p>
          Speech recognition: {recognitionAvailable ? 'available' : 'typing only'} · TTS:{' '}
          {speechAvailable ? 'available' : 'not available'}
        </p>
      </footer>
    </div>
  )
}
