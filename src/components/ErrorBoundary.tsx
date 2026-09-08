import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('SIMAGU ErrorBoundary captured error:', error?.message, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleResetStorage = () => {
    try {
      localStorage.clear();
      sessionStorage?.clear();
    } catch (e) {
      console.warn('Storage clear handled:', e);
    }
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div id="simagu-error-fallback" className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 text-center">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Terjadi Kendala pada Sistem</h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Aplikasi SIMAGU mendeteksi kendala pada pemrosesan antarmuka. Anda dapat menyegarkan halaman atau mereset data lokal.
            </p>
            {this.state.error && (
              <div className="bg-slate-100 rounded-xl p-3 mb-6 text-left overflow-x-auto text-xs text-rose-700 font-mono">
                {this.state.error.toString()}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                id="btn-error-reload"
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Muat Ulang Halaman
              </button>
              <button
                id="btn-error-reset"
                onClick={this.handleResetStorage}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-xl transition"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Data Lokal
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
