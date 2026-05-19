// Catches lazy-route / chunk load failures (common on Android Chrome + PWA cache mismatch)
import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  pageName?: string;
}

interface State {
  hasError: boolean;
}

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(`[RouteErrorBoundary${this.props.pageName ? `: ${this.props.pageName}` : ""}]`, error);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-h2 mb-2">Page failed to load</h1>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            This can happen on Android Chrome after an app update. Refresh to load the latest version.
          </p>
          <Button onClick={this.handleRetry}>Refresh app</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
