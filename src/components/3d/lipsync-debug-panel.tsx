// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Separator } from "@/components/ui/separator";
// // import { Progress } from "@/components/ui/progress";
// import {
//   Bug,
//   Activity,
//   Settings,
//   RefreshCw,
//   AlertTriangle,
//   CheckCircle,
//   XCircle,
// } from "lucide-react";

// import { lipSyncService } from "@/lib/services/lipsync-service";
// import { advancedLipSyncService } from "@/lib/services/advanced-lipsync-service";
// import { integratedLipSyncService } from "@/lib/services/integrated-lipsync-service";
// import { blendShapeService } from "@/lib/services/blend-shape-service";
// import { phonemeAnalysisService } from "@/lib/services/phoneme-analysis-service";
// import { audioAnalysisService } from "@/lib/services/audio-analysis-service";

// interface LipSyncDebugPanelProps {
//   className?: string;
// }

// interface PerformanceMetrics {
//   fps: number;
//   frameTime: number;
//   memoryUsage: number;
//   audioLatency: number;
//   lipSyncLatency: number;
// }

// interface SystemStatus {
//   webAudioSupported: boolean;
//   microphoneAccess: boolean;
//   vrmModelLoaded: boolean;
//   blendShapesAvailable: number;
//   errors: string[];
//   warnings: string[];
// }

// export function LipSyncDebugPanel({ className }: LipSyncDebugPanelProps) {
//   const [isVisible, setIsVisible] = useState(false);
//   const [activeTab, setActiveTab] = useState("overview");

//   // 各サービスの状態
//   const [basicLipSyncStatus, setBasicLipSyncStatus] = useState(
//     lipSyncService.getStatus()
//   );
//   const [advancedLipSyncStatus, setAdvancedLipSyncStatus] = useState(
//     advancedLipSyncService.getStatus()
//   );
//   const [integratedLipSyncStatus, setIntegratedLipSyncStatus] = useState(
//     integratedLipSyncService.getStatus()
//   );
//   const [blendShapeStatus, setBlendShapeStatus] = useState(
//     blendShapeService.getVRMInfo()
//   );
//   const [, setPhonemeAnalysisStatus] = useState(
//     phonemeAnalysisService.getAnalysisStatus()
//   );
//   const [audioAnalysisStatus, setAudioAnalysisStatus] = useState(
//     audioAnalysisService.getAnalysisStatus()
//   );

//   // パフォーマンス監視
//   const [performanceMetrics, setPerformanceMetrics] =
//     useState<PerformanceMetrics>({
//       fps: 0,
//       frameTime: 0,
//       memoryUsage: 0,
//       audioLatency: 0,
//       lipSyncLatency: 0,
//     });

//   // システム状態
//   const [systemStatus, setSystemStatus] = useState<SystemStatus>({
//     webAudioSupported: false,
//     microphoneAccess: false,
//     vrmModelLoaded: false,
//     blendShapesAvailable: 0,
//     errors: [],
//     warnings: [],
//   });

//   // デバッグ情報
//   const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({});

//   /**
//    * 全ステータスを更新
//    */
//   const updateAllStatus = useCallback(() => {
//     try {
//       // 基本サービス状態
//       setBasicLipSyncStatus(lipSyncService.getStatus());
//       setAdvancedLipSyncStatus(advancedLipSyncService.getStatus());
//       setIntegratedLipSyncStatus(integratedLipSyncService.getStatus());
//       setBlendShapeStatus(blendShapeService.getVRMInfo());
//       setPhonemeAnalysisStatus(phonemeAnalysisService.getAnalysisStatus());
//       setAudioAnalysisStatus(audioAnalysisService.getAnalysisStatus());

//       // デバッグ情報
//       const debugData = {
//         basic: lipSyncService.getDebugInfo(),
//         advanced: advancedLipSyncService.getDebugInfo(),
//         integrated: integratedLipSyncService.getDebugInfo(),
//       };
//       setDebugInfo(debugData);

//       // システム状態チェック
//       updateSystemStatus();

//       // パフォーマンス監視
//       updatePerformanceMetrics();
//     } catch (error) {
//       console.error("デバッグパネル更新エラー:", error);
//     }
//   }, []);

//   /**
//    * システム状態を更新
//    */
//   const updateSystemStatus = useCallback(() => {
//     const errors: string[] = [];
//     const warnings: string[] = [];

//     // Web Audio API サポートチェック
//     const webAudioSupported = !!(
//       window.AudioContext ||
//       (window as unknown as { webkitAudioContext: typeof AudioContext })
//         .webkitAudioContext
//     );
//     if (!webAudioSupported) {
//       errors.push("Web Audio API がサポートされていません");
//     }

//     // VRMモデル読み込み状態
//     const vrmModelLoaded = blendShapeStatus.hasVRM;
//     if (!vrmModelLoaded) {
//       warnings.push("VRMモデルが読み込まれていません");
//     }

