# Dev Container Implementation Plan

## Overview
This document outlines the plan to implement a "Dev Container Wizard" in Openova. The goal is to allow users to easily generate a `devcontainer.json` configuration file via a user-friendly graphical interface, simplifying the setup of reproducible development environments.

## User Experience

### Entry Point
- **Menu Bar**: `File > New Dev Container Configuration...`
- **Command Palette**: `Dev Containers: Create Configuration File`
- **Welcome Screen**: "Set up Dev Container" button for open projects without a configuration.

### Wizard Workflow
The wizard will be a modal or dedicated view with the following steps:

1.  **Base Image Selection**
    - **Presets**: Dropdown list of common images (e.g., `mcr.microsoft.com/devcontainers/typescript-node`, `python:3`, `go:latest`).
    - **Custom**: Option to "Use Dockerfile" which allows selecting an existing Dockerfile in the project.

2.  **Hardware & Network Configuration**
    - **GPU Passthrough**: Checkbox to enable GPU support (adds `--gpus all` to `runArgs`).
    - **Display Passthrough**: Checkbox to share the host display (sets `DISPLAY` env var and volume mount).
    - **Network**: Dropdown to select network mode (e.g., `host`, `bridge`, or custom network).

3.  **Additional Features & Packages**
    - **Searchable List**: UI to browse and select Dev Container Features (e.g., `git`, `docker-in-docker`, `kubectl`).
    - **Custom Scripts**: Option to add a `postCreateCommand`.

4.  **Review & Generate**
    - Preview the generated JSON.
    - Button: "Create Configuration".

## Technical Implementation

### 1. Renderer Process (UI)
- **Component**: Create a `DevContainerWizard` React component.
- **Styling**: Use Tailwind CSS for a modern, responsive design (glassmorphism, vibrant colors).
- **State Management**: Use React `useState` / `useReducer` to manage the wizard steps data.
- **UI Elements**: Re-use existing React components where available; create new "Card" based selection for Presets.

### 2. Main Process (Logic)
- **IPC Handler**: Implement `devcontainer:save-config`.
- **Logic**:
    - Receive configuration object from Renderer.
    - Check if `.devcontainer` directory exists; create if not.
    - Serialize content to standard `devcontainer.json` format.
    - Write file to `<project-root>/.devcontainer/devcontainer.json`.

### 3. Output Format (devcontainer.json)
The generated file will follow the [Development Containers Specification](https://containers.dev/implementors/json_reference/) to ensure compatibility with VS Code and Openova.

**Example Output:**
```json
{
  "name": "Node.js & TypeScript",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye",
  "runArgs": [
    "--gpus", "all",
    "--net", "host"
  ],
  "features": {
    "ghcr.io/devcontainers/features/git:1": {}
  },
  "postCreateCommand": "npm install"
}
```

## Verification Plan
1.  **Unit Tests**:
    - Test the JSON generation logic with various input permutations (GPU on/off, Features list).
2.  **Manual Verification**:
    - Run the wizard in Openova.
    - Generate a config for a sample project.
    - Open the folder in VS Code (or Openova Dev Container backend) and verify it detects and builds the container correctly.
