# Screenshot layers

IVO-10 reports that another screenshot can cover the selected screenshot's
action toolbar. Selection must keep the document's image order while the
toolbar stays visible and clickable above every screenshot.

## Editor toolbar

The existing selection toolbar renders into an editor overlay container in
the content layer using React's `createPortal`.
The container shares the images' coordinate system, padding, content transform,
and viewport zoom. The screenshot and toolbar anchor share the same layout.
Image stacking stays separate from toolbar stacking. The overlay is hidden
in previews and exports.

The arrows move one layer per click. Bring forward one layer and Send backward
one layer swap the screenshot with its immediate neighbour in the document
store. A direction is disabled at the end of the stack. The screenshot array
remains ordered from back to front. Each move uses the existing undo history.

## Acceptance and verification

The agreed seam is the editor UI with three overlapping screenshots. Verify
that selecting a lower screenshot preserves the visible image order and that
its toolbar is clickable. Verify one-step moves in both directions and Undo.
Observe the rendered image colours rather than reading store state.

Use the isolated loopback server on port 3101 with separate test storage. Run
focused UI tests during implementation, then type checking, the full suites,
and the Standards and Spec reviews before committing.
