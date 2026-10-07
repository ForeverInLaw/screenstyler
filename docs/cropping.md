# Screenshot cropping

IVO-9 reports that the committed crop differs from the region shown in the editor.

## Coordinate system

Crop rectangles use natural image pixels in the document. The content layer
has padding and can be scaled independently of the canvas viewport. Rendering
the crop box and its source image in logical CSS pixels made them larger than
the percentage-sized screenshot container, so committing changed the region.

Crop overlays use percentages of the full source image. `imageCropToStyle`
positions the source image as percentages of the cropped viewport, shared by
the editor, committed image, and project thumbnail. Pointer deltas convert to
natural pixels using the crop editor's rendered bounds, including padding,
content scale, and viewport zoom. Document coordinates and crop sessions keep
their existing format.

## Acceptance and verification

The agreed test boundary is the editor UI: upload an image, drag crop handles,
finish cropping, and compare the visible image with the selected region. Check
the same behavior when reopening the crop and using a different canvas size.

Use one Playwright worker and a separate loopback port, 3101 by default. The
application defaults to 3100. Test storage and credentials are isolated from
the deployment. Run focused tests during the fix, then type checking and the
full suites before committing.
