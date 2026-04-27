import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { ResourceModal } from '../components/ResourceModal.jsx'
import { useAppContext } from '../context/AppContext.jsx'
import { RESOURCES as FALLBACK_RESOURCES } from '../data/resources.js'
import { getCategories, normalizeCategoryResources } from '../services/apiService.js'
import { isSpeechSupported, speak, stopSpeaking } from '../services/audioService.js'

export function ResourcesPage() {
  const { userPreferences } = useAppContext()
  const { setNotice } = useOutletContext()
  const navigate = useNavigate()

  const [resources, setResources] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectedResource, setSelectedResource] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setLoadError('')
      try {
        const categories = await getCategories()
        if (!cancelled) {
          const flat = categories.flatMap((cat) => normalizeCategoryResources(cat))
          setResources(flat.length ? flat : FALLBACK_RESOURCES)
        }
      } catch {
        if (!cancelled) {
          // API unreachable — use hardcoded data so the page still works
          setResources(FALLBACK_RESOURCES)
          setLoadError('Could not load live resources. Showing cached data.')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="page">
      <section className="page-intro" aria-labelledby="resources-title">
        <p className="eyebrow">Resource hub</p>
        <h2 id="resources-title">Browse help by category</h2>
        <p>Every card is a button. Open one to read details or hear the resource read aloud.</p>
      </section>

      {loadError ? (
        <div className="inline-alert" role="status">{loadError}</div>
      ) : null}

      {isLoading ? (
        <p className="status-copy" aria-live="polite">Loading resources…</p>
      ) : (
        <section aria-label="Help resources" className="resource-grid">
          {resources.map((resource) => (
            <button
              key={resource.id}
              className="resource-card"
              type="button"
              onClick={() => setSelectedResource(resource)}
            >
              <span aria-hidden="true" className="resource-card__icon">{resource.icon}</span>
              <span className="resource-card__body">
                <span className="resource-card__category">{resource.category}</span>
                <span className="resource-card__title">{resource.title}</span>
                <span className="resource-card__description">{resource.description}</span>
              </span>
            </button>
          ))}
        </section>
      )}

      {selectedResource ? (
        <ResourceModal
          onClose={() => setSelectedResource(null)}
          onReadAloud={async () => {
            if (!isSpeechSupported()) {
              setNotice('Speech playback is not available in this browser.')
              return
            }
            stopSpeaking()
            try {
              await speak(selectedResource.audioText, userPreferences.ttsRate, 1.0, userPreferences.ttsVoice)
            } catch {
              setNotice('Speech playback was blocked or is unavailable.')
            }
          }}
          resource={selectedResource}
        />
      ) : null}

      <div className="button-row">
        <button className="secondary-button" type="button" onClick={() => navigate('/home')}>
          Back to home
        </button>
        <button className="ghost-button" type="button" onClick={() => navigate('/settings')}>
          Accessibility settings
        </button>
      </div>
    </div>
  )
}
