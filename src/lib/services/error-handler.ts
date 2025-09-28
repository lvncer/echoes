/**
 * 統一エラーハンドリングサービス
 * アプリケーション全体のエラー処理を統一
 */

export interface AppError {
  type: "audio" | "ai" | "animation" | "network" | "validation" | "unknown";
  code: string;
  message: string;
  details?: unknown;
  timestamp: Date;
  recoverable: boolean;
}

export interface ErrorHandlerCallbacks {
  onError?: (error: AppError) => void;
  onRecovery?: (error: AppError) => void;
}

class ErrorHandlerService {
  private callbacks: ErrorHandlerCallbacks = {};
  private errorHistory: AppError[] = [];
  private maxHistorySize = 50;

  public setCallbacks(callbacks: ErrorHandlerCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public handleError(
    type: AppError["type"],
    code: string,
    message: string,
    details?: unknown,
    recoverable: boolean = true,
  ): AppError {
    const error: AppError = {
      type,
      code,
      message,
      details,
      timestamp: new Date(),
      recoverable,
    };

    this.addToHistory(error);
    this.callbacks.onError?.(error);

    console.error(`[${type.toUpperCase()}] ${code}: ${message}`, details);

    return error;
  }

  public handleAudioError(code: string, message: string, details?: unknown): AppError {
    return this.handleError("audio", code, message, details);
  }

  public handleAIError(code: string, message: string, details?: unknown): AppError {
    return this.handleError("ai", code, message, details);
  }

  public handleAnimationError(code: string, message: string, details?: unknown): AppError {
    return this.handleError("animation", code, message, details);
  }

  public handleNetworkError(code: string, message: string, details?: unknown): AppError {
    return this.handleError("network", code, message, details);
  }

  public handleValidationError(code: string, message: string, details?: unknown): AppError {
    return this.handleError("validation", code, message, details, false);
  }

  public handleUnknownError(message: string, details?: unknown): AppError {
    return this.handleError("unknown", "UNKNOWN_ERROR", message, details);
  }

  public tryRecover(error: AppError): boolean {
    if (!error.recoverable) {
      return false;
    }

    try {
      this.callbacks.onRecovery?.(error);
      return true;
    } catch (recoveryError) {
      this.handleError(
        "unknown",
        "RECOVERY_FAILED",
        `Failed to recover from error: ${error.code}`,
        recoveryError,
        false,
      );
      return false;
    }
  }

  public getErrorHistory(): readonly AppError[] {
    return [...this.errorHistory];
  }

  public clearHistory(): void {
    this.errorHistory = [];
  }

  private addToHistory(error: AppError): void {
    this.errorHistory.push(error);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
  }
}

export const errorHandler = new ErrorHandlerService();
