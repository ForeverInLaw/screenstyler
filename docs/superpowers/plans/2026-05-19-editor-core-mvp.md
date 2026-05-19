# Editor Core MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working client-side screenshot beautifier: upload an image, style it (gradient/solid background, padding, corner radius, shadow), export a PNG, and persist projects locally.

**Architecture:** Next.js 16 App Router SPA-style editor. A JSON document (`ScreenstylerDoc`) is the single source of truth, held in a Zustand store with `zundo` undo/redo. The canvas is a DOM/CSS React component tree; export captures that DOM node with `snapdom`. Persistence goes through `ProjectStore`/`BlobStore` interfaces — v1 implementations use `localStorage` + `IndexedDB` so Sub-project 2 (cloud) can swap them in without touching the editor.

**Tech Stack:** Next.js 16, React 19, TypeScript, Zustand + zundo, TanStack Query, zod, `@zumer/snapdom`, `idb`, Vitest + React Testing Library + fake-indexeddb, Playwright.

**Spec:** `docs/superpowers/specs/2026-05-19-editor-core-design.md`. This plan covers Sub-project 1 only. 3D tilt, frames/mockups, annotations, and style presets are deferred to Plan 2.

---

## Phase 0 — Scaffold

### Task 1: Project scaffold and test tooling

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts` (via tooling)
- Create: `app/layout.tsx`, `app/page.tsx` (from create-next-app)

- [ ] **Step 1: Scaffold Next.js**

Run in the repo root (it already contains `.git`, `.gitignore`, `docs/`, `.continuum/` — none conflict with create-next-app):

```bash
npx create-next-app@latest . --typescript --app --eslint --tailwind --no-src-dir --import-alias "@/*" --use-npm
```

If create-next-app refuses the non-empty directory, scaffold into `tmp-app/` and move its files up, then delete `tmp-app/`.

- [ ] **Step 2: Install runtime + dev dependencies**

```bash
npm install zustand zundo @tanstack/react-query zod @zumer/snapdom idb
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event fake-indexeddb @playwright/test
npx playwright install chromium
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: ['lib/**/*.test.{ts,tsx}', 'components/**/*.test.{ts,tsx}'],
  },
  resolve: { alias: { '@': resolve(__dirname, '.') } },
});
```

- [ ] **Step 4: Create `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
```

- [ ] **Step 5: Add test scripts to `package.json`**

In the `"scripts"` block add:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test"
```

- [ ] **Step 6: Verify the toolchain**

Run: `npm run test`
Expected: PASS — "No test files found" is acceptable here; the command must exit 0.
Run: `npm run build`
Expected: Next build succeeds.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Vitest and Playwright"
```

---

## Phase 1 — Document model

### Task 2: Document schema and types

**Files:**
- Create: `lib/document/schema.ts`
- Test: `lib/document/schema.test.ts`

zod schemas are the single source of truth; TypeScript types are inferred from them (DRY).

- [ ] **Step 1: Write the failing test**

```ts
// lib/document/schema.test.ts
import { describe, it, expect } from 'vitest';
import { screenstylerDocSchema } from './schema';

const validDoc = {
  version: 1,
  canvas: {
    preset: 'free',
    width: 1600,
    height: 1000,
    background: { type: 'gradient', angle: 135, stops: [
      { color: '#6366f1', offset: 0 }, { color: '#ec4899', offset: 1 },
    ] },
  },
  content: {
    image: null,
    padding: 64,
    cornerRadius: 12,
    shadow: { x: 0, y: 30, blur: 60, spread: 0, color: '#000000', opacity: 0.35 },
    frame: { type: 'none' },
    transform3d: { rotateX: 0, rotateY: 0, rotateZ: 0, perspective: 1500, scale: 1 },
  },
  annotations: [],
};

describe('screenstylerDocSchema', () => {
  it('parses a valid document', () => {
    expect(screenstylerDocSchema.parse(validDoc)).toEqual(validDoc);
  });

  it('rejects a document with the wrong version', () => {
    expect(() => screenstylerDocSchema.parse({ ...validDoc, version: 2 })).toThrow();
  });

  it('rejects a gradient background with fewer than two stops', () => {
    const bad = { ...validDoc, canvas: { ...validDoc.canvas,
      background: { type: 'gradient', angle: 0, stops: [{ color: '#000', offset: 0 }] } } };
    expect(() => screenstylerDocSchema.parse(bad)).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/document/schema.test.ts`
Expected: FAIL — cannot resolve `./schema`.

- [ ] **Step 3: Write the schema**

```ts
// lib/document/schema.ts
import { z } from 'zod';

export const pointSchema = z.object({ x: z.number(), y: z.number() });
export const rectSchema = z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() });
export const gradientStopSchema = z.object({ color: z.string(), offset: z.number().min(0).max(1) });

export const imageRefSchema = z.object({
  id: z.string(),
  blobKey: z.string(),
  naturalWidth: z.number().positive(),
  naturalHeight: z.number().positive(),
});

export const backgroundSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('solid'), color: z.string() }),
  z.object({ type: z.literal('gradient'), angle: z.number(),
    stops: z.array(gradientStopSchema).min(2) }),
  z.object({ type: z.literal('image'), ref: imageRefSchema, fit: z.enum(['cover', 'contain']) }),
]);

export const shadowSchema = z.object({
  x: z.number(), y: z.number(), blur: z.number().min(0), spread: z.number(),
  color: z.string(), opacity: z.number().min(0).max(1),
});

export const frameSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('none') }),
  z.object({ type: z.literal('window'), variant: z.enum(['macos', 'macos-dark']) }),
  z.object({ type: z.literal('browser'), variant: z.enum(['safari', 'chrome', 'arc']),
    url: z.string().optional(), theme: z.enum(['light', 'dark']) }),
  z.object({ type: z.literal('device'), variant: z.enum(['iphone', 'macbook', 'ipad']) }),
]);

export const transform3dSchema = z.object({
  rotateX: z.number(), rotateY: z.number(), rotateZ: z.number(),
  perspective: z.number().positive(), scale: z.number().positive(),
});

export const annotationSchema = z.discriminatedUnion('type', [
  z.object({ id: z.string(), type: z.literal('arrow'), from: pointSchema, to: pointSchema,
    color: z.string(), thickness: z.number() }),
  z.object({ id: z.string(), type: z.literal('text'), pos: pointSchema, text: z.string(),
    fontSize: z.number(), color: z.string() }),
  z.object({ id: z.string(), type: z.literal('highlight'), rect: rectSchema, color: z.string() }),
  z.object({ id: z.string(), type: z.literal('blur'), rect: rectSchema, intensity: z.number() }),
]);

export const screenstylerDocSchema = z.object({
  version: z.literal(1),
  canvas: z.object({
    preset: z.string(),
    width: z.number().positive(),
    height: z.number().positive(),
    background: backgroundSchema,
  }),
  content: z.object({
    image: imageRefSchema.nullable(),
    padding: z.number().min(0),
    cornerRadius: z.number().min(0),
    shadow: shadowSchema,
    frame: frameSchema,
    transform3d: transform3dSchema,
  }),
  annotations: z.array(annotationSchema),
});

export type ScreenstylerDoc = z.infer<typeof screenstylerDocSchema>;
export type Background = z.infer<typeof backgroundSchema>;
export type Shadow = z.infer<typeof shadowSchema>;
export type Frame = z.infer<typeof frameSchema>;
export type Transform3D = z.infer<typeof transform3dSchema>;
export type Annotation = z.infer<typeof annotationSchema>;
export type ImageRef = z.infer<typeof imageRefSchema>;
export type GradientStop = z.infer<typeof gradientStopSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/document/schema.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/document/schema.ts lib/document/schema.test.ts
git commit -m "feat: add ScreenstylerDoc zod schema and inferred types"
```

---

### Task 3: Document factory

**Files:**
- Create: `lib/document/factory.ts`
- Test: `lib/document/factory.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/document/factory.test.ts
import { describe, it, expect } from 'vitest';
import { createBlankDoc } from './factory';
import { screenstylerDocSchema } from './schema';

