import type {
  AudioDeviceInfo,
  AudioInputConfig,
  AudioEvents,
  AudioProcessingState,
} from "@/lib/types/audio";
import {
  getAudioContext,
  getLocalizedErrorMessage,
} from "@/lib/utils/audio-support";

export class AudioInputService {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private animationFrame: number | null = null;
  private events: Partial<AudioEvents> = {};

  private state: AudioProcessingState = {
    isRecording: false,
    isListening: false,
    isSpeaking: false,
    audioLevel: 0,
    error: null,
  };

  constructor() {
    this.initializeAudioContext();
  }

  /**
   * AudioContext を初期化
   */
  private initializeAudioContext(): void {
    const AudioContextClass = getAudioContext();
    if (AudioContextClass) {
      this.audioContext = new AudioContextClass();
    }
  }

  /**
   * イベントリスナーを設定
   */
  public setEventListeners(events: Partial<AudioEvents>): void {
    this.events = { ...this.events, ...events };
  }

  /**
   * 利用可能な音声入力デバイスを取得
   */
  public async getAudioDevices(): Promise<AudioDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((device) => device.kind === "audioinput")
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `マイク ${device.deviceId.slice(0, 8)}`,
          kind: device.kind,
        }));
    } catch {
      const errorMessage = getLocalizedErrorMessage("not-found");
      this.handleError(errorMessage);
      return [];
    }
  }

  /**
   * マイクアクセスを要求してストリームを取得
   */
  public async requestMicrophoneAccess(
    config: AudioInputConfig = {}
  ): Promise<boolean> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: config.deviceId ? { exact: config.deviceId } : undefined,
          sampleRate: config.sampleRate || 44100,
          channelCount: config.channelCount || 1,
          echoCancellation: config.echoCancellation ?? true,
          noiseSuppression: config.noiseSuppression ?? true,
          autoGainControl: config.autoGainControl ?? true,
        },
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.setupAudioAnalyser();
      this.clearError();
      return true;
    } catch (error) {
      let errorMessage = "マイクアクセスに失敗しました";

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage = getLocalizedErrorMessage("not-allowed");
        } else if (error.name === "NotFoundError") {
          errorMessage = getLocalizedErrorMessage("not-found");
        } else if (error.name === "NotSupportedError") {
          errorMessage = getLocalizedErrorMessage("not-supported");
        }
      }

      this.handleError(errorMessage);
      return false;
    }
  }

  /**
   * 音声解析器を設定
   */
  private setupAudioAnalyser(): void {
    if (!this.audioContext || !this.mediaStream) return;

    try {
      const source = this.audioContext.createMediaStreamSource(
        this.mediaStream
      );
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      this.startAudioLevelMonitoring();
    } catch (error) {
      console.error("音声解析器の設定に失敗:", error);
    }
  }

  /**
   * 音声レベルの監視を開始
   */
  private startAudioLevelMonitoring(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateAudioLevel = () => {
      if (!this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);

      // 音声レベルを計算（0-100の範囲）
      const average =
        dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const level = Math.round((average / 255) * 100);

      this.state.audioLevel = level;
      this.events.onAudioLevel?.(level);

      this.animationFrame = requestAnimationFrame(updateAudioLevel);
    };

    updateAudioLevel();
  }

  /**
   * 録音を開始
   */
  public startRecording(): void {
    if (!this.mediaStream || this.state.isRecording) return;

    try {
      this.mediaRecorder = new MediaRecorder(this.mediaStream);
      const chunks: Blob[] = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        // const blob = new Blob(chunks, { type: "audio/wav" });
        // 必要に応じて録音データを処理（将来の拡張用）
        console.log("録音完了:", chunks.length, "chunks");
      };

      this.mediaRecorder.start();
      this.state.isRecording = true;
      this.events.onRecordingStart?.();
    } catch {
      this.handleError("録音の開始に失敗しました");
    }
  }

  /**
   * 録音を停止
   */
  public stopRecording(): void {
    if (!this.mediaRecorder || !this.state.isRecording) return;

    try {
      this.mediaRecorder.stop();
      this.state.isRecording = false;
      this.events.onRecordingStop?.();
    } catch {
      this.handleError("録音の停止に失敗しました");
    }
  }

  /**
   * 現在の状態を取得
   */
  public getState(): AudioProcessingState {
    return { ...this.state };
  }

  /**
   * エラーを処理
   */
  private handleError(message: string): void {
    this.state.error = message;
    this.events.onError?.(message);
    console.error("AudioInputService Error:", message);
  }

  /**
   * エラーをクリア
   */
  private clearError(): void {
    this.state.error = null;
  }

  /**
   * リソースをクリーンアップ
   */
  public cleanup(): void {
    // アニメーションフレームを停止
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // 録音を停止
    if (this.state.isRecording) {
      this.stopRecording();
    }

    // メディアストリームを停止
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    // AudioContextを閉じる
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
      this.audioContext = null;
    }

    // 状態をリセット
    this.state = {
      isRecording: false,
      isListening: false,
      isSpeaking: false,
      audioLevel: 0,
      error: null,
    };
  }
}