//     // ブレンドシェイプ利用可能数
//     const blendShapesAvailable =
//       blendShapeStatus.availableBlendShapes?.length || 0;
//     if (blendShapesAvailable === 0) {
//       warnings.push("利用可能なブレンドシェイプがありません");
//     }

//     setSystemStatus({
//       webAudioSupported,
//       microphoneAccess: false, // 簡略化
//       vrmModelLoaded,
//       blendShapesAvailable,
//       errors,
//       warnings,
//     });
//   }, [blendShapeStatus]);

//   /**
//    * パフォーマンス指標を更新
//    */
//   const updatePerformanceMetrics = useCallback(() => {
//     // FPS計算（簡易版）
//     const now = performance.now();
//     const fps = Math.round(
//       1000 / (now - (updatePerformanceMetrics as any).lastTime || 16)
//     );
//     (updatePerformanceMetrics as any).lastTime = now;

//     // メモリ使用量（利用可能な場合）
//     const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;

//     setPerformanceMetrics((prev) => ({
//       ...prev,
//       fps: Math.min(fps, 60),
//       frameTime: now - ((updatePerformanceMetrics as any).lastTime || now),
//       memoryUsage: Math.round(memoryUsage / 1024 / 1024), // MB
//       audioLatency: audioAnalysisStatus.isAnalyzing ? 50 : 0, // 仮の値
//       lipSyncLatency: basicLipSyncStatus.isActive ? 100 : 0, // 仮の値
//     }));
//   }, [audioAnalysisStatus, basicLipSyncStatus]);

//   /**
//    * 定期更新
//    */
//   useEffect(() => {
//     const interval = setInterval(updateAllStatus, 1000); // 1秒間隔
//     return () => clearInterval(interval);
//   }, [updateAllStatus]);

//   /**
//    * 統合テスト実行
//    */
//   const runIntegratedTest = async () => {
//     try {
//       console.log("統合テスト開始...");

//       // ブレンドシェイプテスト
//       await blendShapeService.testBlendShapes();

//       console.log("統合テスト完了");
//     } catch (error) {
//       console.error("統合テストエラー:", error);
//     }
//   };

//   /**
//    * システムリセット
//    */
//   const resetSystem = () => {
//     // 全サービスを停止
//     lipSyncService.stopLipSync();
//     advancedLipSyncService.stopAdvancedLipSync();
//     integratedLipSyncService.stopLipSync();

//     // ブレンドシェイプをリセット
//     blendShapeService.resetAllBlendShapes();

//     console.log("システムリセット完了");
//   };

//   if (!isVisible) {
//     return (
//       <div className={`fixed top-4 right-4 z-50 ${className}`}>
//         <Button
//           variant="outline"
//           size="sm"
//           onClick={() => setIsVisible(true)}
//           className="bg-background/80 backdrop-blur-sm"
//         >
//           <Bug className="w-4 h-4 mr-2" />
//           デバッグ
//         </Button>
//       </div>
//     );
//   }

//   return (
//     <div className={`fixed top-4 right-4 z-50 w-96 max-h-[80vh] ${className}`}>
//       <Card className="bg-background/95 backdrop-blur-sm">
//         <CardHeader className="pb-3">
//           <div className="flex items-center justify-between">
//             <CardTitle className="text-sm font-medium flex items-center gap-2">
//               <Bug className="w-4 h-4" />
//               リップシンクデバッグ
//             </CardTitle>
//             <div className="flex gap-1">
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={runIntegratedTest}
//                 title="統合テスト実行"
//               >
//                 <Activity className="w-4 h-4" />
//               </Button>
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={resetSystem}
//                 title="システムリセット"
//               >
//                 <RefreshCw className="w-4 h-4" />
//               </Button>
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={() => setIsVisible(false)}
//               >
//                 <Settings className="w-4 h-4" />
//               </Button>
//             </div>
//           </div>
//         </CardHeader>

//         <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
//           <Tabs value={activeTab} onValueChange={setActiveTab}>
//             <TabsList className="grid w-full grid-cols-2">
//               <TabsTrigger value="overview" className="text-xs">
//                 概要
//               </TabsTrigger>
//               <TabsTrigger value="services" className="text-xs">
//                 サービス
//               </TabsTrigger>
//             </TabsList>

//             {/* 概要タブ */}
//             <TabsContent value="overview" className="space-y-3">
//               {/* システム状態 */}
//               <div className="space-y-2">
//                 <div className="text-sm font-medium">システム状態</div>
//                 <div className="grid grid-cols-2 gap-2 text-xs">
//                   <div className="flex items-center gap-2">
//                     {systemStatus.webAudioSupported ? (
//                       <CheckCircle className="w-3 h-3 text-green-500" />
//                     ) : (
//                       <XCircle className="w-3 h-3 text-red-500" />
//                     )}
//                     <span>Web Audio</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     {systemStatus.vrmModelLoaded ? (
//                       <CheckCircle className="w-3 h-3 text-green-500" />
//                     ) : (
//                       <XCircle className="w-3 h-3 text-yellow-500" />
//                     )}
//                     <span>VRMモデル</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     {systemStatus.blendShapesAvailable > 0 ? (
//                       <CheckCircle className="w-3 h-3 text-green-500" />
//                     ) : (
//                       <XCircle className="w-3 h-3 text-yellow-500" />
//                     )}
//                     <span>
//                       ブレンドシェイプ ({systemStatus.blendShapesAvailable})
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               <Separator />

