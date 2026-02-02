# Implementation Plan - Resizable Panels

The goal is to allow the user to resize panels in the IDE UI, specifically the Sidebar.

## Proposed Changes

### 1. Resizer Logic in `App.tsx`
Since `App.tsx` controls the main layout, we will manage the layout state there.

- **State**: Add `sidebarWidth` state (default `250px`).
- **Handlers**:
  - `startResizing`: Called when the user clicks the resize handle.
  - `resize`: Called on `mousemove` to update width.
  - `stopResizing`: Called on `mouseup` to cleanup listeners.

### 2. Styling and Components
- **Sidebar**: Remove the fixed `w-64` class from `Sidebar.tsx` (or override it) and use the dynamic `sidebarWidth`.
- **Resize Handle**: Add a vertical visual separator between the Sidebar and the Editor. It should have `cursor-col-resize`.

### Files to Modify

#### [MODIFY] [App.tsx](file:///home/nick/projects/openova/src/renderer/App.tsx)
- Import `useRef`, `useCallback`, `useEffect`.
- Add `sidebarWidth` state.
- Add resize logic (mouse event listeners).
- Insert a generic div serving as the resize handle between `Sidebar` and the main content.
- Pass the width to the Sidebar container.

#### [MODIFY] [Sidebar.tsx](file:///home/nick/projects/openova/src/renderer/components/Sidebar.tsx)
- Accept `width` prop (optional) or allow the parent to control width via a container.
- Currently `Sidebar` has `w-64`. We should change this to `w-full` or just remove the width class so it fills its container.

## Verification Plan

### Manual Verification
1.  Start the app (`npm run dev`).
2.  Hover over the border between the Sidebar and the Editor. The cursor should change to `col-resize`.
3.  Click and drag the border.
4.  Verify the Sidebar width changes and the Editor area adjusts accordingly.
5.  Release the mouse button and verify resizing stops.
