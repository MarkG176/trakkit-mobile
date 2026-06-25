// Top-level safety net: catches render/runtime errors anywhere in the tree
// (including failed lazy-route chunk imports) so the app shows a recovery
// screen instead of a blank white page.
import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { attemptChunkRecovery, isChunkLoadError } from "@/utils/chunkErrorRecovery";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, isChunkError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, isChunkError: isChunkLoadError(error) };
  }

  componentDidCatch(error: Error) {
    console.error("[AppErrorBoundary]", error);
    // Stale-cache chunk failure: purge caches/SW and reload once. The guard in
    // attemptChunkRecovery prevents reload loops; if it bails, the fallback
    // below stays on screen so the user can refresh manually.
    if (isChunkLoadError(error)) {
      void attemptChunkRecovery();
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, isChunkError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-h2 mb-2">
            {this.state.isChunkError ? "Updating app..." : "Something went wrong"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            {this.state.isChunkError
              ? "A newer version is available. If this screen doesn't refresh on its own, tap below to load the latest version."
              : "An unexpected error occurred. Refreshing usually fixes it."}
          </p>
          <Button onClick={this.handleRetry}>Refresh app</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
