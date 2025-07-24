/**
 * パフォーマンス監視サービス
 * AnimationControllerからパフォーマンス関連機能を分離
 */

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  animationCount: number;
  blendShapeUpdates: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    animationCount: 0,
    blendShapeUpdates: 0,
  };

  private frameCount = 0;
  private lastTime = performance.now();
  private frameTimes: number[] = [];
  private isMonitoring = false;

  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitorLoop();
  }

  public stopMonitoring(): void {
    this.isMonitoring = false;
  }

  private monitorLoop(): void {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;

    this.frameTimes.push(deltaTime);
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }

    this.frameCount++;
    this.lastTime = currentTime;

    this.updateMetrics();

    requestAnimationFrame(() => this.monitorLoop());
  }

  private updateMetrics(): void {
    if (this.frameTimes.length > 0) {
      const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
      this.metrics.frameTime = avgFrameTime;
      this.metrics.fps = 1000 / avgFrameTime;
    }

    if (typeof window !== "undefined" && (window as unknown as { performance?: { memory?: { usedJSHeapSize: number } } }).performance?.memory) {
      const memory = (window as unknown as { performance: { memory: { usedJSHeapSize: number } } }).performance.memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024;
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public incrementAnimationCount(): void {
    this.metrics.animationCount++;
  }

  public incrementBlendShapeUpdates(): void {
    this.metrics.blendShapeUpdates++;
  }

  public resetCounters(): void {
    this.metrics.animationCount = 0;
    this.metrics.blendShapeUpdates = 0;
  }

  public logMetrics(): void {
    console.log("Performance Metrics:", this.metrics);
  }
}
