# AI Agent Implementation Plan

This document outlines the plan to integrate an AI Agent into OpenOva, utilizing local LLMs (via Ollama or LMStudio) and a local vector database for context-aware interactions.

## Goals
- Enable users to chat with an AI assistant within the IDE.
- Support local LLM backends (Ollama, LMStudio) to ensure privacy and offline capability.
- specialized "Agent" capabilities:
    - **Read/Write Files**: The agent can inspect and modify code directly.
    - **Terminal Access**: The agent can run commands (builds, tests, git).
    - **RAG (Retrieval Augmented Generation)**: A local vector database to index the codebase for semantic search, saving context tokens.

## Architecture

The implementation will span both the **Main Process** (backend logic, system access) and the **Renderer Process** (UI).

### 1. Main Process (`src/main`)
We will introduce an `AIAgentService` that handles:
- **LLM Communication**: Client for OpenAI-compatible APIs (Ollama/LMStudio).
- **Tool Execution**: wrappers around `fs` and `node-pty` for the agent.
- **Vector Database**: A local instance (using `lancedb` or similar lightweight solution) to store embeddings.
- **Embeddings**: using `transformers.js` (e.g., `Xenova/all-MiniLM-L6-v2`) running locally in the main process to verify/generate embeddings without external API calls.

### 2. Renderer Process (`src/renderer`)
- **AI Panel**: A new UI sidebar or panel for the chat interface.
- **Configuration**: Settings to specify the LLM endpoint (e.g., `http://localhost:11434`) and model name.

## Core Components

### A. LLM Client
A flexible client class that connects to local endpoints.
- **Config**: `baseUrl`, `apiKey` (optional for local), `model`.
- **Interface**: `chat(messages, tools)`

### B. Vector Database (RAG)
To save tokens and provide context:
- **Library**: `lancedb` + `transformers.js` for embeddings.
- **Strategy**:
    - Chunk files in the workspace.
    - Generate embeddings locally.
    - Store in a local DB file (e.g., inside `.openova/vectors`).
    - On chat, query the DB for relevant chunks and inject into the system prompt.

### C. Agent Tools
The agent will be equipped with function calling capabilities (if supported by the local model) or a structured prompting mechanism (ReAct pattern) to invoke:
1.  `read_file(path)`
2.  `write_file(path, content)`
3.  `list_dir(path)`
4.  `run_terminal_command(command)`

## Implementation Steps

1.  **Dependencies**: Install `openai` (client), `lancedb`, `@xenova/transformers`.
2.  **Backend Service**:
    - Create `src/main/services/AIService.ts`.
    - Implement embedding generation and vector storage.
    - Implement LLM request handling.
3.  **Tooling Layer**:
    - Expose safe file system and terminal methods to the `AIService`.
4.  **UI**:
    - Add `AIPanel` component in React.
    - Add IPC bridges (`window.electron.askAI(...)`).
5.  **Integration**:
    - Wire up the UI to the Backend.
    - Test with Ollama (e.g., `llama3` or `mistral`).

## Testing Strategy

We will use **Vitest** for unit and integration testing, and **React Testing Library** for UI components.

### 1. Unit Tests
*   **`src/main/services/AIService.spec.ts`**:
    *   Mock the LLM provider (Ollama/LMStudio) to verify prompt construction and response parsing.
    *   Test context management: ensure chat history is maintained and truncated correctly.
    *   Test tool selection logic: verify appropriate tools are called based on mock model outputs.
*   **`src/main/services/VectorStore.spec.ts`**:
    *   Test document chunking logic (ensure logic splits code correctly).
    *   Mock `lancedb` to verify add/search operations without persistent storage side effects.
*   **`src/main/tools/FileSystemTools.spec.ts`**:
    *   Test `read_file` and `write_file` for correct file handling.
    *   **Security Test**: Verify that path traversal (e.g., `../../`) is blocked and agents are confined to the workspace.

### 2. Component Tests
*   **`src/renderer/components/AIPanel.test.tsx`**:
    *   Test rendering of chat interface (input, message list).
    *   Test user input submission initiates the correct IPC call.
    *   Test loading states and markdown rendering of agent responses.

### 3. Integration Tests
*   **IPC Bridge**: Verify `window.electron.askAI` correctly invokes the usage method in the main process.

## Verification
- **Manual Test**: Connect to running Ollama instance, ask it to read a file in the project, and verify it can "see" the content.
- **RAG Test**: Ask a question about a specific function in the codebase and verify the agent retrieves the correct context.
