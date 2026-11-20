/**
 * Client-Side IndexedDB Persistence Store for PulseCut AI.
 * Runs 100% in the user's browser.
 * Persists project metadata, generated clip boundaries, subtitle edits,
 * custom filenames, and export histories across sessions with zero server database.
 */

export interface StoredClip {
  id: string;
  index: number;
  startTime: number;
  endTime: number;
  duration: number;
  filename: string;
  topic: string;
  hookText: string;
  score: number;
  scoreBreakdown?: {
    hook: number;
    story: number;
    audio: number;
    visual: number;
    context: number;
  };
  customPanOffset?: number;
  subtitleThemeId?: string;
  aspectRatio?: string;
  exportedAt?: string;
}

export interface ClientProject {
  id: string;
  title: string;
  sourceFilename: string;
  sourceDuration: number;
  sourceWidth: number;
  sourceHeight: number;
  sourceFps: number;
  fileSizeBytes?: number;
  createdAt: string;
  updatedAt: string;
  selectedPlatform: string;
  targetAspectRatio: string;
  reframeStrategy: string;
  selectedDuration: number;
  clippingMode: 'ai-clipping' | 'gaming-clipping' | 'find-moments';
  clips: StoredClip[];
  subtitlesCount?: number;
}

const DB_NAME = 'PulseCutAI_Studio';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_SETTINGS = 'settings';

class IndexedDBStore {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.reject(new Error('IndexedDB not supported in this environment.'));
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
          const store = db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  async getAllProjects(): Promise<ClientProject[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PROJECTS, 'readonly');
        const store = tx.objectStore(STORE_PROJECTS);
        const index = store.index('updatedAt');
        const req = index.openCursor(null, 'prev'); // Most recent first
        const projects: ClientProject[] = [];

        req.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            projects.push(cursor.value);
            cursor.continue();
          } else {
            resolve(projects);
          }
        };

        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  async getProject(id: string): Promise<ClientProject | undefined> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PROJECTS, 'readonly');
        const store = tx.objectStore(STORE_PROJECTS);
        const req = store.get(id);

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return undefined;
    }
  }

  async saveProject(project: ClientProject): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PROJECTS, 'readwrite');
        const store = tx.objectStore(STORE_PROJECTS);
        project.updatedAt = new Date().toISOString();
        const req = store.put(project);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Failed to save project to IndexedDB:', e);
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PROJECTS, 'readwrite');
        const store = tx.objectStore(STORE_PROJECTS);
        const req = store.delete(id);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Failed to delete project from IndexedDB:', e);
    }
  }
}

export const clientProjectStore = new IndexedDBStore();
