import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Card, Button } from './index';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    private handleGoHome = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    background: 'var(--background-color)'
                }}>
                    <Card style={{
                        maxWidth: '500px',
                        width: '100%',
                        padding: '3rem 2rem',
                        textAlign: 'center',
                        boxShadow: 'var(--shadow-xl)',
                        borderRadius: 'var(--radius-xl)',
                        borderTop: '6px solid var(--danger-color)'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'rgba(230, 57, 70, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem'
                        }}>
                            <AlertTriangle size={40} color="var(--danger-color)" />
                        </div>

                        <h1 style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                            ¡Ups! Algo salió mal
                        </h1>

                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
                            Lo sentimos, ha ocurrido un error inesperado. Hemos notificado al equipo técnico para solucionarlo lo antes posible.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Button
                                onClick={this.handleReset}
                                fullWidth
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', height: '3.5rem', fontWeight: '800' }}
                            >
                                <RefreshCw size={20} /> Intentar de nuevo
                            </Button>

                            <Button
                                variant="outline"
                                onClick={this.handleGoHome}
                                fullWidth
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', height: '3.5rem', fontWeight: '800' }}
                            >
                                <Home size={20} /> Volver al Inicio
                            </Button>
                        </div>

                        {import.meta.env.DEV && (
                            <details style={{ marginTop: '2rem', textAlign: 'left', fontSize: '0.8rem', opacity: 0.6 }}>
                                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Detalles técnicos</summary>
                                <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem', color: 'var(--danger-color)' }}>
                                    {this.state.error?.toString()}
                                </pre>
                            </details>
                        )}
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
