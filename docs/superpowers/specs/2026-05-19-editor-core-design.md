# Screenstyler — Editor Core (Sub-project 1) — Design

**Date:** 2026-05-19
**Status:** Approved
**Reference product:** https://pika.style/

## Overview

Screenstyler is a web product for turning plain screenshots into polished images:
backgrounds, padding, rounded corners, shadows, 3D tilt, window/device mockups,
annotations, and export-ready presets.

The product is split into two independently shippable sub-projects:

- **Sub-project 1 — Editor Core (this document).** The complete visual editing and
  export experience. Works fully client-side; projects persist in `localStorage` +
  `IndexedDB`. Independently releasable.
- **Sub-project 2 — Accounts + Cloud (separate spec later).** Neon Postgres, auth,
  cloud project storage, S3 blob storage. Layered on top of the finished core via
  the `ProjectStore` / `BlobStore` interfaces defined here.

This document specifies **Sub-project 1 only**.

## Goals

- Upload a screenshot and produce a beautiful, share-ready image entirely in the browser.
- Core editor: background (solid/gradient/image), padding, corner radius, shadow, PNG export.
- v1 extras: 3D tilt/perspective, window & device mockups, annotations, size & style presets.
- No backend required to use or ship the editor.
- Architecture leaves a clean seam so Sub-project 2 plugs in without rewriting the core.

## Non-Goals (explicitly out of scope for v1 — YAGNI)

- Accounts, cloud sync, S3 — Sub-project 2.
- Multi-image / collage layouts, batch export.
- Mesh-gradient editor (bundled gradient presets cover the look).
- Server-side export, video/GIF export.
- Mobile-responsive *editor* (v1 editor is desktop-first; the landing page is responsive).

## Tech Stack

Fixed for the whole product (both sub-projects). All libraries pinned to latest
versions; exact versions confirmed via Context7 during the implementation-plan stage.

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16 (App Router) + TypeScript, deployed on Vercel | API routes + frontend in one deploy = "light backend" without a separate server |
| Server state | TanStack Query | Per project AGENTS.md |
| Editor state | Zustand — granular slices, selector reads | Editor document model (layers / styles / transforms) |
| Animation | GSAP + `@gsap/react` `useGSAP()` | Per project AGENTS.md |
| Canvas render | DOM/CSS, layers as React components | 3D = CSS transform; mockups = styled elements |
| Export | `snapdom` (client-side, 2x/3x scale) | No headless Chromium needed |
| Undo/redo | `zundo` middleware for Zustand | Temporal store history |
| Validation | `zod` | Document schema validation on load |
| Database (SP2) | Neon Postgres + Drizzle ORM | Typed, migrations, light |
| Auth (SP2) | Better Auth — own tables in the same Neon DB | No third-party auth service; full control |
| Blob (SP2) | S3 | Source-screenshot storage |

## Architecture

### Module boundaries

```
lib/document/      Document types + Zustand store + pure mutations. No DOM, no React.
                   Fully unit-testable.
lib/presets/       Static data: canvas sizes, gradient presets, style presets,
                   frame/mockup definitions.
lib/export/        DOM node -> PNG blob. snapdom wrapper: scale 2x/3x, font preload.
lib/storage/       ProjectStore + BlobStore interfaces. v1 impl: LocalProjectStore
                   (localStorage) + IdbBlobStore (IndexedDB).
components/canvas/  Renders a document: CanvasStage, DocumentFrame, BackgroundLayer,
                   ContentLayer, Transform3D, FrameMockup, Screenshot, AnnotationLayer.
                   Pure render; reads the store via selectors.
components/panels/  Control panels (background, content style, 3D, frame, annotations,
                   export). Each isolated; dispatches store actions.
components/editor/  EditorShell layout: toolbar + tool rail + canvas + properties panel.
app/               Next routes: / (landing), /editor, /projects (local project list).
```

**Key seam:** `lib/storage/` defines the `ProjectStore` interface. v1 ships a
`localStorage`-backed implementation. Sub-project 2 provides a Neon-backed
implementation of the *same* interface. The editor never knows where data lives, so
the cloud layer is added without rewriting the core.

### Document model — single source of truth

The document is JSON-serializable. Annotation coordinates are in logical canvas px,
so export scales cleanly.

