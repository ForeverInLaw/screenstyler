# Screenstyler roadmap

## Studio form controls

Use Base UI 1.8 for select, checkbox, and account-menu interaction, styled with the
existing graphite surfaces, 40px controls, amber selection, and Tabler icons.
Shared wrappers encapsulate presentation and accessibility; panels only supply
typed values and callbacks. Keep modules under 500 lines. Document/UI state stays
in Zustand selectors, server state stays in TanStack Query, and no animation or
document-format changes are required.

- [x] Add styled select and checkbox components and migrate every existing use.
- [x] Replace manual account-menu listeners with Base UI focus/dismissal behavior.
- [x] Verify keyboard, undo, desktop/mobile appearance, and existing checks.
- [x] Document the shared controls and commit the verified change.

### Controls verification

- 141 unit/integration tests passed, including profile-menu keyboard focus and
  custom-control shortcut isolation. TypeScript and production builds passed;
  ESLint has no errors and the same six existing image-element warnings.
- All 34 existing Chromium scenarios passed. The five-scenario studio rerun
  also passed with two added desktop/mobile keyboard, checkbox, and Undo cases,
  covering 36 distinct scenarios. The new cases use the existing 800 × 600 image
  fixture because a 1 × 1 image has a subpixel click target after canvas fitting.
- Open selectors, checked boxes, and profile menus were visually inspected at
  1440 × 1000 and 390 × 844. Popups fit the viewport; keyboard focus returns on
  dismissal; the production browser reported no JavaScript errors. Browser
  automation was limited to Chromium. Existing blob-store tracing and standalone
  startup warnings remain outside this change.
- The only new direct dependency is `@base-ui/react`; existing locked package
  versions remain unchanged. Selects infer document enum values, account-menu
  listeners were removed, and shared shortcut guards protect custom controls.

### Controls changed files

- `components/ui/Select.tsx`, `components/ui/Checkbox.tsx`,
  `components/ui/DropdownMenu.tsx`
- `components/panels/FramePanel.tsx`, `components/panels/GridPanel.tsx`,
  `components/panels/BackgroundPanel.tsx`
- `components/editor/AnnotationOptions.tsx`, `components/editor/toolbar.test.tsx`
- `components/auth/AuthButton.tsx`, `components/auth/AuthButton.test.tsx`
- `app/editor/page.tsx`, `app/projects/page.tsx`, `app/layout.tsx`, `app/globals.css`
- `lib/upload/clipboard.ts`, `lib/upload/clipboard.test.ts`
- `e2e/studio.spec.ts`, `e2e/selection.spec.ts`, `e2e/review-fixes.spec.ts`
- `package.json`, `package-lock.json`, `README.md`, `roadmap.md`

## UI overhaul

Build a consistent dark screenshot studio across the overview, projects, editor,
and account screens. The canvas is the focal point; compact controls follow the
image → frame/background → annotate → export workflow used by Shots and
Screenshot.Rocks. Use graphite surfaces, chalk text, and a restrained amber accent.
Crop corners, format labels, visual style previews, and a contact sheet connect
the product to screenshot composition.

Implementation stays behind the existing document and storage interfaces.
Reuse panel components, extract shared controls and native dialogs, keep changed
modules under 500 lines, and preserve TanStack Query for server state. Inspector
navigation belongs to a granular Zustand store read with selectors. No new
animation dependencies or document migrations are needed.

- [x] Establish semantic tokens, typography, and shared controls.
- [x] Recompose the editor and restyle every inspector panel.
- [x] Redesign overview, project browsing, and account/recovery states.
- [x] Verify desktop/mobile, existing tests, export, and cloud/local workflows.
- [x] Commit the verified increments.

### UI verification

- All 134 existing unit/integration tests passed; 3 new account-request error
  tests passed, for 137 total.
- All 31 existing Chromium scenarios passed. The three added studio scenarios
  cover dialog focus, project search/sort/rename, and mobile inspector/zoom.
  The final focused run rechecked cloud auth and these three scenarios after
  fixing initial focus and focus restoration.
- Production builds and TypeScript passed. ESLint has no errors; six existing
  image-element warnings remain in the screenshot and preview renderers.
- Desktop 1440 × 1000 and mobile 390 × 844 screenshots were inspected. The
  production browser reported no JavaScript errors or horizontal overflow.
  Header layouts were also checked at widths 320 and 768.
  A 2× export produced a valid 3200 × 2000 PNG.
- The existing Turbopack warning about broad tracing from the local blob store
  remains. Deployment packaging was not changed by this UI work.

### UI design decisions

- One focal composition per screen. The editor gives most width to the canvas;
  the 320px inspector uses 20px sections. Mobile places it below the canvas at
  36dvh and provides a collapse control. The mobile page header groups the
  brand/account above the navigation, keeping loading and signed-in states stable.
- Four-point spacing grid, 40px controls, 8px control radii, 12px panels, and
  16px dialogs. Depth comes from small graphite tone changes and quiet borders.
- DM Sans for controls, Space Grotesk for display and headings, Geist Mono for
  dimensions and metadata. Primary text is chalk; secondary and metadata use
  separate silver tokens. Amber marks actions, focus, and selection.
- Tabler icons at 20–22px for navigation/tools, 18px in inspector headings,
  and larger icons in empty states. Preset miniatures show the actual frame
  type and perspective before selection.