//               {/* アクティブサービス */}
//               <div className="space-y-2">
//                 <div className="text-sm font-medium">アクティブサービス</div>
//                 <div className="space-y-1">
//                   <div className="flex items-center justify-between text-xs">
//                     <span>基本リップシンク</span>
//                     <Badge
//                       variant={
//                         basicLipSyncStatus.isActive ? "default" : "secondary"
//                       }
//                     >
//                       {basicLipSyncStatus.isActive ? "ON" : "OFF"}
//                     </Badge>
//                   </div>
//                   <div className="flex items-center justify-between text-xs">
//                     <span>高精度リップシンク</span>
//                     <Badge
//                       variant={
//                         advancedLipSyncStatus.isActive ? "default" : "secondary"
//                       }
//                     >
//                       {advancedLipSyncStatus.isActive ? "ON" : "OFF"}
//                     </Badge>
//                   </div>
//                   <div className="flex items-center justify-between text-xs">
//                     <span>統合リップシンク</span>
//                     <Badge
//                       variant={
//                         integratedLipSyncStatus.isActive
//                           ? "default"
//                           : "secondary"
//                       }
//                     >
//                       {integratedLipSyncStatus.isActive ? "ON" : "OFF"}
//                     </Badge>
//                   </div>
//                 </div>
//               </div>

//               <Separator />

//               {/* エラー・警告 */}
//               {(systemStatus.errors.length > 0 ||
//                 systemStatus.warnings.length > 0) && (
//                 <div className="space-y-2">
//                   <div className="text-sm font-medium">通知</div>
//                   <div className="space-y-1">
//                     {systemStatus.errors.map((error, index) => (
//                       <div
//                         key={index}
//                         className="flex items-center gap-2 text-xs text-red-600"
//                       >
//                         <AlertTriangle className="w-3 h-3" />
//                         <span>{error}</span>
//                       </div>
//                     ))}
//                     {systemStatus.warnings.map((warning, index) => (
//                       <div
//                         key={index}
//                         className="flex items-center gap-2 text-xs text-yellow-600"
//                       >
//                         <AlertTriangle className="w-3 h-3" />
//                         <span>{warning}</span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </TabsContent>

//             {/* サービス詳細タブ */}
//             <TabsContent value="services" className="space-y-3">
//               {/* 基本リップシンク */}
//               <div className="space-y-2">
//                 <div className="text-sm font-medium">基本リップシンク</div>
//                 <div className="text-xs space-y-1">
//                   <div className="flex justify-between">
//                     <span>状態:</span>
//                     <span>
//                       {basicLipSyncStatus.isActive ? "アクティブ" : "停止中"}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>現在の音素:</span>
//                     <span className="font-mono">
//                       {basicLipSyncStatus.currentPhoneme}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>口の開き:</span>
//                     <span>
//                       {(basicLipSyncStatus.mouthOpeningLevel * 100).toFixed(1)}%
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>感度:</span>
//                     <span>{basicLipSyncStatus.sensitivity.toFixed(2)}</span>
//                   </div>
//                 </div>
//               </div>

//               <Separator />

//               {/* 高精度リップシンク */}
//               <div className="space-y-2">
//                 <div className="text-sm font-medium">高精度リップシンク</div>
//                 <div className="text-xs space-y-1">
//                   <div className="flex justify-between">
//                     <span>状態:</span>
//                     <span>
//                       {advancedLipSyncStatus.isActive ? "アクティブ" : "停止中"}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>現在の音素:</span>
//                     <span className="font-mono">
//                       {advancedLipSyncStatus.currentPhoneme}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>信頼度:</span>
//                     <span>
//                       {(advancedLipSyncStatus.confidence * 100).toFixed(1)}%
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>フォルマント F1:</span>
//                     <span>
//                       {advancedLipSyncStatus.formants.f1.toFixed(0)}Hz
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               <Separator />

//               {/* 統合リップシンク */}
//               <div className="space-y-2">
//                 <div className="text-sm font-medium">統合リップシンク</div>
//                 <div className="text-xs space-y-1">
//                   <div className="flex justify-between">
//                     <span>状態:</span>
//                     <span>
//                       {integratedLipSyncStatus.isActive
//                         ? "アクティブ"
//                         : "停止中"}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>モード:</span>
//                     <span>{integratedLipSyncStatus.currentMode}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>感情:</span>
//                     <span>{integratedLipSyncStatus.currentEmotion}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>TTS連動:</span>
//                     <span>
//                       {integratedLipSyncStatus.isTTSSpeaking ? "ON" : "OFF"}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </TabsContent>
//           </Tabs>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