```ts
type ScreenstylerDoc = {
  version: 1;
  canvas: {
    preset: CanvasPresetId;          // 'free' | 'twitter' | 'instagram-post' | 'og' | '4k'
    width: number; height: number;   // logical px
    background: Background;
  };
  content: {
    image: ImageRef;                 // the screenshot
    padding: number;                 // gap between image and canvas edge
    cornerRadius: number;
    shadow: Shadow;
    frame: Frame;                    // none | window | browser | device
    transform3d: Transform3D;        // perspective tilt
  };
  annotations: Annotation[];
};

type Background =
  | { type:'solid';    color:string }
  | { type:'gradient'; stops:GradientStop[]; angle:number }
  | { type:'image';    ref:ImageRef; fit:'cover'|'contain' };

type Shadow = { x:number; y:number; blur:number; spread:number; color:string; opacity:number };

type Frame =
  | { type:'none' }
  | { type:'window';  variant:'macos'|'macos-dark' }
  | { type:'browser'; variant:'safari'|'chrome'|'arc'; url?:string; theme:'light'|'dark' }
  | { type:'device';  variant:'iphone'|'macbook'|'ipad' };

type Transform3D = {
  rotateX:number; rotateY:number; rotateZ:number;
  perspective:number; scale:number;
};

type Annotation =
  | { id:string; type:'arrow';     from:Point; to:Point; color:string; thickness:number }
  | { id:string; type:'text';      pos:Point;  text:string; fontSize:number; color:string }
  | { id:string; type:'highlight'; rect:Rect;  color:string }
  | { id:string; type:'blur';      rect:Rect;  intensity:number };

type ImageRef = { id:string; blobKey:string; naturalWidth:number; naturalHeight:number };
type Point = { x:number; y:number };
type Rect  = { x:number; y:number; w:number; h:number };
type GradientStop = { color:string; offset:number };
```

**Image storage detail:** screenshots are large; `localStorage` is ~5MB. Therefore the
document JSON goes to `localStorage`, and image blobs go to `IndexedDB`, keyed by
`ImageRef.blobKey`. Object URLs are recreated on document load from the IndexedDB blob.

## Editor UI

### Layout — `EditorShell`

```
+- Toolbar: logo - project name - undo/redo - Export button -------+
+--+----------------------------------------------+----------------+
|To|                                              |  Properties    |
|ol|        CanvasStage (zoom-to-fit, pan)         |  panel         |
|  |        renders the document                  |  (contextual)  |
|ra|                                              |                |
|il|                                              |                |
+--+----------------------------------------------+----------------+
```

- **Left tool rail:** Move/Select + annotation tools (arrow, text, highlight, blur).
- **Right properties panel — contextual:** nothing selected -> global properties
  (background, padding, corner radius, shadow, 3D, frame) as an accordion; an
  annotation selected -> that annotation's properties.

### State split

- **Document store** (`lib/document`, Zustand) — the document + mutations + undo/redo
  history (`zundo` middleware). This is what persists.
- **UI store** (Zustand, separate) — active tool, selected annotation id, zoom level,
  panel state. Never written into the document; never persisted.

## Canvas Rendering

### Layer tree

```
<CanvasStage>            // workspace: zoom/pan wrapper, centers the document
  <DocumentFrame>        // width x height logical px — THE export-capture node
    <BackgroundLayer/>   // solid / gradient / image, fills the frame
    <ContentLayer>       // padding wrapper
      <Transform3D>      // perspective + rotateX/Y/Z + scale
        <FrameMockup>    // none | window | browser | device — wraps the image
          <Screenshot/>  // user image: cornerRadius, shadow
    <AnnotationLayer/>   // arrow/text/highlight/blur, absolute, in logical coords
```

- `DocumentFrame` renders at logical px and is visually scaled with a CSS transform
  for the editor viewport. Export renders it at logical size x scale factor.
- **3D:** `perspective` on the parent, `transform: rotateX/Y/Z scale` on the child.
  The shadow lives on the `<Screenshot/>` element itself, so it tilts with the image.
- **Mockups:** CSS/SVG components in a `lib/presets` frame registry. Each frame defines
  a content-slot rect where the screenshot is placed.

### Blur annotation (export-risk mitigation)