- Native dialogs manage modal interaction. A marked field receives initial
  focus; closing the dialog before DOM removal restores the opening control.
- Layout and identity state belong to the workspace Zustand store. Account
  requests and export progress belong to TanStack Query hooks. Rendered document
  colors and device chrome stay independent of the UI theme.

References: [Shots](https://shots.so/),
[Screenshot.Rocks](https://screenshot.rocks/), and
[native dialog behavior](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element).

### Changed files

- `README.md`
- `app/(auth)/auth/reset/page.tsx`
- `app/(auth)/auth/verify/page.tsx`
- `app/editor/page.tsx`
- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`
- `app/projects/page.tsx`
- `app/studio.css`
- `components/auth/AccountShell.tsx`
- `components/auth/AuthButton.tsx`
- `components/auth/AuthModal.tsx`
- `components/canvas/AnnotationSelection.tsx`
- `components/canvas/AnnotationsLayer.tsx`
- `components/canvas/CanvasStage.tsx`
- `components/canvas/ScreenshotActionsToolbar.tsx`
- `components/canvas/ScreenshotCropEditor.tsx`
- `components/canvas/ScreenshotInteractionOverlay.tsx`
- `components/canvas/ScreenshotSelectionOverlay.tsx`
- `components/common/AppHeader.tsx`
- `components/common/Brand.tsx`
- `components/common/SampleScene.tsx`
- `components/editor/AnnotationOptions.tsx`
- `components/editor/DocumentRecoveryScreen.tsx`
- `components/editor/EditorShell.tsx`
- `components/editor/Toolbar.tsx`
- `components/editor/UploadZone.tsx`
- `components/migration/MigrationRunner.tsx`
- `components/panels/BackgroundPanel.tsx`
- `components/panels/CanvasSizePanel.tsx`
- `components/panels/FramePanel.tsx`
- `components/panels/GridPanel.tsx`
- `components/panels/PresetsPanel.tsx`
- `components/panels/PropertiesPanel.tsx`
- `components/panels/StylePanel.tsx`
- `components/panels/Transform3DPanel.tsx`
- `components/projects/ProjectDocumentPreview.tsx`
- `components/projects/ProjectList.tsx`
- `components/ui/Button.tsx`
- `components/ui/Dialog.tsx`
- `components/ui/DocumentSlider.tsx`
- `components/ui/PanelSection.tsx`
- `e2e/studio.spec.ts`
- `lib/auth/use-account-actions.test.tsx`
- `lib/auth/use-account-actions.ts`
- `lib/editor/use-editor-export.ts`
- `lib/editor/workspace-store.ts`
- `roadmap.md`


## Screenshot selection and alignment (IVO-11)

### Agreed behaviour

- Shift+click toggles an image in the selection. Dragging a selected image
  moves the selection; clicking without dragging selects that image alone.
- A drag from empty canvas selects intersecting screenshots. Shift+drag adds
  to the selection. Ctrl/Cmd+A selects all screenshots; Escape clears it.
- One selection toolbar controls moving, proportional scaling, deleting,
  and changing layers. Crop is available for one selected screenshot.
- Each group edit creates one Undo step. Layer moves preserve the selected
  images' relative order and advance by one unselected layer per click.
- While moving, edges and centres snap to other screenshots within eight
  screen pixels and show alignment guides. A group snaps by its shared bounds.
  Ctrl/Cmd while dragging temporarily bypasses snapping. Image alignment has
  priority over the optional grid when a matching image guide is close.

### Architecture

Selection IDs belong to the editor UI store. Drag previews and guides belong
to a separate granular interaction store. The document store receives one
batch update when a drag finishes, so Undo records the original document.
Geometry and snapping live behind shared functions, used by single and group
operations. The existing selection overlay and toolbar remain the rendering
primitives. Preview controls and guides are hidden from exports.

Screen coordinates pass through one inverse projection of the content plane.
Marquee selection and image dragging share it, including transform origins,
perspective, padding and viewport scaling. Selection actions discard IDs that
Undo or a document replacement removed; controls count existing screenshots.

Keep modules below 500 lines, use Zustand selectors, and preserve the existing
TanStack Query paths. No new animation or network request is needed.

### Delivery

- [x] Shift selection, shared movement, delete, and atomic Undo through editor UI.
- [x] Proportional group resize and stable one-layer moves.
- [x] Marquee selection and keyboard controls.
- [x] Alignment snapping and visible guides for single images and groups.
- [x] Full tests, Standards and Spec reviews, documentation, and atomic commits.

### Validation

- Full Vitest suite: 127 tests across 34 files passed.
- Production-build Playwright suite: 18 Chromium UI tests passed.
- TypeScript and targeted ESLint passed; two existing image-element warnings remain.
- Standards and Spec review findings were fixed and re-reviewed; none remain open.
- UI coverage includes Undo after upload, framed resize, rotation and perspective.

### References

- [FigJam selection conventions](https://help.figma.com/hc/en-us/articles/1500004292221-Select-move-and-order-objects-in-FigJam)
- [Photoshop snapping distance and bypass](https://helpx.adobe.com/photoshop/desktop/create-masks/layer-masks/position-elements-with-snapping.html)
- [Photoshop Smart Guides](https://helpx.adobe.com/uk/photoshop/desktop/use-grids-measurement-guides/alignment-grids-guides/work-efficiently-with-smart-guides.html)
- [CSS transform and perspective matrices](https://www.w3.org/TR/css-transforms-2/)
