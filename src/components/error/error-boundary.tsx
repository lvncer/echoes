"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorInfo?: React.ErrorInfo;
}

/**
 * デフォルトのエラーフォールバックコンポーネント
 */
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  errorInfo,
}) => {
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">
            予期しないエラーが発生しました
          </CardTitle>
          <CardDescription>
            申し訳ございません。アプリケーションでエラーが発生しました。
            ページを再読み込みするか、ホームページに戻ってお試しください。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={resetError}
              variant="default"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              再試行
            </Button>
            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              ホームに戻る
            </Button>
          </div>

          {isDevelopment && (
            <details className="mt-6 p-4 bg-muted rounded-lg">
              <summary className="cursor-pointer font-medium text-sm mb-2">
                開発者向け詳細情報
              </summary>
              <div className="space-y-2 text-xs">
                <div>
                  <strong>エラーメッセージ:</strong>
                  <pre className="mt-1 p-2 bg-background rounded text-destructive overflow-auto">
                    {error.message}
                  </pre>
                </div>
                {error.stack && (
                  <div>
                    <strong>スタックトレース:</strong>
                    <pre className="mt-1 p-2 bg-background rounded text-muted-foreground overflow-auto text-xs">
                      {error.stack}
                    </pre>
                  </div>
                )}
                {errorInfo?.componentStack && (
                  <div>
                    <strong>コンポーネントスタック:</strong>
                    <pre className="mt-1 p-2 bg-background rounded text-muted-foreground overflow-auto text-xs">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * React Error Boundary
 * アプリケーション内のJavaScriptエラーをキャッチし、
 * ユーザーフレンドリーなエラー画面を表示します。
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // エラーログを記録
    console.error("Error Boundary caught an error:", error, errorInfo);

    // カスタムエラーハンドラーを呼び出し
    this.props.onError?.(error, errorInfo);

    // 状態を更新
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });

    // 本番環境では外部エラー監視サービスに送信
    if (process.env.NODE_ENV === "production") {
      // TODO: Sentry、LogRocket等のエラー監視サービスに送信
      this.reportErrorToService(error, errorInfo);
    }
  }

  private reportErrorToService(error: Error, errorInfo: React.ErrorInfo) {
    // 外部エラー監視サービスへの送信ロジック
    // 例: Sentry.captureException(error, { contexts: { react: errorInfo } });
    console.log("Error reported to monitoring service:", { error, errorInfo });
  }

  private resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;

      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          errorInfo={this.state.errorInfo}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Error Boundary Hook
 * 関数コンポーネントでError Boundaryを簡単に使用するためのフック
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}

/**
 * 特定のコンポーネント用のError Boundary HOC
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: React.ComponentType<ErrorFallbackProps>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={errorFallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}