`backdrop-filter` does not serialize reliably in `snapdom`. Instead, a blur annotation
is a div clipped to its `rect`, containing a duplicate of the screenshot positioned to
align with the original, with `filter: blur(intensity)` applied. `filter: blur()` (not
`backdrop-filter`) serializes correctly.

## Export

`lib/export/exportPng(node, { scale, format })`:

1. Await `document.fonts.ready` — fonts loaded.
2. Await `img.decode()` for all images — decoded.
3. `snapdom` captures the `DocumentFrame` node at scale 1x / 2x / 3x.
4. Produce a PNG blob -> trigger download named after the project.
5. Also support "copy to clipboard" via `ClipboardItem`.

**Export-bug defenses:**
- Fonts are bundled locally via `next/font` (no external CDN) so `fonts.ready` is
  deterministic.
- Background images in v1 are only user-uploaded images or bundled presets (no
  arbitrary URLs), avoiding CORS taint of the export canvas.

## Persistence

### Interfaces (Sub-project 2 swaps the implementation)

```ts
interface ProjectStore {
  list(): Promise<ProjectMeta[]>;
  load(id: string): Promise<ScreenstylerDoc>;
  create(doc: ScreenstylerDoc): Promise<string>;
  save(id: string, doc: ScreenstylerDoc): Promise<void>;
  remove(id: string): Promise<void>;
}

interface BlobStore {
  put(key: string, blob: Blob): Promise<void>;
  get(key: string): Promise<Blob | undefined>;
  remove(key: string): Promise<void>;
}

type ProjectMeta = {
  id:string; name:string; thumbnailKey:string; createdAt:number; updatedAt:number;
};
```

### v1 implementation

- `LocalProjectStore` — `localStorage`: `screenstyler:projects` (the index array) and
  `screenstyler:doc:<id>` (each document JSON).
- `IdbBlobStore` — an `IndexedDB` object store for image blobs and thumbnails.
- **Autosave:** the document is debounced (800 ms) into a TanStack Query mutation
  against the active project. TanStack Query wraps the local store from day one, with
  query keys `['projects']` and `['project', id]` — these keys are unchanged in
  Sub-project 2.
- **`/projects` page:** thumbnails + name + open / duplicate / delete. A thumbnail is
  generated on save (a low-scale `snapdom` capture, ~320 px wide, stored in `BlobStore`).

## Error Handling

| Case | Behavior |
|---|---|
| Image upload | Validate type (png/jpg/webp) and size; very large images offer a downscale; otherwise reject with a toast |
| Export failure | `snapdom` throws / produces a blank -> catch, toast with the reason, retry button |
| `QuotaExceededError` (localStorage) | Toast: "local storage full, delete old projects" (the document is small — it holds no images) |
| IndexedDB unavailable (private mode) | Fallback: keep blobs in-memory for the session + warn "projects will not persist" |
| Corrupt document on load | `zod`-validate on load; invalid -> do not crash, show a recovery screen |
| Lost object URL | On load, rehydrate object URLs from IndexedDB blobs; if a blob is missing -> placeholder "image lost" state |

## Testing

Test-driven per the superpowers TDD skill.

- **Unit (Vitest):** `lib/document` — every mutation (set background, transform,
  add/remove annotation, apply preset) plus undo/redo; `zod` serialize/parse
  round-trip; preset calculators. Pure, no DOM.
- **Component (React Testing Library):** panels dispatch the correct actions; the
  canvas renders a given document into the expected layer structure.
- **Export smoke test:** given a known document and a mounted `DocumentFrame`,
  `exportPng` returns a non-empty PNG blob of the expected dimensions.
- **Storage:** `LocalProjectStore` / `IdbBlobStore` against `fake-indexeddb` and a
  `localStorage` mock — CRUD round-trip.
- **E2E (Playwright, light):** happy path — upload -> style -> export downloads a file.

## Open Risks

- **Export fidelity.** `snapdom` is the chosen client-side capture path. The defenses
  above (local fonts, no CORS images, the blur-duplicate trick) cover the known
  failure modes, but exotic CSS may still mis-render. Mitigation path if it proves
  insufficient: add a server-side headless-Chromium "pro export" in a later iteration
  — explicitly not in v1.
- **3D tilt + large shadows + export scale** can be heavy to rasterize at 3x. The
  export smoke test gates this; if slow, cap default export at 2x.
