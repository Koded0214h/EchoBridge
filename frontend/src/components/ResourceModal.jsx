import PropTypes from 'prop-types'
import { useEffect, useRef } from 'react'

export function ResourceModal({ onClose, onReadAloud, resource }) {
  const readAloudRef = useRef(null)

  useEffect(() => {
    // Focus the primary action so screen reader users hear the resource immediately.
    readAloudRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      role="presentation"
    >
      <section
        aria-describedby="resource-description"
        aria-labelledby="resource-title"
        aria-modal="true"
        className="modal-card"
        role="dialog"
      >
        <div className="panel-header">
          <p className="eyebrow">Resource details</p>
          <h3 id="resource-title">{resource.title}</h3>
          <p className="resource-modal__category">{resource.category}</p>
        </div>

        <p className="resource-modal__description" id="resource-description">
          {resource.description}
        </p>

        <dl className="resource-details">
          <dt>Contact</dt>
          <dd>{resource.contact}</dd>
          <dt>Audio text</dt>
          <dd>{resource.audioText}</dd>
        </dl>

        <div className="button-row button-row--wrap">
          <button className="primary-button" ref={readAloudRef} onClick={onReadAloud} type="button">
            Read aloud
          </button>
          <button className="secondary-button" onClick={onClose} type="button">
            Close
          </button>
        </div>
      </section>
    </div>
  )
}

ResourceModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onReadAloud: PropTypes.func.isRequired,
  resource: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    contact: PropTypes.string,
    audioText: PropTypes.string,
    category: PropTypes.string,
  }).isRequired,
}
