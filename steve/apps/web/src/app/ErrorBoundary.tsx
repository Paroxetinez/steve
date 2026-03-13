"use client";

import { clearSessionToken } from "@/lib/auth-session";
import { Component, ReactNode } from "react";

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: ReactNode | null; errorMessage: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null, errorMessage: "" };
  }

  static getDerivedStateFromError(error: unknown) {
    const errorMessage = String(error);
    return {
      errorMessage,
      error: (
        <p className="pl-2 text-muted-foreground">
          {errorMessage}
        </p>
      ),
    };
  }

  componentDidCatch() {}

  handleRetry = () => {
    // Check if it's an authentication error
    if (this.state.errorMessage.includes("Unauthorized") || 
        this.state.errorMessage.includes("Server Error")) {
      clearSessionToken();
      window.location.href = "/login";
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.error !== null) {
      const isAuthError = this.state.errorMessage.includes("Unauthorized") || 
                          this.state.errorMessage.includes("Server Error");
      
      return (
        <div className="bg-destructive/30 p-8 flex flex-col gap-4 container">
          <h1 className="text-xl font-bold">
            Caught an error while rendering:
          </h1>
          {this.state.error}
          <div className="flex gap-4">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              {isAuthError ? "Go to Login" : "Retry"}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
