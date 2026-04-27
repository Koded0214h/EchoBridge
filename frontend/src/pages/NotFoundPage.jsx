import { useNavigate } from 'react-router-dom'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <section className="page page--not-found" aria-labelledby="not-found-title">
      <p className="eyebrow">404</p>
      <h2 id="not-found-title">This page is not available.</h2>
      <p>The app still works. Use the buttons below to get back to a supported screen.</p>
      <div className="button-row">
        <button className="primary-button" type="button" onClick={() => navigate('/home')}>
          Go home
        </button>
        <button className="secondary-button" type="button" onClick={() => navigate('/resources')}>
          Browse resources
        </button>
      </div>
    </section>
  )
}
