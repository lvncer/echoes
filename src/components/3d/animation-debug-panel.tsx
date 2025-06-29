"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Trash2 } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'log' | 'warn' | 'error';
  message: string;
  details?: unknown;
}

interface AnimationDebugPanelProps {
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export function AnimationDebugPanel({ isVisible, onToggleVisibility }: AnimationDebugPanelProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [animationState, setAnimationState] = useState<{
    isEnabled: boolean;
    isSpeaking: boolean;
    sessionSpeaking: boolean;
    activeAnimations: number;
    frameRate: number;
    hasVRMModel: boolean;
  }>({
    isEnabled: false,
    isSpeaking: false,
    sessionSpeaking: false,
    activeAnimations: 0,
    frameRate: 0,
    hasVRMModel: false,
  });

  // セッションから音声合成状態をチェック
  const checkSessionSpeaking = (): boolean => {
    try {
      const storedState = sessionStorage.getItem('animation-controller-speaking-state');
      if (storedState) {
        const state = JSON.parse(storedState);
        return state.isSpeaking && Date.now() - state.timestamp < 30000;
      }
    } catch (error) {
      console.error('[AnimationDebugPanel] セッション状態チェックエラー:', error);
    }
    return false;
  };

  // Animation Controllerの状態を監視
  useEffect(() => {
    const updateInterval = setInterval(() => {
      if (typeof window !== "undefined" && window.__animationController) {
        const controller = window.__animationController;
        const debugState = controller.getDebugState();
        const sessionSpeaking = checkSessionSpeaking();
        
        setAnimationState({
          isEnabled: debugState.isEnabled,
          isSpeaking: debugState.isSpeaking,
          sessionSpeaking,
          activeAnimations: debugState.activeAnimations.length,
          frameRate: debugState.frameRate,
          hasVRMModel: debugState.hasVRMModel,
        });
      }
    }, 500); // 500msごとに更新

    return () => clearInterval(updateInterval);
  }, []);

  // コンソールログをキャプチャ
  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const addLog = (level: LogEntry['level'], message: string, details?: unknown) => {
      // Animation Controller関連のログのみキャプチャ
      if (message.includes('[AnimationController]') || message.includes('[IntegratedSpeechService]')) {
        const logEntry: LogEntry = {
          id: Date.now() + Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          level,
          message,
          details,
        };
        
        setLogs(prev => {
          const newLogs = [logEntry, ...prev];
          // 最大100エントリーまで保持
          return newLogs.slice(0, 100);
        });
      }
    };

    console.log = (message: string, ...args) => {
      originalLog(message, ...args);
      addLog('log', message, args.length > 0 ? args : undefined);
    };

    console.warn = (message: string, ...args) => {
      originalWarn(message, ...args);
      addLog('warn', message, args.length > 0 ? args : undefined);
    };

    console.error = (message: string, ...args) => {
      originalError(message, ...args);
      addLog('error', message, args.length > 0 ? args : undefined);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
  };

  const testSpeakingControl = () => {
    if (typeof window !== "undefined" && window.__animationController) {
      console.log('[AnimationController] テスト: 音声合成開始');
      window.__animationController.setSpeaking(true);
      
      setTimeout(() => {
        console.log('[AnimationController] テスト: 音声合成終了');
        window.__animationController?.setSpeaking(false);
      }, 3000);
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed top-20 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleVisibility}
          className="bg-black/80 text-white border-white/20 hover:bg-black/90"
        >
          <Eye className="w-4 h-4" />
          デバッグ
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-20 right-4 w-96 max-h-96 z-50">
      <Card className="bg-black/90 text-white border-white/20 p-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Animation Debug</h3>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={testSpeakingControl}>
              テスト
            </Button>
            <Button variant="ghost" size="sm" onClick={clearLogs}>
              <Trash2 className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onToggleVisibility}>
              <EyeOff className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* 状態表示 */}
        <div className="mb-3 space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <Badge variant={animationState.hasVRMModel ? "default" : "secondary"}>
              VRM: {animationState.hasVRMModel ? "有効" : "無効"}
            </Badge>
            <Badge variant={animationState.isEnabled ? "default" : "secondary"}>
              制御: {animationState.isEnabled ? "有効" : "無効"}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant={animationState.isSpeaking ? "destructive" : "default"}>
              音声: {animationState.isSpeaking ? "再生中" : "停止"}
            </Badge>
            <Badge variant={animationState.sessionSpeaking ? "destructive" : "secondary"}>
              セッション: {animationState.sessionSpeaking ? "再生中" : "停止"}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline">
              FPS: {animationState.frameRate.toFixed(1)}
            </Badge>
            <Badge variant="outline">
              アニメ: {animationState.activeAnimations}
            </Badge>
          </div>
        </div>

        {/* ログ表示 */}
        <div className="max-h-60 overflow-y-auto space-y-1">
          {logs.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-4">
              ログはありません
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="text-xs border-l-2 border-gray-600 pl-2 py-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-400">{log.timestamp}</span>
                  <Badge 
                    variant={log.level === 'error' ? 'destructive' : log.level === 'warn' ? 'secondary' : 'outline'}
                    className="text-xs px-1 py-0"
                  >
                    {log.level}
                  </Badge>
                </div>
                <div className="text-gray-200 leading-tight">
                  {log.message}
                </div>
                {!!log.details && (
                  <div className="text-gray-400 text-xs mt-1 font-mono">
                    {typeof log.details === 'string' 
                      ? log.details.slice(0, 100)
                      : JSON.stringify(log.details, null, 2).slice(0, 100)
                    }...
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
} 