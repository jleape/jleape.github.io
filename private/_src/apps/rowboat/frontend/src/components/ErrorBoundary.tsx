import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (err: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors in subtree so a malformed store value (e.g., stale schema)
 * shows a recoverable error card instead of blanking the whole app.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);
      return (
        <div className="absolute bottom-3 left-3 right-3 z-[1001] mx-auto max-w-[600px] rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900 shadow-lg">
          <div className="font-medium">Something went wrong.</div>
          <div className="mt-1 font-mono text-xs">{this.state.error.message}</div>
          <button
            className="mt-2 rounded border border-red-300 px-2 py-1 text-xs hover:bg-red-100"
            onClick={this.reset}
          >
            Dismiss
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
