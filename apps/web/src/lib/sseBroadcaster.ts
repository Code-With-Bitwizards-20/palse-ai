import { EventEmitter } from 'node:events';
import type { JobProgressEvent } from '@shorts/shared';

class SSEManager extends EventEmitter {
  private latestEvents: Map<string, JobProgressEvent> = new Map();

  broadcast(projectId: string, event: JobProgressEvent) {
    this.latestEvents.set(projectId, event);
    this.emit(`project:${projectId}`, event);
  }

  getLatestEvent(projectId: string): JobProgressEvent | undefined {
    return this.latestEvents.get(projectId);
  }
}

// Global singleton for Next.js hot reload safety
const globalForSSE = globalThis as unknown as { sseManager?: SSEManager };
export const sseManager = globalForSSE.sseManager ?? new SSEManager();
if (process.env.NODE_ENV !== 'production') globalForSSE.sseManager = sseManager;
