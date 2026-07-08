import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled React runtime error captured by high-fidelity boundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleReturnToSafety = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '#/';
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#070504] text-cream flex items-center justify-center p-6 font-sans select-none">
          <div className="w-full max-w-lg bg-[#141211] border border-gold/25 p-8 rounded-2xl relative shadow-[0_30px_90px_rgba(0,0,0,0.85)] flex flex-col items-center text-center">
            
            {/* Spinning Compass Secure Ring Icon */}
            <div className="relative mb-6 flex items-center justify-center">
              <div className="absolute w-16 h-16 border border-gold/10 rounded-full animate-pulse" />
              <div className="absolute w-12 h-12 border border-dashed border-gold/30 rounded-full animate-[spin_5s_linear_infinite]" />
              <div className="w-10 h-10 bg-dark border border-gold/50 rounded-lg flex items-center justify-center text-gold">
                <ShieldAlert size={20} />
              </div>
            </div>

            <h2 className="font-serif text-2xl tracking-wide text-cream uppercase mb-2">
              Security Safehouse Triggered
            </h2>
            <p className="text-[10px] uppercase font-mono tracking-widest text-gold/60 mb-6">
              A runtime component failed to render gracefully
            </p>

            <div className="w-full bg-black/45 border border-white/5 p-4 rounded-lg mb-8 text-left max-h-36 overflow-y-auto">
              <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider block mb-2 border-b border-white/5 pb-1">
                Diagnostic Stack Log
              </span>
              <p className="font-mono text-[11px] text-red-400 break-words leading-relaxed select-text">
                {this.state.error?.name}: {this.state.error?.message || 'Generic component initialization error.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-gradient-to-r from-gold/90 to-gold hover:from-gold hover:to-yellow-400 text-dark text-xs uppercase font-bold tracking-widest font-mono rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <RefreshCcw size={14} /> Reinitialize Application
              </button>
              <button
                onClick={this.handleReturnToSafety}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-cream text-xs uppercase font-bold tracking-widest font-mono rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home size={14} /> Return To Safety
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
