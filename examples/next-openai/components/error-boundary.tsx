'use client';

import React from 'react';

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((error: Error) => React.ReactNode);
};

type State = { hasError: boolean; error?: Error };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Caught error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      const { fallback } = this.props;
      if (fallback) {
        return typeof fallback === 'function' ? (fallback as any)(error) : fallback;
      }
      return (
        <div className="h-[600px] w-full flex items-center justify-center text-red-700 bg-red-50 rounded-md border border-red-200 p-4 text-sm">
          Ett fel inträffade när ChatKit skulle visas. Kolla konsolen för detaljer.
        </div>
      );
    }
    return this.props.children;
  }
}
