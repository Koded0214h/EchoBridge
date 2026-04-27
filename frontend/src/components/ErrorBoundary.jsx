import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message ?? 'Unknown error' }
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="page page--not-found" aria-labelledby="error-title">
          <p className="eyebrow">Something went wrong</p>
          <h2 id="error-title">This part of the app crashed.</h2>
          <p>You can go back to a working screen using the buttons below.</p>
          <div className="button-row">
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' })
                window.location.replace('/home')
              }}
            >
              Go home
            </button>
          </div>
        </section>
      )
    }

    return this.props.children
  }
}
