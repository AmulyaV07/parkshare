"use client";

import React from "react";

type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center">
          <h2 className="text-xl font-semibold text-zinc-900">
            Something went wrong
          </h2>
          <p className="text-sm text-zinc-600">
            Please refresh the page and try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

