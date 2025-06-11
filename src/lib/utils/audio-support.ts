import type { BrowserSupport, AudioCapabilities } from "@/lib/types/audio";

/**
 * ブラウザの音声機能サポート状況を検出
 */
export function detectBrowserSupport(): BrowserSupport {
  const support: BrowserSupport = {
    speechRecognition: false,
    speechSynthesis: false,
    mediaRecorder: false,
    getUserMedia: false,
  };

  // SpeechRecognition API サポート検出
  if (typeof window !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    support.speechRecognition = !!(
      win.SpeechRecognition || win.webkitSpeechRecognition
    );

    // SpeechSynthesis API サポート検出
    support.speechSynthesis = !!(
      window.speechSynthesis &&
      typeof window.speechSynthesis.speak === "function"
    );

    // MediaRecorder API サポート検出
    support.mediaRecorder = !!(
      window.MediaRecorder && typeof window.MediaRecorder === "function"
    );

    // getUserMedia API サポート検出
    support.getUserMedia = !!(
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    );
  }

  return support;
}

/**
 * 音声機能の利用可能性をチェック
 */
export function getAudioCapabilities(): AudioCapabilities {
  const support = detectBrowserSupport();

  return {
    speechRecognition: support.speechRecognition,
    speechSynthesis: support.speechSynthesis,
    mediaRecorder: support.mediaRecorder && support.getUserMedia,
    audioContext:
      typeof window !== "undefined" &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      !!(window.AudioContext || (window as any).webkitAudioContext),
  };
}

/**
 * SpeechRecognition コンストラクタを取得
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSpeechRecognition(): any {
  if (typeof window === "undefined") return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any;
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

/**
 * AudioContext コンストラクタを取得
 */
export function getAudioContext(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return window.AudioContext || (window as any).webkitAudioContext || null;
}

/**
 * ブラウザ固有の制限事項を取得
 */
export function getBrowserLimitations(): {
  requiresUserGesture: boolean;
  maxRecordingTime?: number;
  supportedLanguages: string[];
} {
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isFirefox = userAgent.includes("Firefox");
  const isSafari =
    userAgent.includes("Safari") && !userAgent.includes("Chrome");
  const isChrome = userAgent.includes("Chrome");

  return {
    requiresUserGesture: isSafari || isChrome, // Safari/Chrome では音声再生にユーザージェスチャーが必要
    maxRecordingTime: isFirefox ? undefined : 60000, // Firefox以外では制限がある場合がある
    supportedLanguages: [
      "ja-JP", // 日本語
      "en-US", // 英語（米国）
      "en-GB", // 英語（英国）
    ],
  };
}

/**
 * エラーメッセージを日本語化
 */
export function getLocalizedErrorMessage(error: string): string {
  const errorMessages: Record<string, string> = {
    "not-allowed":
      "マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。",
    "not-found":
      "マイクが見つかりません。マイクが接続されているか確認してください。",
    "not-supported":
      "お使いのブラウザは音声認識をサポートしていません。Chrome、Safari、Edgeをお試しください。",
    network:
      "ネットワークエラーが発生しました。インターネット接続を確認してください。",
    "audio-capture":
      "音声の録音に失敗しました。マイクが正常に動作しているか確認してください。",
    "no-speech": "音声が検出されませんでした。マイクに向かって話してください。",
    aborted: "音声認識が中断されました。",
    "service-not-allowed": "音声認識サービスが利用できません。",
  };

  return errorMessages[error] || `音声処理エラー: ${error}`;
}
