# Dev Containers Implementation Roadmap for Openova

This document outlines the technical plan to add full Dev Container support to Openova, targeting a "Reopen in Container" experience similar to VS Code.

## 1. Architecture Overview

To achieve Dev Container support, we will leverage the local Docker daemon. Openova (running on the host) will orchestrate container lifecycles and interact with them via the Docker CLI or Docker Engine API.

**Key Components:**
- **Container Manager (Main Process):** Handles `devcontainer.json` parsing, Docker command execution, and state management.
- **Volume Mounting:** The project directory is bind-mounted into the container, allowing the local Openova editor to modify files directly while the container provides the runtime.
- **Terminal Integration:** The internal terminal will spawn shells inside the running container (via `docker exec`).

## 2. Implementation Phases

### Phase 1: Detection & Parsing
**Goal:** Recognize when a project is Dev Container-ready.

- [ ] **File Watcher:** Monitor for `.devcontainer/devcontainer.json` or `.devcontainer.json` in the root.
- [ ] **JSON Parser:** Implement a parser for the `devcontainer.json` spec (subset initially).
    - Support: `image`, `build.dockerfile`, `forwardPorts`, `postCreateCommand`.
- [ ] **UI Indicator:** Add a status bar item (green remote indicator like VS Code) showing "Dev Container" availability.

### Phase 2: Container Lifecycle Management
**Goal:** Build and run the development environment.

- [ ] **Image Building:**
    - If `image` is specified: Pull it.
    - If `dockerfile` is specified: Run `docker build`.
- [ ] **Container Start:**
    - Run `docker run` with necessary flags:
        - `-v <local-path>:<container-path>` (Workspace mount)
        - `-w <container-path>` (Working directory)
        - `--network host` (Optional, for simplified networking)
    - Handle `postCreateCommand` execution (blocking step before ready).

### Phase 3: Terminal & Runtime Integration
**Goal:** seamless developer experience.

- [ ] **Terminal Hook:** Update the `node-pty` integration in Openova.
    - If in "Dev Container Mode", spawn terminal processes via `docker exec -it <container-id> <shell>`.
- [ ] **LSP/Runtime (Future):**
    - Eventually, language servers should run inside the container.
    - For Phase 1, we rely on the host's LSPs working on the mounted files, while the *runtime* (e.g. `npm start`, `go run`) happens in the container terminal.

## 3. User Workflow

1. User opens a project.
2. Openova detects `.devcontainer`.
3. User clicks "Reopen in Container" (or prompted via notification).
4. **Loading Screen:** "Building Dev Container...".
5. Terminal reloads, now inside the container.
6. User runs `npm start` in the terminal -> executes in Docker.

## 4. Dependencies

- **Docker CLI:** Must be installed and available in the user's PATH.
- **node-pty:** Already used, will need adaptation for `docker exec` wrapping.

## 5. Verification Plan

1. **Smoke Test:**
    - specific repo with `.devcontainer/devcontainer.json` (using a standard node node image).
    - Verify "Reopen" triggers docker build/run.
    - Verify terminal `whoami` returns container user.
2. **File Persistence:**
    - Edit file in Openova -> Check file in container (via `cat`).
    - Touch file in container -> Check file in Openova file explorer.
