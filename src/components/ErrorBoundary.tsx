import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Music Madness error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4 text-center">
          <p className="text-5xl mb-6">😵</p>
          <h1 className="text-2xl font-heading font-bold mb-2">Something went wrong</h1>
          <p className="text-text-secondary font-body mb-6 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/';
            }}
            className="bg-spotify-green hover:bg-spotify-green-bright text-black font-bold px-8 py-3 rounded-full font-body cursor-pointer"
          >
            Start Over
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