describe('createBlankDoc', () => {
  it('produces a schema-valid document', () => {
    expect(() => screenstylerDocSchema.parse(createBlankDoc())).not.toThrow();
  });

  it('starts with no image and an empty annotation list', () => {
    const doc = createBlankDoc();
    expect(doc.content.image).toBeNull();
    expect(doc.annotations).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/document/factory.test.ts`
Expected: FAIL — cannot resolve `./factory`.

- [ ] **Step 3: Write the factory**

```ts
// lib/document/factory.ts
import type { ScreenstylerDoc } from './schema';

export function createBlankDoc(): ScreenstylerDoc {
  return {
    version: 1,
    canvas: {
      preset: 'free',
      width: 1600,
      height: 1000,
      background: { type: 'gradient', angle: 135, stops: [
        { color: '#6366f1', offset: 0 },
        { color: '#ec4899', offset: 1 },
      ] },
    },
    content: {
      image: null,
      padding: 64,
      cornerRadius: 12,
      shadow: { x: 0, y: 30, blur: 60, spread: 0, color: '#000000', opacity: 0.35 },
      frame: { type: 'none' },
      transform3d: { rotateX: 0, rotateY: 0, rotateZ: 0, perspective: 1500, scale: 1 },
    },
    annotations: [],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/document/factory.test.ts`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/document/factory.ts lib/document/factory.test.ts
git commit -m "feat: add blank document factory"
```

---

### Task 4: Document store with undo/redo

**Files:**
- Create: `lib/document/store.ts`
- Test: `lib/document/store.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/document/store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentStore } from './store';
import { createBlankDoc } from './factory';

beforeEach(() => {
  useDocumentStore.getState().loadDoc(createBlankDoc());
  useDocumentStore.temporal.getState().clear();
});

describe('useDocumentStore', () => {
  it('updates padding', () => {
    useDocumentStore.getState().setPadding(120);
    expect(useDocumentStore.getState().doc.content.padding).toBe(120);
  });

  it('updates the background', () => {
    useDocumentStore.getState().setBackground({ type: 'solid', color: '#000000' });
    expect(useDocumentStore.getState().doc.canvas.background).toEqual({
      type: 'solid', color: '#000000',
    });
  });

  it('undoes and redoes a mutation', () => {
    useDocumentStore.getState().setPadding(200);
    useDocumentStore.temporal.getState().undo();
    expect(useDocumentStore.getState().doc.content.padding).toBe(64);
    useDocumentStore.temporal.getState().redo();
    expect(useDocumentStore.getState().doc.content.padding).toBe(200);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/document/store.test.ts`
Expected: FAIL — cannot resolve `./store`.

- [ ] **Step 3: Write the store**

```ts
// lib/document/store.ts
import { create } from 'zustand';
import { temporal } from 'zundo';
import type { Background, ImageRef, ScreenstylerDoc, Shadow } from './schema';
import { createBlankDoc } from './factory';

interface DocumentState {
  doc: ScreenstylerDoc;
  setBackground: (background: Background) => void;
  setPadding: (padding: number) => void;
  setCornerRadius: (cornerRadius: number) => void;
  setShadow: (shadow: Shadow) => void;
  setImage: (image: ImageRef) => void;
  setCanvasSize: (preset: string, width: number, height: number) => void;
  loadDoc: (doc: ScreenstylerDoc) => void;
}

export const useDocumentStore = create<DocumentState>()(
  temporal(
    (set) => ({
      doc: createBlankDoc(),
      setBackground: (background) =>
        set((s) => ({ doc: { ...s.doc, canvas: { ...s.doc.canvas, background } } })),
      setPadding: (padding) =>
        set((s) => ({ doc: { ...s.doc, content: { ...s.doc.content, padding } } })),
      setCornerRadius: (cornerRadius) =>
        set((s) => ({ doc: { ...s.doc, content: { ...s.doc.content, cornerRadius } } })),
      setShadow: (shadow) =>
        set((s) => ({ doc: { ...s.doc, content: { ...s.doc.content, shadow } } })),
      setImage: (image) =>
        set((s) => ({ doc: { ...s.doc, content: { ...s.doc.content, image } } })),
      setCanvasSize: (preset, width, height) =>
        set((s) => ({ doc: { ...s.doc, canvas: { ...s.doc.canvas, preset, width, height } } })),
      loadDoc: (doc) => set({ doc }),
    }),
    { limit: 100, partialize: (s) => ({ doc: s.doc }) },
  ),
);
```

Note: `loadDoc` is intentionally tracked like any mutation. Callers that load a fresh project must call `useDocumentStore.temporal.getState().clear()` afterward so undo cannot cross project boundaries (the editor page in Task 13 does this).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/document/store.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/document/store.ts lib/document/store.test.ts
git commit -m "feat: add document store with zundo undo/redo"
```

---

## Phase 2 — Storage

### Task 5: Storage interfaces and IndexedDB blob store

**Files:**
- Create: `lib/storage/types.ts`
- Create: `lib/storage/idb-blob-store.ts`
- Test: `lib/storage/idb-blob-store.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/storage/idb-blob-store.test.ts
import { describe, it, expect } from 'vitest';
import { IdbBlobStore } from './idb-blob-store';

describe('IdbBlobStore', () => {
  it('stores, reads, and removes a blob', async () => {
    const store = new IdbBlobStore();
    const blob = new Blob(['hello'], { type: 'text/plain' });
    await store.put('k1', blob);

    const got = await store.get('k1');
    expect(got).toBeInstanceOf(Blob);
    expect(await got!.text()).toBe('hello');

    await store.remove('k1');
    expect(await store.get('k1')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/storage/idb-blob-store.test.ts`
Expected: FAIL — cannot resolve `./idb-blob-store`.

- [ ] **Step 3: Write the interfaces**

```ts
// lib/storage/types.ts
import type { ScreenstylerDoc } from '../document/schema';

export type ProjectMeta = {
  id: string;
  name: string;
  thumbnailKey: string | null;
  createdAt: number;
  updatedAt: number;
};

export interface ProjectStore {
  list(): Promise<ProjectMeta[]>;
  load(id: string): Promise<ScreenstylerDoc>;
  create(name: string, doc: ScreenstylerDoc): Promise<string>;
  save(id: string, doc: ScreenstylerDoc, meta?: Partial<ProjectMeta>): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface BlobStore {
  put(key: string, blob: Blob): Promise<void>;
  get(key: string): Promise<Blob | undefined>;
  remove(key: string): Promise<void>;
}
```

- [ ] **Step 4: Write the IndexedDB blob store**

```ts
// lib/storage/idb-blob-store.ts
import { openDB, type IDBPDatabase } from 'idb';
import type { BlobStore } from './types';

const DB_NAME = 'screenstyler';
const STORE = 'blobs';

let dbPromise: Promise<IDBPDatabase> | null = null;

function db(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE);
      },
    });
  }
  return dbPromise;
}

export class IdbBlobStore implements BlobStore {
  async put(key: string, blob: Blob): Promise<void> {
    await (await db()).put(STORE, blob, key);
  }
  async get(key: string): Promise<Blob | undefined> {
    return (await db()).get(STORE, key) as Promise<Blob | undefined>;
  }
  async remove(key: string): Promise<void> {
    await (await db()).delete(STORE, key);
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/storage/idb-blob-store.test.ts`
Expected: PASS — 1 test (fake-indexeddb is loaded by `vitest.setup.ts`).

- [ ] **Step 6: Commit**

```bash
git add lib/storage/types.ts lib/storage/idb-blob-store.ts lib/storage/idb-blob-store.test.ts
git commit -m "feat: add storage interfaces and IndexedDB blob store"
```

---

### Task 6: localStorage project store

**Files:**
- Create: `lib/storage/local-project-store.ts`
- Test: `lib/storage/local-project-store.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/storage/local-project-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { LocalProjectStore } from './local-project-store';
import { createBlankDoc } from '../document/factory';

beforeEach(() => localStorage.clear());

describe('LocalProjectStore', () => {
  it('creates, lists, loads, and removes a project', async () => {
    const store = new LocalProjectStore();
    const id = await store.create('My Shot', createBlankDoc());

    const list = await store.list();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id, name: 'My Shot' });

    const loaded = await store.load(id);
    expect(loaded.version).toBe(1);

    await store.remove(id);
    expect(await store.list()).toHaveLength(0);
  });

  it('throws when loading a missing project', async () => {
    const store = new LocalProjectStore();
    await expect(store.load('nope')).rejects.toThrow();
  });

  it('saves an updated document and bumps updatedAt', async () => {
    const store = new LocalProjectStore();
    const id = await store.create('A', createBlankDoc());
    const before = (await store.list())[0].updatedAt;
    await new Promise((r) => setTimeout(r, 2));
    const doc = createBlankDoc();
    doc.content.padding = 200;
    await store.save(id, doc);
    expect((await store.load(id)).content.padding).toBe(200);
    expect((await store.list())[0].updatedAt).toBeGreaterThan(before);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/storage/local-project-store.test.ts`
Expected: FAIL — cannot resolve `./local-project-store`.

- [ ] **Step 3: Write the project store**

```ts
// lib/storage/local-project-store.ts
import { screenstylerDocSchema, type ScreenstylerDoc } from '../document/schema';
import type { ProjectMeta, ProjectStore } from './types';

const INDEX_KEY = 'screenstyler:projects';
const docKey = (id: string) => `screenstyler:doc:${id}`;

export class LocalProjectStore implements ProjectStore {
  async list(): Promise<ProjectMeta[]> {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as ProjectMeta[]) : [];
  }

  async load(id: string): Promise<ScreenstylerDoc> {
    const raw = localStorage.getItem(docKey(id));
    if (!raw) throw new Error(`PROJECT_NOT_FOUND:${id}`);
    return screenstylerDocSchema.parse(JSON.parse(raw));
  }

  async create(name: string, doc: ScreenstylerDoc): Promise<string> {
    const id = crypto.randomUUID();
    const now = Date.now();
    this.writeDoc(id, doc);
    const meta: ProjectMeta = { id, name, thumbnailKey: null, createdAt: now, updatedAt: now };
    this.writeIndex([meta, ...(await this.list())]);
    return id;
  }

  async save(id: string, doc: ScreenstylerDoc, meta?: Partial<ProjectMeta>): Promise<void> {
    this.writeDoc(id, doc);
    const index = await this.list();
    this.writeIndex(
      index.map((m) => (m.id === id ? { ...m, ...meta, updatedAt: Date.now() } : m)),
    );
  }

  async remove(id: string): Promise<void> {
    localStorage.removeItem(docKey(id));
    this.writeIndex((await this.list()).filter((m) => m.id !== id));
  }

  private writeDoc(id: string, doc: ScreenstylerDoc): void {
    try {
      localStorage.setItem(docKey(id), JSON.stringify(doc));
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        throw new Error('STORAGE_FULL');
      }
      throw err;
    }
  }

  private writeIndex(index: ProjectMeta[]): void {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/storage/local-project-store.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/storage/local-project-store.ts lib/storage/local-project-store.test.ts
git commit -m "feat: add localStorage-backed project store"
```

---

## Phase 3 — Presets and pure style helpers

### Task 7: Canvas size and gradient presets

**Files:**
- Create: `lib/presets/canvas.ts`
- Create: `lib/presets/gradients.ts`
- Test: `lib/presets/presets.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/presets/presets.test.ts
import { describe, it, expect } from 'vitest';
import { canvasPresets, getCanvasPreset } from './canvas';
import { gradientPresets } from './gradients';
import { backgroundSchema } from '../document/schema';

describe('presets', () => {
  it('every canvas preset has positive dimensions', () => {
    for (const p of canvasPresets) {
      expect(p.width).toBeGreaterThan(0);
      expect(p.height).toBeGreaterThan(0);
    }
  });

  it('getCanvasPreset finds by id and returns undefined for unknown', () => {
    expect(getCanvasPreset('og')?.id).toBe('og');
    expect(getCanvasPreset('missing')).toBeUndefined();
  });

  it('every gradient preset background is schema-valid', () => {
    for (const g of gradientPresets) {
      expect(() => backgroundSchema.parse(g.background)).not.toThrow();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/presets/presets.test.ts`
Expected: FAIL — cannot resolve `./canvas`.

- [ ] **Step 3: Write the canvas presets**

```ts
// lib/presets/canvas.ts
export type CanvasPreset = { id: string; label: string; width: number; height: number };

export const canvasPresets: CanvasPreset[] = [
  { id: 'free', label: 'Free', width: 1600, height: 1000 },
  { id: 'twitter', label: 'Twitter / X', width: 1600, height: 900 },
  { id: 'instagram-post', label: 'Instagram Post', width: 1080, height: 1080 },
  { id: 'og', label: 'OG Image', width: 1200, height: 630 },
  { id: '4k', label: '4K', width: 3840, height: 2160 },
];

export function getCanvasPreset(id: string): CanvasPreset | undefined {
  return canvasPresets.find((p) => p.id === id);
}
```

- [ ] **Step 4: Write the gradient presets**

```ts
// lib/presets/gradients.ts
import type { Background } from '../document/schema';

export type GradientPreset = { id: string; label: string; background: Background };

export const gradientPresets: GradientPreset[] = [
  { id: 'indigo', label: 'Indigo', background: { type: 'gradient', angle: 135,
    stops: [{ color: '#6366f1', offset: 0 }, { color: '#ec4899', offset: 1 }] } },
  { id: 'sunset', label: 'Sunset', background: { type: 'gradient', angle: 135,
    stops: [{ color: '#ff7e5f', offset: 0 }, { color: '#feb47b', offset: 1 }] } },
  { id: 'ocean', label: 'Ocean', background: { type: 'gradient', angle: 135,
    stops: [{ color: '#2193b0', offset: 0 }, { color: '#6dd5ed', offset: 1 }] } },
  { id: 'mint', label: 'Mint', background: { type: 'gradient', angle: 135,
    stops: [{ color: '#11998e', offset: 0 }, { color: '#38ef7d', offset: 1 }] } },
  { id: 'slate', label: 'Slate', background: { type: 'solid', color: '#1e293b' } },
  { id: 'paper', label: 'Paper', background: { type: 'solid', color: '#f1f5f9' } },
];
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/presets/presets.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 6: Commit**

```bash
git add lib/presets lib/presets/presets.test.ts
git commit -m "feat: add canvas size and gradient presets"
```

---

### Task 8: Pure CSS style helpers

**Files:**
- Create: `lib/style/css.ts`
- Test: `lib/style/css.test.ts`

These pure functions turn document values into CSS strings, isolated from React so they are trivially testable.

- [ ] **Step 1: Write the failing test**

```ts
// lib/style/css.test.ts
import { describe, it, expect } from 'vitest';
import { backgroundToCss, shadowToCss, withAlpha } from './css';

describe('css helpers', () => {
  it('withAlpha converts hex to rgba', () => {
    expect(withAlpha('#000000', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
    expect(withAlpha('#ffffff', 1)).toBe('rgba(255, 255, 255, 1)');
  });

  it('backgroundToCss renders a solid color', () => {
    expect(backgroundToCss({ type: 'solid', color: '#abc123' })).toBe('#abc123');
  });

  it('backgroundToCss renders a linear gradient', () => {
    const css = backgroundToCss({ type: 'gradient', angle: 90,
      stops: [{ color: '#000', offset: 0 }, { color: '#fff', offset: 1 }] });
    expect(css).toBe('linear-gradient(90deg, #000 0%, #fff 100%)');
  });

  it('shadowToCss renders a box-shadow string', () => {
    expect(shadowToCss({ x: 0, y: 10, blur: 20, spread: 0,
      color: '#000000', opacity: 0.4 })).toBe('0px 10px 20px 0px rgba(0, 0, 0, 0.4)');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/style/css.test.ts`
Expected: FAIL — cannot resolve `./css`.

- [ ] **Step 3: Write the helpers**

```ts
// lib/style/css.ts
import type { Background, Shadow } from '../document/schema';

export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function backgroundToCss(bg: Background, imageUrl?: string): string {
  switch (bg.type) {
    case 'solid':
      return bg.color;
    case 'gradient': {
      const stops = bg.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(', ');
      return `linear-gradient(${bg.angle}deg, ${stops})`;
    }
    case 'image':
      return imageUrl ? `url(${imageUrl})` : '#000000';
  }
}

export function shadowToCss(s: Shadow): string {
  return `${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${withAlpha(s.color, s.opacity)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/style/css.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/style/css.ts lib/style/css.test.ts
git commit -m "feat: add pure CSS style helpers"
```

---

## Phase 4 — Export

### Task 9: PNG export

**Files:**
- Create: `lib/export/export-png.ts`
- Test: `lib/export/export-png.test.ts`

- [ ] **Step 1: Write the failing test**

`snapdom` needs a real browser, so the unit test covers the pure `exportFilename` helper; the real capture path is covered by the Playwright E2E in Task 18.

```ts
// lib/export/export-png.test.ts
import { describe, it, expect } from 'vitest';
import { exportFilename } from './export-png';

describe('exportFilename', () => {
  it('slugifies the project name and appends scale', () => {
    expect(exportFilename('My Cool Shot', 2)).toBe('my-cool-shot@2x.png');
  });

  it('falls back to "screenstyler" for an empty name', () => {
    expect(exportFilename('  ', 1)).toBe('screenstyler@1x.png');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/export/export-png.test.ts`
Expected: FAIL — cannot resolve `./export-png`.

- [ ] **Step 3: Write the export module**

```ts
// lib/export/export-png.ts
import { snapdom } from '@zumer/snapdom';

export type ExportScale = 1 | 2 | 3;

export function exportFilename(projectName: string, scale: ExportScale): string {
  const slug = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'screenstyler'}@${scale}x.png`;
}

export async function exportPng(node: HTMLElement, scale: ExportScale = 2): Promise<Blob> {
  if (document.fonts?.ready) await document.fonts.ready;
  await Promise.all(
    Array.from(node.querySelectorAll('img')).map((img) => img.decode().catch(() => undefined)),
  );
  const blob = await snapdom.toBlob(node, { type: 'png', scale, embedFonts: true });
  if (!blob || blob.size === 0) throw new Error('EXPORT_EMPTY');
  return blob;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function copyBlobToClipboard(blob: Blob): Promise<void> {
  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/export/export-png.test.ts`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/export/export-png.ts lib/export/export-png.test.ts
git commit -m "feat: add PNG export via snapdom"
```

---

## Phase 5 — Canvas rendering

### Task 10: Object URL hook

**Files:**
- Create: `lib/storage/blob-store-instance.ts`
- Create: `components/canvas/use-object-url.ts`
- Test: `components/canvas/use-object-url.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/canvas/use-object-url.test.tsx
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useObjectUrl } from './use-object-url';
import { blobStore } from '@/lib/storage/blob-store-instance';

beforeAll(() => {
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:fake-url');
  globalThis.URL.revokeObjectURL = vi.fn();
});

describe('useObjectUrl', () => {
  it('returns null for a null key', () => {
    const { result } = renderHook(() => useObjectUrl(null));
    expect(result.current).toBeNull();
  });

  it('resolves a stored blob to an object URL', async () => {
    await blobStore.put('img-1', new Blob(['x'], { type: 'image/png' }));
    const { result } = renderHook(() => useObjectUrl('img-1'));
    await waitFor(() => expect(result.current).toBe('blob:fake-url'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/canvas/use-object-url.test.tsx`
Expected: FAIL — cannot resolve `./use-object-url`.

- [ ] **Step 3: Write the shared blob store instance**

```ts
// lib/storage/blob-store-instance.ts
import { IdbBlobStore } from './idb-blob-store';
import type { BlobStore } from './types';

export const blobStore: BlobStore = new IdbBlobStore();
```

- [ ] **Step 4: Write the hook**

```ts
// components/canvas/use-object-url.ts
'use client';
import { useEffect, useState } from 'react';
import { blobStore } from '@/lib/storage/blob-store-instance';

export function useObjectUrl(blobKey: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blobKey) {
      setUrl(null);
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;

    blobStore.get(blobKey).then((blob) => {
      if (cancelled || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [blobKey]);

  return url;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/canvas/use-object-url.test.tsx`
Expected: PASS — 2 tests.

- [ ] **Step 6: Commit**

```bash
git add lib/storage/blob-store-instance.ts components/canvas/use-object-url.ts components/canvas/use-object-url.test.tsx
git commit -m "feat: add useObjectUrl hook backed by the blob store"
```

---

### Task 11: Canvas stage, document frame, background layer

**Files:**
- Create: `components/canvas/CanvasStage.tsx`
- Create: `components/canvas/DocumentFrame.tsx`
- Create: `components/canvas/BackgroundLayer.tsx`
- Test: `components/canvas/canvas.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/canvas/canvas.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { DocumentFrame } from './DocumentFrame';
import { BackgroundLayer } from './BackgroundLayer';

describe('DocumentFrame', () => {
  it('renders at the given logical size and exposes its ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<DocumentFrame ref={ref} width={1200} height={630}>x</DocumentFrame>);
    const frame = screen.getByTestId('document-frame');
    expect(frame.style.width).toBe('1200px');
    expect(frame.style.height).toBe('630px');
    expect(ref.current).toBe(frame);
  });
});

describe('BackgroundLayer', () => {
  it('applies a gradient background', () => {
    render(<BackgroundLayer background={{ type: 'gradient', angle: 90,
      stops: [{ color: '#000', offset: 0 }, { color: '#fff', offset: 1 }] }} />);
    const layer = screen.getByTestId('background-layer');
    expect(layer.style.background).toContain('linear-gradient');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/canvas/canvas.test.tsx`
Expected: FAIL — cannot resolve `./DocumentFrame`.

- [ ] **Step 3: Write `DocumentFrame`**

```tsx
// components/canvas/DocumentFrame.tsx
'use client';
import { forwardRef, type ReactNode } from 'react';

type Props = { width: number; height: number; children: ReactNode };

export const DocumentFrame = forwardRef<HTMLDivElement, Props>(
  function DocumentFrame({ width, height, children }, ref) {
    return (
      <div
        ref={ref}
        data-testid="document-frame"
        style={{ width, height, position: 'relative', overflow: 'hidden' }}
      >
        {children}
      </div>
    );
  },
);
```

- [ ] **Step 4: Write `BackgroundLayer`**

```tsx
// components/canvas/BackgroundLayer.tsx
'use client';
import type { Background } from '@/lib/document/schema';
import { backgroundToCss } from '@/lib/style/css';
import { useObjectUrl } from './use-object-url';

export function BackgroundLayer({ background }: { background: Background }) {
  const imageUrl = useObjectUrl(background.type === 'image' ? background.ref.blobKey : null);
  return (
    <div
      data-testid="background-layer"
      style={{
        position: 'absolute',
        inset: 0,
        background: backgroundToCss(background, imageUrl ?? undefined),
        backgroundSize: background.type === 'image' ? background.fit : undefined,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}
```

- [ ] **Step 5: Write `CanvasStage`**

`CanvasStage` centers the document and scales it to fit its container using a `ResizeObserver`.

```tsx
// components/canvas/CanvasStage.tsx
'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';

type Props = { docWidth: number; docHeight: number; children: ReactNode };

export function CanvasStage({ docWidth, docHeight, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const pad = 48;
      const fit = Math.min(
        (el.clientWidth - pad) / docWidth,
        (el.clientHeight - pad) / docHeight,
        1,
      );
      setScale(fit > 0 ? fit : 1);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [docWidth, docHeight]);

  return (
    <div
      ref={containerRef}
      data-testid="canvas-stage"
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#0f1115',
      }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run components/canvas/canvas.test.tsx`
Expected: PASS — 2 tests.

- [ ] **Step 7: Commit**

```bash
git add components/canvas/CanvasStage.tsx components/canvas/DocumentFrame.tsx components/canvas/BackgroundLayer.tsx components/canvas/canvas.test.tsx
git commit -m "feat: add canvas stage, document frame, and background layer"
```

---

### Task 12: Content layer and screenshot

**Files:**
- Create: `components/canvas/Screenshot.tsx`
- Create: `components/canvas/ContentLayer.tsx`
- Create: `components/canvas/DocumentCanvas.tsx`
- Test: `components/canvas/content-layer.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/canvas/content-layer.test.tsx
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ContentLayer } from './ContentLayer';
import { blobStore } from '@/lib/storage/blob-store-instance';
import type { ScreenstylerDoc } from '@/lib/document/schema';

beforeAll(() => {
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:fake-url');
  globalThis.URL.revokeObjectURL = vi.fn();
});

const content: ScreenstylerDoc['content'] = {
  image: { id: 'i1', blobKey: 'shot-1', naturalWidth: 800, naturalHeight: 500 },
  padding: 80,
  cornerRadius: 16,
  shadow: { x: 0, y: 10, blur: 30, spread: 0, color: '#000000', opacity: 0.3 },
  frame: { type: 'none' },
  transform3d: { rotateX: 0, rotateY: 0, rotateZ: 0, perspective: 1500, scale: 1 },
};

describe('ContentLayer', () => {
  it('renders nothing when there is no image', () => {
    render(<ContentLayer content={{ ...content, image: null }} />);
    expect(screen.queryByTestId('screenshot')).toBeNull();
  });

  it('applies padding, corner radius, and shadow', async () => {
    await blobStore.put('shot-1', new Blob(['x'], { type: 'image/png' }));
    render(<ContentLayer content={content} />);
    const wrapper = screen.getByTestId('content-layer');
    expect(wrapper.style.padding).toBe('80px');
    const shot = await waitFor(() => screen.getByTestId('screenshot'));
    expect(shot.style.borderRadius).toBe('16px');
    expect(shot.style.boxShadow).toContain('rgba(0, 0, 0, 0.3)');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/canvas/content-layer.test.tsx`
Expected: FAIL — cannot resolve `./ContentLayer`.

- [ ] **Step 3: Write `Screenshot`**

```tsx
// components/canvas/Screenshot.tsx
'use client';
import type { ImageRef, Shadow } from '@/lib/document/schema';
import { shadowToCss } from '@/lib/style/css';
import { useObjectUrl } from './use-object-url';

type Props = { image: ImageRef; cornerRadius: number; shadow: Shadow };

export function Screenshot({ image, cornerRadius, shadow }: Props) {
  const url = useObjectUrl(image.blobKey);
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      data-testid="screenshot"
      src={url}
      alt=""
      style={{
        display: 'block',
        maxWidth: '100%',
        height: 'auto',
        borderRadius: `${cornerRadius}px`,
        boxShadow: shadowToCss(shadow),
      }}
    />
  );
}
```

- [ ] **Step 4: Write `ContentLayer`**

```tsx
// components/canvas/ContentLayer.tsx
'use client';
import type { ScreenstylerDoc } from '@/lib/document/schema';
import { Screenshot } from './Screenshot';

export function ContentLayer({ content }: { content: ScreenstylerDoc['content'] }) {
  return (
    <div
      data-testid="content-layer"
      style={{
        position: 'absolute',
        inset: 0,
        padding: `${content.padding}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}
    >
      {content.image && (
        <Screenshot
          image={content.image}
          cornerRadius={content.cornerRadius}
          shadow={content.shadow}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Write `DocumentCanvas` (composes the full document into a frame)**

```tsx
// components/canvas/DocumentCanvas.tsx
'use client';
import { forwardRef } from 'react';
import type { ScreenstylerDoc } from '@/lib/document/schema';
import { DocumentFrame } from './DocumentFrame';
import { BackgroundLayer } from './BackgroundLayer';
import { ContentLayer } from './ContentLayer';

export const DocumentCanvas = forwardRef<HTMLDivElement, { doc: ScreenstylerDoc }>(
  function DocumentCanvas({ doc }, ref) {
    return (
      <DocumentFrame ref={ref} width={doc.canvas.width} height={doc.canvas.height}>
        <BackgroundLayer background={doc.canvas.background} />
        <ContentLayer content={doc.content} />
      </DocumentFrame>
    );
  },
);
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run components/canvas/content-layer.test.tsx`
Expected: PASS — 2 tests.

- [ ] **Step 7: Commit**

```bash
git add components/canvas/Screenshot.tsx components/canvas/ContentLayer.tsx components/canvas/DocumentCanvas.tsx components/canvas/content-layer.test.tsx
git commit -m "feat: add content layer, screenshot, and document canvas"
```

---

## Phase 6 — Editor shell and upload

### Task 13: Editor shell, toolbar, and editor page

**Files:**
- Create: `lib/ui/store.ts`
- Create: `components/editor/EditorShell.tsx`
- Create: `components/editor/Toolbar.tsx`
- Create: `app/editor/page.tsx`
- Test: `components/editor/toolbar.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/editor/toolbar.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toolbar } from './Toolbar';
import { useDocumentStore } from '@/lib/document/store';
import { createBlankDoc } from '@/lib/document/factory';

beforeEach(() => {
  useDocumentStore.getState().loadDoc(createBlankDoc());
  useDocumentStore.temporal.getState().clear();
});

describe('Toolbar', () => {
  it('shows the project name', () => {
    render(<Toolbar projectName="Hello Shot" onExport={() => {}} />);
    expect(screen.getByText('Hello Shot')).toBeInTheDocument();
  });

  it('undo reverts the last document change', async () => {
    render(<Toolbar projectName="P" onExport={() => {}} />);
    useDocumentStore.getState().setPadding(300);
    await userEvent.click(screen.getByRole('button', { name: /undo/i }));
    expect(useDocumentStore.getState().doc.content.padding).toBe(64);
  });

  it('calls onExport when Export is clicked', async () => {
    let called = false;
    render(<Toolbar projectName="P" onExport={() => { called = true; }} />);
    await userEvent.click(screen.getByRole('button', { name: /export/i }));
    expect(called).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/editor/toolbar.test.tsx`
Expected: FAIL — cannot resolve `./Toolbar`.

- [ ] **Step 3: Write the UI store**

```ts
// lib/ui/store.ts
import { create } from 'zustand';

interface UiState {
  currentProjectId: string | null;
  isExporting: boolean;
  setCurrentProjectId: (id: string | null) => void;
  setIsExporting: (value: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  currentProjectId: null,
  isExporting: false,
  setCurrentProjectId: (currentProjectId) => set({ currentProjectId }),
  setIsExporting: (isExporting) => set({ isExporting }),
}));
```

- [ ] **Step 4: Write `Toolbar`**

```tsx
// components/editor/Toolbar.tsx
'use client';
import { useDocumentStore } from '@/lib/document/store';

type Props = { projectName: string; onExport: () => void };

export function Toolbar({ projectName, onExport }: Props) {
  const undo = () => useDocumentStore.temporal.getState().undo();
  const redo = () => useDocumentStore.temporal.getState().redo();

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        borderBottom: '1px solid #2a2d36',
        background: '#16181d',
        color: '#e5e7eb',
      }}
    >
      <strong>Screenstyler</strong>
      <span style={{ opacity: 0.7 }}>{projectName}</span>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        <button type="button" onClick={undo} aria-label="Undo">Undo</button>
        <button type="button" onClick={redo} aria-label="Redo">Redo</button>
        <button type="button" onClick={onExport}>Export</button>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Write `EditorShell`**

```tsx
// components/editor/EditorShell.tsx
'use client';
import type { ReactNode } from 'react';

type Props = { toolbar: ReactNode; canvas: ReactNode; panel: ReactNode };

export function EditorShell({ toolbar, canvas, panel }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {toolbar}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <main style={{ flex: 1, display: 'flex', minWidth: 0 }}>{canvas}</main>
        <aside
          style={{
            width: 320,
            borderLeft: '1px solid #2a2d36',
            background: '#16181d',
            color: '#e5e7eb',
            overflowY: 'auto',
          }}
        >
          {panel}
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Write the editor page**

This page loads the project named by `?id=`, wires the canvas and panels, and triggers export. `UploadZone` (Task 14) and `PropertiesPanel` (Task 15) are added in later tasks; for now render placeholders so the page compiles.

```tsx
// app/editor/page.tsx
'use client';
import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { EditorShell } from '@/components/editor/EditorShell';
import { Toolbar } from '@/components/editor/Toolbar';
import { CanvasStage } from '@/components/canvas/CanvasStage';
import { DocumentCanvas } from '@/components/canvas/DocumentCanvas';
import { useDocumentStore } from '@/lib/document/store';
import { projectStore } from '@/lib/storage/project-store-instance';
import { exportPng, downloadBlob, exportFilename } from '@/lib/export/export-png';

function EditorPage() {
  const id = useSearchParams().get('id') ?? '';
  const frameRef = useRef<HTMLDivElement>(null);
  const doc = useDocumentStore((s) => s.doc);
  const loadDoc = useDocumentStore((s) => s.loadDoc);

  const project = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectStore.load(id),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (project.data) {
      loadDoc(project.data);
      useDocumentStore.temporal.getState().clear();
    }
  }, [project.data, loadDoc]);

  async function handleExport() {
    if (!frameRef.current) return;
    const blob = await exportPng(frameRef.current, 2);
    downloadBlob(blob, exportFilename(id, 2));
  }

  return (
    <EditorShell
      toolbar={<Toolbar projectName={id} onExport={handleExport} />}
      canvas={
        <CanvasStage docWidth={doc.canvas.width} docHeight={doc.canvas.height}>
          <DocumentCanvas ref={frameRef} doc={doc} />
        </CanvasStage>
      }
      panel={<div style={{ padding: 16 }}>Panels added in Task 15</div>}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <EditorPage />
    </Suspense>
  );
}
```

Note: `projectStore` (`lib/storage/project-store-instance.ts`) and the TanStack Query provider are created in Task 16. Until then the page will not run in the browser; that is expected and the toolbar unit test does not need them.

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run components/editor/toolbar.test.tsx`
Expected: PASS — 3 tests.

- [ ] **Step 8: Commit**

```bash
git add lib/ui/store.ts components/editor app/editor/page.tsx
git commit -m "feat: add editor shell, toolbar, and editor page skeleton"
```

---

### Task 14: Image upload

**Files:**
- Create: `lib/upload/load-image.ts`
- Create: `components/editor/UploadZone.tsx`
- Test: `lib/upload/load-image.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/upload/load-image.test.ts
import { describe, it, expect } from 'vitest';
import { validateImageFile } from './load-image';

function file(name: string, type: string, size: number): File {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
}

describe('validateImageFile', () => {
  it('accepts a png under the size limit', () => {
    expect(validateImageFile(file('a.png', 'image/png', 1000))).toEqual({ ok: true });
  });

  it('rejects a non-image file', () => {
    const result = validateImageFile(file('a.pdf', 'application/pdf', 1000));
    expect(result).toEqual({ ok: false, reason: 'UNSUPPORTED_TYPE' });
  });

  it('rejects a file over 25 MB', () => {
    const result = validateImageFile(file('big.png', 'image/png', 26 * 1024 * 1024));
    expect(result).toEqual({ ok: false, reason: 'TOO_LARGE' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/upload/load-image.test.ts`
Expected: FAIL — cannot resolve `./load-image`.

- [ ] **Step 3: Write the upload helper**

```ts
// lib/upload/load-image.ts
import type { ImageRef } from '@/lib/document/schema';
import { blobStore } from '@/lib/storage/blob-store-instance';

const ALLOWED = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 25 * 1024 * 1024;

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: 'UNSUPPORTED_TYPE' | 'TOO_LARGE' };

export function validateImageFile(file: File): ValidationResult {
  if (!ALLOWED.includes(file.type)) return { ok: false, reason: 'UNSUPPORTED_TYPE' };
  if (file.size > MAX_BYTES) return { ok: false, reason: 'TOO_LARGE' };
  return { ok: true };
}

export async function ingestImageFile(file: File): Promise<ImageRef> {
  const bitmap = await createImageBitmap(file);
  const ref: ImageRef = {
    id: crypto.randomUUID(),
    blobKey: `img-${crypto.randomUUID()}`,
    naturalWidth: bitmap.width,
    naturalHeight: bitmap.height,
  };
  bitmap.close();
  await blobStore.put(ref.blobKey, file);
  return ref;
}
```

- [ ] **Step 4: Write `UploadZone`**

```tsx
// components/editor/UploadZone.tsx
'use client';
import { useState } from 'react';
import { useDocumentStore } from '@/lib/document/store';
import { ingestImageFile, validateImageFile } from '@/lib/upload/load-image';

const MESSAGES: Record<string, string> = {
  UNSUPPORTED_TYPE: 'Use a PNG, JPG, or WebP image.',
  TOO_LARGE: 'Image is larger than 25 MB.',
};

export function UploadZone() {
  const setImage = useDocumentStore((s) => s.setImage);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    const result = validateImageFile(file);
    if (!result.ok) {
      setError(MESSAGES[result.reason]);
      return;
    }
    setError(null);
    setImage(await ingestImageFile(file));
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) void handleFile(file);
      }}
      style={{
        margin: 'auto',
        padding: 48,
        border: '2px dashed #3a3d46',
        borderRadius: 16,
        textAlign: 'center',
        color: '#e5e7eb',
      }}
    >
      <p>Drop a screenshot here, or</p>
      <label style={{ cursor: 'pointer', textDecoration: 'underline' }}>
        choose a file
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </label>
      {error && <p style={{ color: '#f87171', marginTop: 12 }}>{error}</p>}
    </div>
  );
}
```

- [ ] **Step 5: Wire `UploadZone` into the editor page**

In `app/editor/page.tsx`, replace the `canvas={...}` prop so the upload zone shows until an image exists:

```tsx
import { UploadZone } from '@/components/editor/UploadZone';

// ...inside EditorPage's return, replace the canvas prop:
canvas={
  doc.content.image ? (
    <CanvasStage docWidth={doc.canvas.width} docHeight={doc.canvas.height}>
      <DocumentCanvas ref={frameRef} doc={doc} />
    </CanvasStage>
  ) : (
    <div style={{ flex: 1, display: 'flex', background: '#0f1115' }}>
      <UploadZone />
    </div>
  )
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run lib/upload/load-image.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 7: Commit**

```bash
git add lib/upload components/editor/UploadZone.tsx app/editor/page.tsx
git commit -m "feat: add image upload with validation"
```

---

### Task 15: Properties panels

**Files:**
- Create: `components/panels/BackgroundPanel.tsx`
- Create: `components/panels/StylePanel.tsx`
- Create: `components/panels/PropertiesPanel.tsx`
- Test: `components/panels/panels.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/panels/panels.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BackgroundPanel } from './BackgroundPanel';
import { StylePanel } from './StylePanel';
import { useDocumentStore } from '@/lib/document/store';
import { createBlankDoc } from '@/lib/document/factory';

beforeEach(() => {
  useDocumentStore.getState().loadDoc(createBlankDoc());
  useDocumentStore.temporal.getState().clear();
});

describe('BackgroundPanel', () => {
  it('applies a gradient preset on click', async () => {
    render(<BackgroundPanel />);
    await userEvent.click(screen.getByRole('button', { name: 'Ocean' }));
    expect(useDocumentStore.getState().doc.canvas.background).toMatchObject({
      type: 'gradient',
    });
  });
});

describe('StylePanel', () => {
  it('updates padding from the slider', () => {
    render(<StylePanel />);
    const slider = screen.getByLabelText('Padding');
    fireEvent.change(slider, { target: { value: '150' } });
    expect(useDocumentStore.getState().doc.content.padding).toBe(150);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/panels/panels.test.tsx`
Expected: FAIL — cannot resolve `./BackgroundPanel`.

- [ ] **Step 3: Write `BackgroundPanel`**

```tsx
// components/panels/BackgroundPanel.tsx
'use client';
import { useDocumentStore } from '@/lib/document/store';
import { gradientPresets } from '@/lib/presets/gradients';
import { backgroundToCss } from '@/lib/style/css';

export function BackgroundPanel() {
  const setBackground = useDocumentStore((s) => s.setBackground);
  return (
    <section style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 8px' }}>Background</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {gradientPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-label={preset.label}
            onClick={() => setBackground(preset.background)}
            style={{
              height: 48,
              borderRadius: 8,
              border: '1px solid #2a2d36',
              cursor: 'pointer',
              background: backgroundToCss(preset.background),
            }}
          />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Write `StylePanel`**

```tsx
// components/panels/StylePanel.tsx
'use client';
import { useDocumentStore } from '@/lib/document/store';

function Slider(props: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: 'block', margin: '12px 0' }}>
      <span style={{ display: 'flex', justifyContent: 'space-between' }}>
        {props.label}<span>{props.value}</span>
      </span>
      <input
        type="range"
        aria-label={props.label}
        min={props.min}
        max={props.max}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </label>
  );
}

export function StylePanel() {
  const doc = useDocumentStore((s) => s.doc);
  const setPadding = useDocumentStore((s) => s.setPadding);
  const setCornerRadius = useDocumentStore((s) => s.setCornerRadius);
  const setShadow = useDocumentStore((s) => s.setShadow);
  const { padding, cornerRadius, shadow } = doc.content;

  return (
    <section style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 8px' }}>Style</h3>
      <Slider label="Padding" value={padding} min={0} max={400} onChange={setPadding} />
      <Slider label="Corner radius" value={cornerRadius} min={0} max={80}
        onChange={setCornerRadius} />
      <Slider label="Shadow blur" value={shadow.blur} min={0} max={200}
        onChange={(v) => setShadow({ ...shadow, blur: v })} />
      <Slider label="Shadow opacity" value={Math.round(shadow.opacity * 100)} min={0} max={100}
        onChange={(v) => setShadow({ ...shadow, opacity: v / 100 })} />
    </section>
  );
}
```

- [ ] **Step 5: Write `PropertiesPanel`**

```tsx
// components/panels/PropertiesPanel.tsx
'use client';
import { BackgroundPanel } from './BackgroundPanel';
import { StylePanel } from './StylePanel';

export function PropertiesPanel() {
  return (
    <div>
      <BackgroundPanel />
      <StylePanel />
    </div>
  );
}
```

- [ ] **Step 6: Wire `PropertiesPanel` into the editor page**

In `app/editor/page.tsx`, replace the `panel` prop:

```tsx
import { PropertiesPanel } from '@/components/panels/PropertiesPanel';

// ...
panel={<PropertiesPanel />}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run components/panels/panels.test.tsx`
Expected: PASS — 2 tests.

- [ ] **Step 8: Commit**

```bash
git add components/panels app/editor/page.tsx
git commit -m "feat: add background and style properties panels"
```

---

## Phase 7 — Persistence integration

### Task 16: TanStack Query provider, project store instance, autosave

**Files:**
- Create: `lib/storage/project-store-instance.ts`
- Create: `app/providers.tsx`
- Modify: `app/layout.tsx`
- Create: `lib/editor/use-autosave.ts`
- Test: `lib/editor/use-autosave.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// lib/editor/use-autosave.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAutosave } from './use-autosave';
import { useDocumentStore } from '@/lib/document/store';
import { createBlankDoc } from '@/lib/document/factory';

beforeEach(() => {
  useDocumentStore.getState().loadDoc(createBlankDoc());
  useDocumentStore.temporal.getState().clear();
});

describe('useAutosave', () => {
  it('calls the save function (debounced) after a document change', async () => {
    vi.useFakeTimers();
    const save = vi.fn();
    renderHook(() => useAutosave('p1', save));

    useDocumentStore.getState().setPadding(123);
    expect(save).not.toHaveBeenCalled(); // debounced

    await vi.advanceTimersByTimeAsync(900);
    expect(save).toHaveBeenCalledWith('p1', expect.objectContaining({ version: 1 }));
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/editor/use-autosave.test.tsx`
Expected: FAIL — cannot resolve `./use-autosave`.

- [ ] **Step 3: Write the project store instance**

```ts
// lib/storage/project-store-instance.ts
import { LocalProjectStore } from './local-project-store';
import type { ProjectStore } from './types';

export const projectStore: ProjectStore = new LocalProjectStore();
```

- [ ] **Step 4: Write the autosave hook**

```ts
// lib/editor/use-autosave.ts
'use client';
import { useEffect, useRef } from 'react';
import { useDocumentStore } from '@/lib/document/store';
import type { ScreenstylerDoc } from '@/lib/document/schema';

const DEBOUNCE_MS = 800;

export function useAutosave(
  projectId: string | null,
  save: (id: string, doc: ScreenstylerDoc) => void,
): void {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (!projectId) return;
    const unsubscribe = useDocumentStore.subscribe((state) => {
      if (first.current) {
        first.current = false;
        return;
      }
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => save(projectId, state.doc), DEBOUNCE_MS);
    });
    return () => {
      unsubscribe();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [projectId, save]);
}
```

- [ ] **Step 5: Write the providers component**

```tsx
// app/providers.tsx
'use client';
import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 60_000 } } }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 6: Wrap the app in `Providers`**

In `app/layout.tsx`, import `Providers` and wrap `{children}`:

```tsx
import { Providers } from './providers';

// inside <body>:
<Providers>{children}</Providers>
```

- [ ] **Step 7: Wire autosave into the editor page**

In `app/editor/page.tsx`, add the autosave mutation and hook inside `EditorPage`:

```tsx
import { useMutation } from '@tanstack/react-query';
import { useAutosave } from '@/lib/editor/use-autosave';

// inside EditorPage, after the project query:
const saveMutation = useMutation({
  mutationFn: ({ id: pid, doc: d }: { id: string; doc: typeof doc }) =>
    projectStore.save(pid, d),
  onError: (err) => {
    if (err instanceof Error && err.message === 'STORAGE_FULL') {
      window.alert('Local storage is full. Delete old projects to keep saving.');
    }
  },
});
useAutosave(id || null, (pid, d) => saveMutation.mutate({ id: pid, doc: d }));
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run lib/editor/use-autosave.test.tsx`
Expected: PASS — 1 test.

- [ ] **Step 9: Commit**

```bash
git add lib/storage/project-store-instance.ts app/providers.tsx app/layout.tsx lib/editor app/editor/page.tsx
git commit -m "feat: add query provider, project store instance, and autosave"
```

---

### Task 17: Projects page

**Files:**
- Create: `app/projects/page.tsx`
- Create: `components/projects/ProjectList.tsx`
- Test: `components/projects/project-list.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/projects/project-list.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectList } from './ProjectList';
import type { ProjectMeta } from '@/lib/storage/types';

const metas: ProjectMeta[] = [
  { id: 'a', name: 'First', thumbnailKey: null, createdAt: 1, updatedAt: 2 },
  { id: 'b', name: 'Second', thumbnailKey: null, createdAt: 3, updatedAt: 4 },
];

describe('ProjectList', () => {
  it('renders one card per project with an open link', () => {
    render(<ProjectList projects={metas} onDelete={() => {}} />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /first/i })).toHaveAttribute(
      'href', '/editor?id=a',
    );
  });

  it('shows an empty state when there are no projects', () => {
    render(<ProjectList projects={[]} onDelete={() => {}} />);
    expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/projects/project-list.test.tsx`
Expected: FAIL — cannot resolve `./ProjectList`.

- [ ] **Step 3: Write `ProjectList`**

```tsx
// components/projects/ProjectList.tsx
'use client';
import Link from 'next/link';
import type { ProjectMeta } from '@/lib/storage/types';

type Props = { projects: ProjectMeta[]; onDelete: (id: string) => void };

export function ProjectList({ projects, onDelete }: Props) {
  if (projects.length === 0) {
    return <p style={{ opacity: 0.7 }}>No projects yet. Create one to get started.</p>;
  }
  return (
    <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
      listStyle: 'none', padding: 0 }}>
      {projects.map((p) => (
        <li key={p.id} style={{ border: '1px solid #2a2d36', borderRadius: 12, padding: 12 }}>
          <Link href={`/editor?id=${p.id}`} aria-label={`Open ${p.name}`}>
            <div style={{ height: 120, background: '#0f1115', borderRadius: 8 }} />
            <strong style={{ display: 'block', marginTop: 8 }}>{p.name}</strong>
          </Link>
          <button type="button" onClick={() => onDelete(p.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Write the projects page**

```tsx
// app/projects/page.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectList } from '@/components/projects/ProjectList';
import { projectStore } from '@/lib/storage/project-store-instance';
import { createBlankDoc } from '@/lib/document/factory';

export default function ProjectsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const projects = useQuery({ queryKey: ['projects'], queryFn: () => projectStore.list() });

  const createProject = useMutation({
    mutationFn: () => projectStore.create('Untitled', createBlankDoc()),
    onSuccess: (id) => router.push(`/editor?id=${id}`),
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) => projectStore.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: 32 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1>Projects</h1>
        <button type="button" onClick={() => createProject.mutate()}>New project</button>
      </header>
      {projects.data && (
        <ProjectList projects={projects.data} onDelete={(id) => deleteProject.mutate(id)} />
      )}
    </main>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/projects/project-list.test.tsx`
Expected: PASS — 2 tests.

- [ ] **Step 6: Commit**

```bash
git add app/projects/page.tsx components/projects
git commit -m "feat: add projects page with create and delete"
```

---

## Phase 8 — Robustness and end-to-end

### Task 18: Error handling, landing redirect, and E2E

**Files:**
- Create: `components/common/ErrorBoundary.tsx`
- Modify: `app/page.tsx`
- Modify: `app/editor/page.tsx`
- Create: `e2e/editor.spec.ts`
- Test: `components/common/error-boundary.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/common/error-boundary.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

function Boom(): never {
  throw new Error('kaboom');
}

describe('ErrorBoundary', () => {
  it('renders the fallback when a child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary fallback={<p>Something went wrong</p>}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/common/error-boundary.test.tsx`
Expected: FAIL — cannot resolve `./ErrorBoundary`.

- [ ] **Step 3: Write the error boundary**

```tsx
// components/common/ErrorBoundary.tsx
'use client';
import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode; fallback: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render(): ReactNode {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
```

- [ ] **Step 4: Harden the editor page**

In `app/editor/page.tsx`: (a) wrap `DocumentCanvas` rendering in `ErrorBoundary`; (b) surface a load error; (c) surface export failure. Replace the relevant parts of `EditorPage`:

```tsx
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// export handler with error surfacing:
async function handleExport() {
  if (!frameRef.current) return;
  try {
    const blob = await exportPng(frameRef.current, 2);
    downloadBlob(blob, exportFilename(id, 2));
  } catch {
    window.alert('Export failed. Make sure the image finished loading, then retry.');
  }
}

// load-error branch in the returned JSX's canvas prop:
if (project.isError) {
  return (
    <p style={{ padding: 32 }}>
      Could not load this project. It may have been deleted.
    </p>
  );
}
```

Wrap the canvas content:

```tsx
canvas={
  doc.content.image ? (
    <ErrorBoundary fallback={<p style={{ margin: 'auto' }}>Canvas failed to render.</p>}>
      <CanvasStage docWidth={doc.canvas.width} docHeight={doc.canvas.height}>
        <DocumentCanvas ref={frameRef} doc={doc} />
      </CanvasStage>
    </ErrorBoundary>
  ) : (
    <div style={{ flex: 1, display: 'flex', background: '#0f1115' }}>
      <UploadZone />
    </div>
  )
}
```

- [ ] **Step 5: Make the landing page route to projects**

Replace `app/page.tsx`:

```tsx
import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 64, textAlign: 'center' }}>
      <h1>Screenstyler</h1>
      <p>Turn plain screenshots into share-ready images.</p>
      <Link href="/projects">Open your projects</Link>
    </main>
  );
}
```

- [ ] **Step 6: Write the Playwright E2E happy path**

```ts
// e2e/editor.spec.ts
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('create a project, upload an image, and export a PNG', async ({ page }) => {
  await page.goto('/projects');
  await page.getByRole('button', { name: 'New project' }).click();
  await expect(page).toHaveURL(/\/editor\?id=/);

  // 1x1 PNG fixture
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
  await page.setInputFiles('input[type=file]', {
    name: 'shot.png', mimeType: 'image/png', buffer: png,
  });

  await expect(page.getByTestId('document-frame')).toBeVisible();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/\.png$/);
  expect(readFileSync(await file.path()).length).toBeGreaterThan(0);
});
```

- [ ] **Step 7: Configure Playwright**

Ensure `playwright.config.ts` has a webServer and baseURL:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 8: Run all tests**

Run: `npx vitest run components/common/error-boundary.test.tsx`
Expected: PASS — 1 test.
Run: `npm run test`
Expected: PASS — all unit/component suites green.
Run: `npm run test:e2e`
Expected: PASS — the editor happy-path spec passes.

- [ ] **Step 9: Commit**

```bash
git add components/common app/page.tsx app/editor/page.tsx e2e playwright.config.ts
git commit -m "feat: add error boundary, landing page, and E2E happy path"
```

---

## Definition of Done

- `npm run test` — all unit and component suites pass.
- `npm run test:e2e` — the editor happy-path spec passes.
- `npm run build` — production build succeeds.
- Manual smoke: create a project, upload a screenshot, change background and style,
  reload the page (project persists), export a PNG.

## What Plan 2 adds (not in scope here)

3D tilt/perspective, window/browser/device frame mockups, the annotation layer
(arrow/text/highlight/blur), style presets, save-time thumbnail generation, the
IndexedDB private-mode in-memory fallback, and the corrupt-document recovery screen.
