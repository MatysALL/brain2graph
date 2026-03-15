import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Radar Graph Render Crash:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[400px] flex items-center justify-center relative p-8 glass-panel overflow-hidden bg-pink-950/20 border-pink-500/30">
          <div className="flex flex-col items-center justify-center text-center max-w-md gap-4">
            <div className="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-500 mb-2">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-bold text-white neon-text-pink">Graphic Engine Exception</h2>
            <p className="text-sm text-gray-400">
              Impossible de visualiser le graphique.
            </p>
            <div className="p-3 bg-black/50 rounded text-xs font-mono text-pink-400 border border-pink-500/20 w-full text-left overflow-x-auto">
              {this.state.error?.message || "Erreur inconnue"}
            </div>
            <button
              onClick={this.handleReset}
              className="mt-4 flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-pink-600 hover:bg-pink-500 rounded-lg shadow-[0_0_20px_rgba(255,0,127,0.4)] transition-all"
            >
              <RefreshCw size={16} />
              Reboot Visualizer
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
