"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { logger } from "@/lib/logger";

interface Props {
  /** Shown in the log so you can tell which boundary caught the error. */
  scope: string;
  children: ReactNode;
  /** Compact fallback for per-section boundaries. */
  compact?: boolean;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time errors. (Async save failures are handled separately by
 * `track()` in useContentCalendar, because error boundaries cannot see them.)
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error(`ErrorBoundary:${this.props.scope}`, error.message, info.componentStack ?? undefined);
  }

  private reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.compact) {
      return (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          This section failed to render: {error.message}{" "}
          <button onClick={this.reset} className="font-medium underline underline-offset-2">
            Retry
          </button>
        </div>
      );
    }

    return (
      <div className="mx-auto mt-24 max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          !
        </div>
        <h2 className="text-lg font-semibold text-zinc-900">Something went wrong</h2>
        <p className="mt-2 text-sm text-zinc-500">{error.message}</p>
        <button
          onClick={this.reset}
          className="mt-6 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Try again
        </button>
      </div>
    );
  }
}
