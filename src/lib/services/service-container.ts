/**
 * サービスコンテナ - 依存性注入システム
 * グローバル変数への依存を排除し、テスタビリティを向上
 */

import { AnimationController } from "./animation-controller";
import { AudioInputService } from "./audio-input";
import { SpeechRecognitionService } from "./speech-recognition";
import { IntegratedSpeechService } from "./integrated-speech-service";
import { EmotionAnimationController } from "./emotion-animation-controller";
import { GestureAnimationController } from "./gesture-animation-controller";
import { PerformanceMonitor } from "./performance-monitor";
import { configurationManager } from "./configuration-manager";

export interface ServiceContainer {
  animationController: AnimationController;
  audioInputService: AudioInputService;
  speechRecognitionService: SpeechRecognitionService;
  speechService: IntegratedSpeechService;
  emotionController: EmotionAnimationController;
  gestureController: GestureAnimationController;
  performanceMonitor: PerformanceMonitor;
  configurationManager: typeof configurationManager;
}

class ServiceContainerImpl implements ServiceContainer {
  private _animationController: AnimationController | null = null;
  private _audioInputService: AudioInputService | null = null;
  private _speechRecognitionService: SpeechRecognitionService | null = null;
  private _speechService: IntegratedSpeechService | null = null;
  private _emotionController: EmotionAnimationController | null = null;
  private _gestureController: GestureAnimationController | null = null;
  private _performanceMonitor: PerformanceMonitor | null = null;

  get animationController(): AnimationController {
    if (!this._animationController) {
      this._animationController = new AnimationController();
    }
    return this._animationController;
  }

  get audioInputService(): AudioInputService {
    if (!this._audioInputService) {
      this._audioInputService = new AudioInputService();
    }
    return this._audioInputService;
  }

  get speechRecognitionService(): SpeechRecognitionService {
    if (!this._speechRecognitionService) {
      this._speechRecognitionService = new SpeechRecognitionService();
    }
    return this._speechRecognitionService;
  }

  get speechService(): IntegratedSpeechService {
    if (!this._speechService) {
      this._speechService = new IntegratedSpeechService();
    }
    return this._speechService;
  }

  get emotionController(): EmotionAnimationController {
    if (!this._emotionController) {
      this._emotionController = new EmotionAnimationController();
    }
    return this._emotionController;
  }

  get gestureController(): GestureAnimationController {
    if (!this._gestureController) {
      this._gestureController = new GestureAnimationController();
    }
    return this._gestureController;
  }

  get performanceMonitor(): PerformanceMonitor {
    if (!this._performanceMonitor) {
      this._performanceMonitor = new PerformanceMonitor();
    }
    return this._performanceMonitor;
  }

  get configurationManager() {
    return configurationManager;
  }

  public setAnimationController(controller: AnimationController): void {
    this._animationController = controller;
  }

  public cleanup(): void {
    this._animationController?.cleanup?.();
    this._performanceMonitor?.stopMonitoring();
    this._animationController = null;
    this._audioInputService = null;
    this._speechRecognitionService = null;
    this._speechService = null;
    this._emotionController = null;
    this._gestureController = null;
    this._performanceMonitor = null;
  }
}

export const serviceContainer = new ServiceContainerImpl();
