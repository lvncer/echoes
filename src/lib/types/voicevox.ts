/**
 * VOICEVOX API 型定義
 */

export interface VoicevoxSpeaker {
  name: string;
  speaker_uuid: string;
  styles: VoicevoxStyle[];
  version: string;
}

export interface VoicevoxStyle {
  id: number;
  name: string;
}

export interface VoicevoxPreset {
  id: number;
  name: string;
  speaker_uuid: string;
  style_id: number;
  speedScale: number;
  pitchScale: number;
  intonationScale: number;
  volumeScale: number;
  prePhonemeLength: number;
  postPhonemeLength: number;
}

export interface AudioQuery {
  accent_phrases: AccentPhrase[];
  speedScale: number;
  pitchScale: number;
  intonationScale: number;
  volumeScale: number;
  prePhonemeLength: number;
  postPhonemeLength: number;
  outputSamplingRate: number;
  outputStereo: boolean;
  kana: string;
}

export interface AccentPhrase {
  moras: Mora[];
  accent: number;
  pause_mora?: Mora;
  is_interrogative?: boolean;
}

export interface Mora {
  text: string;
  consonant?: string;
  consonant_length?: number;
  vowel: string;
  vowel_length: number;
  pitch: number;
}

export interface VoicevoxConfig {
  serverUrl: string;
  speaker: number;
  autoFallback: boolean;
  timeout: number;
  useWebApi: boolean; // Web API使用フラグ
}

export interface VoicevoxServerInfo {
  version: string;
  core_version: string;
  supported_features: {
    adjust_mora_pitch: boolean;
    adjust_phoneme_length: boolean;
    adjust_speed_scale: boolean;
    adjust_pitch_scale: boolean;
    adjust_intonation_scale: boolean;
    adjust_volume_scale: boolean;
    interrogative_upspeak: boolean;
  };
}

export interface VoicevoxError {
  detail: string;
}

export const DEFAULT_VOICEVOX_CONFIG: VoicevoxConfig = {
  serverUrl: "http://localhost:50021",
  speaker: 3, // ずんだもん（ノーマル）
  autoFallback: true,
  timeout: 10000, // 10秒
  useWebApi: true, // デフォルトでWeb API使用
};

// VOICEVOX Web API設定
export const VOICEVOX_WEB_API_CONFIG: VoicevoxConfig = {
  serverUrl: "https://deprecatedapis.tts.quest/v2/voicevox",
  speaker: 3, // ずんだもん（ノーマル）
  autoFallback: true,
  timeout: 15000, // Web APIは少し長めに設定
  useWebApi: true,
};

// 話者ID マッピング（クレジット表記用）
export const SPEAKER_CREDITS: Record<number, string> = {
  0: "VOICEVOX:四国めたん",
  1: "VOICEVOX:ずんだもん", 
  2: "VOICEVOX:四国めたん",
  3: "VOICEVOX:ずんだもん",
  4: "VOICEVOX:四国めたん",
  5: "VOICEVOX:ずんだもん",
  6: "VOICEVOX:四国めたん",
  7: "VOICEVOX:ずんだもん",
  8: "VOICEVOX:春日部つむぎ",
  9: "VOICEVOX:波音リツ",
  10: "VOICEVOX:雨晴はう",
  11: "VOICEVOX:玄野武宏",
  12: "VOICEVOX:白上虎太郎",
  13: "VOICEVOX:青山龍星",
  14: "VOICEVOX:冥鳴ひまり",
  15: "VOICEVOX:九州そら",
  16: "VOICEVOX:九州そら",
  17: "VOICEVOX:九州そら",
  18: "VOICEVOX:九州そら",
  19: "VOICEVOX:九州そら",
  20: "VOICEVOX:もち子さん",
  21: "VOICEVOX:剣崎雌雄",
};

export function getRequiredCredit(speakerId: number): string {
  return SPEAKER_CREDITS[speakerId] || "VOICEVOX";
} 