# IVO-11: screenshot selection and alignment

## Agreed behaviour

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

## Architecture

Selection IDs belong to the editor UI store. Drag previews and guides belong
to a separate granular interaction store. The document store receives one
batch update when a drag finishes, so Undo records the original document.
Geometry and snapping live behind shared functions, used by single and group
operations. The existing selection overlay and toolbar remain the rendering
primitives. Preview controls and guides are hidden from exports.

Keep modules below 500 lines, use Zustand selectors, and preserve the existing
TanStack Query paths. No new animation or network request is needed.

## Delivery

- [x] Shift selection, shared movement, delete, and atomic Undo through editor UI.
- [x] Proportional group resize and stable one-layer moves.
- [x] Marquee selection and keyboard controls.
- [ ] Alignment snapping and visible guides for single images and groups.
- [ ] Full tests, Standards and Spec reviews, documentation, and atomic commits.

## References

- [FigJam selection conventions](https://help.figma.com/hc/en-us/articles/1500004292221-Select-move-and-order-objects-in-FigJam)
- [Photoshop snapping distance and bypass](https://helpx.adobe.com/photoshop/desktop/create-masks/layer-masks/position-elements-with-snapping.html)
- [Photoshop Smart Guides](https://helpx.adobe.com/uk/photoshop/desktop/use-grids-measurement-guides/alignment-grids-guides/work-efficiently-with-smart-guides.html)
