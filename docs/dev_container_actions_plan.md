# Dev Container Actions UI Plan

The user wants a prominent UI (buttons in bottom right) when a Dev Container is detected.

## Features
- **Notification Toast**: A floating panel in the bottom right of the window.
- **Triggers**: Appears when `devContainerConfig` is detected.
- **Buttons**:
    1.  **Open in Container**: Starts the container and attaches. (Existing functionality)
    2.  **Rebuild Container**: Forces a docker build (no cache) before starting.
    3.  **Connect to Container**: (Clarify: Is this "Attach Terminal" to running container? Or just focus existing?)

## Implementation Details

### 1. `NotificationToast` Component
- Props: `title`, `message`, `actions: { label, handler, variant? }[]`, `onClose`.
- Styling: Fixed position, bottom-right, z-index high. Dark theme, shadow.

### 2. Backend Logic (`devContainer.ts`)
- Update `startDevContainer` to accept `options: { rebuild?: boolean }`.
- If `rebuild` is true:
    - Pass `--no-cache` to `docker build`.
    - Or ensure we pull the image again.

### 3. Integration (`App.tsx`)
- Render `NotificationToast` when `devContainerConfig` is set AND not yet running (state management needed).
- "what else might i be missing?":
    - **Show Log**: View the container creation logs.
    - **Edit Configuration**: Open `devcontainer.json`.

## Plan
1.  Modify `devContainer.ts` to handle `rebuild`.
2.  Create `NotificationToast.tsx`.
3.  Add it to `App.tsx` with the requested buttons.
