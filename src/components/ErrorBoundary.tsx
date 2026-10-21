import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** qué mostrar si algo falla (recibe el error y una función para reintentar) */
  fallback?: (error: Error, retry: () => void) => ReactNode
}

/** Atrapa errores de una parte de la página para que no se caiga toda la app. */
export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('Error atrapado:', error)
  }

  retry = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    if (this.props.fallback) return this.props.fallback(error, this.retry)
    return (
      <div className="page">
        <div className="card error-card">
          <h2>Algo salió mal en esta página</h2>
          <p>Probá volver a cargarla. Si sigue pasando, avisale al docente con este mensaje:</p>
          <pre className="code">{error.message}
{error.stack?.split('\n').slice(1, 4).join('\n')}</pre>
          <div className="row">
            <button type="button" className="btn primary" onClick={() => location.reload()}>
              Recargar la página
            </button>
            <button type="button" className="btn" onClick={this.retry}>
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }
}
