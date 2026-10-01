import * as fs from 'node:fs';
import * as path from 'node:path';
import type { GeneratedClip, VideoMetadata } from '@shorts/shared';

export interface StoredProject {
  id: string;
  title: string;
  status: 'DRAFT' | 'PROCESSING' | 'READY' | 'FAILED';
  sourceFilename: string;
  storageKey: string;
  sourceMetadata?: VideoMetadata;
  selectedDurationSeconds: number;
  remainderStrategy: 'ignore' | 'shorter-final' | 'redistribute' | 'controlled-overlap';
  targetAspectRatio: string;
  qualityTier: '1080p' | '2k' | '4k';
  enable60Fps: boolean;
  subtitleThemeId: string;
  editingIntensity: string;
  reframeStrategy: string;
  enableCaptions: boolean;
  clips: GeneratedClip[];
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}

class ProjectStore {
  private dataDir: string;
  private dbFile: string;
  private projects: Map<string, StoredProject> = new Map();

  constructor() {
    this.dataDir = path.resolve(process.cwd(), '../../data');
    this.dbFile = path.join(this.dataDir, 'projects.json');
    this.load();
  }

  private load() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (fs.existsSync(this.dbFile)) {
        const raw = fs.readFileSync(this.dbFile, 'utf-8');
        const list: StoredProject[] = JSON.parse(raw);
        for (const p of list) {
          this.projects.set(p.id, p);
        }
      }
    } catch (e) {
      console.error('Failed to load project database:', e);
    }
  }

  private save() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      const list = Array.from(this.projects.values());
      fs.writeFileSync(this.dbFile, JSON.stringify(list, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save project database:', e);
    }
  }

  getAll(): StoredProject[] {
    return Array.from(this.projects.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  get(id: string): StoredProject | undefined {
    return this.projects.get(id);
  }

  set(project: StoredProject) {
    project.updatedAt = new Date().toISOString();
    this.projects.set(project.id, project);
    this.save();
  }

  delete(id: string): boolean {
    const deleted = this.projects.delete(id);
    if (deleted) this.save();
    return deleted;
  }
}

const globalForStore = globalThis as unknown as { projectStore?: ProjectStore };
export const projectStore = globalForStore.projectStore ?? new ProjectStore();
if (process.env.NODE_ENV !== 'production') globalForStore.projectStore = projectStore;
