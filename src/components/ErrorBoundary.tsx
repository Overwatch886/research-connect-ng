import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, Trash2 } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleClearData = () => {
    try {
      localStorage.removeItem("research_connect_demographics");
      localStorage.removeItem("research_connect_custom_surveys");
      localStorage.removeItem("research_connect_survey_statuses");
      localStorage.removeItem("research_connect_recorded_responses");
    } catch (e) {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card rounded-2xl border border-border p-6 sm:p-8 text-center space-y-5 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto ring-8 ring-amber-500/5">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold font-display text-foreground">
                Something went wrong
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                An unexpected interface error occurred while loading this view. You can reload the page or return to the home screen.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-muted/60 rounded-xl text-left font-mono text-[11px] text-muted-foreground overflow-x-auto max-h-28 border border-border">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={this.handleReload} className="w-full gap-2 font-medium">
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </Button>
              <div className="flex gap-2">
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1 gap-1.5 text-xs">
                  <Home className="w-3.5 h-3.5" />
                  Home
                </Button>
                <Button onClick={this.handleClearData} variant="ghost" className="flex-1 gap-1.5 text-xs text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Cache
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
