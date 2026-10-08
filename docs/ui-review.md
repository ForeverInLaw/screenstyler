# UI review fixes

Validate the thirteen supplied PR findings, including keyboard screenshot resize.
Keep changes scoped to the reported behavior and reuse the existing canvas/frame
renderer for previews. Modules stay under 500 lines; geometry and document-history
ownership live behind shared functions/classes. Global editor state uses Zustand
selectors, async project/auth operations stay in TanStack Query hooks, and no new
animation code is needed. Keep the dev server stopped.

## Work

- [x] Expose matching annotation defaults when changing tools.
- [x] Load fallback project previews only on request and reuse actual frame geometry.
- [x] Retain named exports and rename drafts when metadata/save requests fail.
- [x] Correct signup session routing and remove unverified email-delivery claims.
- [x] Coordinate overlapping document edits without resuming another gesture.
- [x] Ignore horizontal-only zoom and clean up active viewport-pan listeners.
- [x] Preserve the first upload error.
- [x] Add keyboard resizing through the same geometry used by mouse handles.
- [x] Verify, commit, and update PR #2; inspect further comments before asking
  whether to fix any findings beyond those supplied.

## Findings and verification

Twelve findings reproduce as described. The email-delivery finding is partly
correct: production already rejects missing transport configuration when
verification is required, but the UI still made an unverified delivery claim.
Signup feedback now describes verification without claiming delivery, and signup
with a session redirects immediately.

History pausing now has one coordinator for controls, annotation drags and crop
drags. It resumes only when every participating session finishes. Mouse and
keyboard screenshot resizing share proportional geometry, fixed frame headers,
opposite-corner anchoring and the existing batch-update operation.

Fallback previews reuse DocumentCanvas instead of duplicating frame, crop and
annotation rendering. Explicit canvas dimensions and passed document annotations
keep them independent of the currently open editor document. Documents and image
blobs are fetched only after requesting a preview. Existing thumbnails still load
automatically.

Verified: 162 full-suite unit/integration tests, then three final export checks
(163 tests total), 42 Chromium scenarios, TypeScript,
production build and ESLint (zero errors; four existing image warnings).
The five initial reproduction checks failed before the fixes and passed after.
The dev server and the temporary browser-test server are stopped.

PR #2 currently contains three inline findings and ten nitpicks; all are covered
by this change. No additional findings were present when fetched. New findings
from a later review require the user's requested opt-in before fixing.

Remaining limits: Firefox/Safari and real email delivery were not exercised.
Existing blob-store tracing and standalone-start build warnings remain.

## Changed modules

- Editor: `app/editor/page.tsx`, `components/editor/AnnotationOptions.tsx`,
  `components/editor/Toolbar.tsx`, `components/editor/UploadZone.tsx`,
  `lib/editor/use-editor-export.ts`.
- Canvas: `components/canvas/CanvasStage.tsx`,
  `components/canvas/AnnotationsLayer.tsx`,
  `components/canvas/ScreenshotSelectionOverlay.tsx`,
  `components/canvas/ScreenshotItemComponent.tsx`,
  `components/canvas/ContentLayer.tsx`, `components/canvas/DocumentCanvas.tsx`,
  `lib/editor/screenshot-drag.ts`, `lib/editor/screenshot-resize.ts`,
  `lib/document/edit-session.ts`.
- Auth: `components/auth/AuthModal.tsx`, `lib/auth/use-account-actions.ts`.
- Projects: `components/projects/ProjectList.tsx`,
  `components/projects/ProjectDocumentPreview.tsx`.
- Coverage: adjacent canvas/editor/project/auth unit tests, document-session and
  export tests, `e2e/cloud.spec.ts`, `e2e/review-fixes.spec.ts`.
- Documentation: this review record.
