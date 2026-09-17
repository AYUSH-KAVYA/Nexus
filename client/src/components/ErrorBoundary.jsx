import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Nexus UI ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 text-center shadow-2xl backdrop-blur-xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mb-1">Display Issue</h3>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              An unexpected render issue occurred in this section. The application state remains intact.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3 bg-zinc-950 rounded-xl border border-rose-900/50 text-left font-mono text-[11px] text-rose-300 overflow-x-auto max-h-40">
                <div className="font-bold text-rose-400 mb-1">Error: {this.state.error.toString()}</div>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-zinc-500 whitespace-pre-wrap">{this.state.error.stack}</pre>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload View
              </button>
              <a
                href="/"
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-2 transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                Return Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
