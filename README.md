# HyperChat Studio

A dual-project workspace that ships an ultra-stylish, real-time multimodal chatbot experience powered by Groq for language + speech-to-text and ElevenLabs for expressive voice synthesis.

- **Backend**: FastAPI service orchestrating chat sessions, knowledge memory, Groq completions/STT, ElevenLabs TTS and WebRTC signalling.
- **Frontend**: Vite + React + Tailwind hyper-stylish control center that renders markdown/code/media, manages chats, and surfaces knowledge memories.

## Features

### Multimodal Intelligence
- Voice-to-voice loop with Groq Whisper transcription and ElevenLabs streaming speech.
- Text-to-text Groq chat completions with optional SSE streaming.
- Knowledge vault built on a vector store (Qdrant-compatible) for retrieval augmented responses.

### Memory & Knowledge Management
- Persist chats and messages in SQLAlchemy (SQLite by default, configurable to Postgres).
- Push full chat logs or ad-hoc uploads into the knowledge base with automatic embedding.
- Search memory instantly and surface snippets inside the UI.

### Ultra-stylish Frontend
- Command-center layout with chat studio, realtime call arena, and memory drawer.
- Markdown + code rendering with Prism syntax highlighting and dark neon aesthetic.
- Hooks for WebRTC audio streams and knowledge search actions.

## Getting Started

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload
```

Set environment variables via `.env` to connect to Groq, ElevenLabs, and an external database/vector store.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Configure `VITE_API_URL` in a `.env` file to point at the backend service.

## Project Structure

```
backend/
  app/
    routers/           # REST + WebSocket endpoints
    services/          # Groq + ElevenLabs integration helpers
    storage/           # Vector store (Qdrant) helpers for knowledge base
frontend/
  src/
    components/        # Ultra-stylish UI building blocks
    hooks/             # Data fetching hooks for chats/knowledge
```

Both services are intentionally modular to support further expansion—plug in WebRTC stacks, new vector stores, or custom UI animations with minimal friction.
