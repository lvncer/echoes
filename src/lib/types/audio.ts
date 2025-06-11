// 音声処理関連の型定義

export interface AudioDeviceInfo {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export interface AudioInputConfig {
  deviceId?: string;
  sampleRate?: number;
  channelCount?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

// AudioConfigエイリアス（後方互換性のため）
export type AudioConfig = AudioInputConfig;

export interface SpeechRecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

export interface SpeechSynthesisConfig {
  voice?: SpeechSynthesisVoice;
  rate: number;
  pitch: number;
  volume: number;
  language: string;
}

export interface AudioProcessingState {
  isRecording: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  error: string | null;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface AudioCapabilities {
  speechRecognition: boolean;
  speechSynthesis: boolean;
  mediaRecorder: boolean;
  audioContext: boolean;
}

// エラー型定義
export interface AudioError {
  type:
    | "permission-denied"
    | "not-supported"
    | "network-error"
    | "audio-capture"
    | "speech-recognition-failed"
    | "speech-synthesis-failed"
    | "initialization-failed"
    | "ai-response-failed";
  message: string;
  originalError?: Error;
}

// イベント型定義
export interface AudioEvents {
  onRecordingStart: () => void;
  onRecordingStop: () => void;
  onSpeechStart: () => void;
  onSpeechEnd: () => void;
  onResult: (result: SpeechRecognitionResult) => void;
  onError: (error: string) => void;
  onAudioLevel: (level: number) => void;
}

// 音声制御モード
export type AudioControlMode =
  | "push-to-talk"
  | "voice-activation"
  | "continuous";

// ブラウザサポート状況
export interface BrowserSupport {
  speechRecognition: boolean;
  speechSynthesis: boolean;
  mediaRecorder: boolean;
  getUserMedia: boolean;
}
