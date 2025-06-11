"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Next.js グローバルエラーページ
 * アプリケーション全体のエラーをキャッチして表示します
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const isDevelopment = process.env.NODE_ENV === "development";

  React.useEffect(() => {
    // エラーログを記録
    console.error("Global error page:", error);

    // 本番環境では外部エラー監視サービスに送信
    if (process.env.NODE_ENV === "production") {
      // TODO: Sentry、LogRocket等のエラー監視サービスに送信
      reportErrorToService(error);
    }
  }, [error]);

  const reportErrorToService = (error: Error) => {
    // 外部エラー監視サービスへの送信ロジック
    console.log("Error reported to monitoring service:", error);
  };

  const getErrorMessage = (error: Error): string => {
    // エラーの種類に応じてユーザーフレンドリーなメッセージを返す
    if (error.message.includes("ChunkLoadError")) {
      return "アプリケーションの更新が検出されました。ページを再読み込みしてください。";
    }

    if (
      error.message.includes("NetworkError") ||
      error.message.includes("fetch")
    ) {
      return "ネットワーク接続に問題があります。インターネット接続を確認してください。";
    }

    if (error.message.includes("API")) {
      return "サーバーとの通信でエラーが発生しました。しばらく時間をおいてお試しください。";
    }

    return "予期しないエラーが発生しました。";
  };

  const getErrorSolution = (error: Error): string[] => {
    const solutions: string[] = [];

    if (error.message.includes("ChunkLoadError")) {
      solutions.push("ページを再読み込みしてください");
      solutions.push("ブラウザのキャッシュをクリアしてください");
    } else if (
      error.message.includes("NetworkError") ||
      error.message.includes("fetch")
    ) {
      solutions.push("インターネット接続を確認してください");
      solutions.push("VPNを使用している場合は一時的に無効にしてください");
      solutions.push("ファイアウォールの設定を確認してください");
    } else if (error.message.includes("API")) {
      solutions.push("しばらく時間をおいてお試しください");
      solutions.push("API設定を確認してください");
    } else {
      solutions.push("ページを再読み込みしてください");
      solutions.push("ブラウザを再起動してください");
      solutions.push("問題が続く場合はサポートにお問い合わせください");
    }

    return solutions;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">{getErrorMessage(error)}</CardTitle>
          <CardDescription>
            申し訳ございません。以下の解決方法をお試しください。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 解決方法 */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm">解決方法:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {getErrorSolution(error).map((solution, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary mt-0.5">
                    {index + 1}
                  </span>
                  {solution}
                </li>
              ))}
            </ul>
          </div>

          {/* アクションボタン */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={reset}
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
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              ページ再読み込み
            </Button>
          </div>

          {/* 開発者向け詳細情報 */}
          {isDevelopment && (
            <details className="mt-6 p-4 bg-muted rounded-lg">
              <summary className="cursor-pointer font-medium text-sm mb-2 flex items-center gap-2">
                <Bug className="w-4 h-4" />
                開発者向け詳細情報
              </summary>
              <div className="space-y-3 text-xs">
                <div>
                  <strong>エラーメッセージ:</strong>
                  <pre className="mt-1 p-2 bg-background rounded text-destructive overflow-auto">
                    {error.message}
                  </pre>
                </div>
                {error.digest && (
                  <div>
                    <strong>エラーダイジェスト:</strong>
                    <pre className="mt-1 p-2 bg-background rounded text-muted-foreground overflow-auto">
                      {error.digest}
                    </pre>
                  </div>
                )}
                {error.stack && (
                  <div>
                    <strong>スタックトレース:</strong>
                    <pre className="mt-1 p-2 bg-background rounded text-muted-foreground overflow-auto text-xs">
                      {error.stack}
                    </pre>
                  </div>
                )}
                <div>
                  <strong>エラー発生時刻:</strong>
                  <span className="ml-2 text-muted-foreground">
                    {new Date().toLocaleString("ja-JP")}
                  </span>
                </div>
              </div>
            </details>
          )}

          {/* サポート情報 */}
          <div className="text-center text-xs text-muted-foreground border-t pt-4">
            問題が解決しない場合は、エラーの詳細情報と共にサポートまでお問い合わせください。
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
