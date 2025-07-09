# 🤖 Gemini-Inspired AI Chatbot with RAG and Personalized Memory

This is a **Gemini-style AI chatbot interface** built with **React** (frontend) and **Node.js** (backend), featuring a **Retrieval-Augmented Generation (RAG)** pipeline. It allows users to interact with a Gemini-powered assistant that has knowledge of my personal experience and projects — thanks to custom scraping, embedding, and vector search.

---

## 🌐 Live Demo

👉 [View the Project on Vercel]([https://your-vercel-project-url.com](https://jairag.vercel.app/))

---

## 🧠 Key Features

- **Gemini-style Chat UI** with custom design tweaks
- **Retrieval-Augmented Generation (RAG)** pipeline:
  - Scrapes my **LinkedIn** via API and **personal website** via Puppeteer
  - Chunks, semantically embeds, and stores text with **BGE M3** embeddings
  - Embeddings are stored and queried in **Upstash Vector** DB
  - Dynamically injects relevant context into **Gemini API** requests with a **custom system prompt**
- **Speech-to-Text Support** via Web Speech API (Chrome-only — Firefox lacks support 🙄)
- **Hosted on Vercel** with fullstack deployment

---

## 🧰 Tech Stack

| Layer         | Technology                        |
|---------------|------------------------------------|
| **Frontend**  | React                              |
| **Backend**   | Node.js                            |
| **AI Model**  | Gemini API                         |
| **RAG Tools** | Puppeteer, BGE-M3 Embeddings       |
| **Database**  | Upstash Vector (Redis-based)       |
| **Hosting**   | Vercel                             |
| **Voice Input** | Web Speech API (Chrome support)  |

---

## 🧪 How It Works

1. **Data Gathering**  
   - LinkedIn data is pulled via a custom API
   - Puppeteer scrapes my portfolio site’s content

2. **Data Processing**  
   - Content is **chunked semantically** (sentence-aware)
   - Chunks are embedded using **BGE M3** embedding model
   - Stored in **Upstash Vector DB** for fast similarity search

3. **Chat Interaction**  
   - User message → similarity search → top matching chunks
   - Chunks + system prompt → Gemini API request
   - Response returned to frontend and displayed in chat UI

4. **Optional Voice Input**  
   - Click mic button → speech-to-text via browser API  
   - Works in **Chrome** (does not work in **Firefox**)

---

## 🧑‍💻 Getting Started

### Prerequisites

- Node.js + npm
- Vercel CLI (optional)
- Google Cloud / Gemini API key
- Upstash Vector DB credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/the-jola-amodu/gemini-rag-chatbot.git
cd gemini-rag-chatbot

# Install frontend and backend dependencies
npm install
cd client && npm install
cd ..

# Start development servers
npm run dev      # concurrently runs both frontend and backend
