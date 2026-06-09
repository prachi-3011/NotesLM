# NotesLM Clone — Full-Stack RAG Document Assistant

An advanced, conversational research assistant modeled after NotebookLM. This full-stack application implements a robust **Retrieval-Augmented Generation (RAG)** pipeline. Users can upload various documents (PDF, DOCX, TXT, MD), which are systematically parsed, segmented with text overlaps, stored in a cloud database, and queried using an intelligent keyword matching relevance filter connected to a high-performance Llama-3.3 inference model.

## 🚀 Core Features
* **Multi-Format Document Ingestion:** Full extraction handling for complex PDFs, Microsoft Word (`.docx`), Markdown (`.md`), and plain text (`.txt`).
* **Smart Sliding-Window Chunking:** Slices text into overlapping 1,000-character blocks to retain crucial contextual meaning across text boundaries.
* **Universal PDF Engine Adapter:** Fully backward-and-forward compatible with evolving functional or class-based `pdf-parse` library layers.
* **Dynamic Context Injection:** Instantly scores and matches relevant text segments against user queries to eliminate AI hallucinations.
* **Interactive Chat Workspace:** Seamless workspace UI displaying granular server processing states and dynamic document selections.
* **Document Management Pipeline:** Includes instant sidebar listing feeds and permanent remote cloud deletion hooks.

---

## 🛠️ Technology Stack

### Frontend
* **React.js** (Functional Components & Hooks Architecture)
* **Native File Streams Engine** (`FileReader` DataURL array serialization)
* **Vanilla CSS3** (Responsive, scannable UI viewport layouts)

### Backend
* **Node.js & Express.js** (Asynchronous non-blocking network architecture)
* **Mongoose & MongoDB Atlas** (NoSQL Cloud database clustering)
* **Groq Cloud API** (Llama-3.3-70b-versatile infrastructure parsing)
* **Docx-Parser** (Binary XML Word parsing layers)

---

## 📁 Repository Structure
```text
NotesLM-Project/
├── README.md
├── .gitignore
├── noteslm-backend/
│   ├── server.js
│   ├── package.json
│   └── .env (Hidden)
└── noteslm-frontend/
    ├── src/
    │   ├── App.js
    │   ├── App.css
    │   └── index.js
    └── package.json

```

---

## ⚙️ Local Configuration & Setup

### 1. Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18+ recommended) and a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cloud database cluster setup.

### 2. Environment Configurations (Backend)

Navigate into your backend folder and create a secure environment file:

```bash
cd noteslm-backend
touch .env

```

Populate the `.env` file with your specific network configuration credentials:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/noteslm?retryWrites=true&w=majority
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

```

> ⚠️ **Security Warning:** The `.env` file contains sensitive security vectors and must never be committed to source control repository branches.

---

## 🏎️ Running the Application

### Step A: Fire Up the Backend Server

Open a new terminal window inside the root repository structure and run:

```bash
cd noteslm-backend
npm install
npm start

```

Upon a clean initialization, the terminal tracking stream will log:

```text
NotesLM Backend operating on port 5000
Connected to MongoDB database successfully...

```

### Step B: Launch the Frontend Workspace

Open a secondary terminal tab or window alongside your operational server process:

```bash
cd noteslm-frontend
npm install
npm start

```

The browser will automatically load the active interactive client console view interface at `http://localhost:3000` (or `http://localhost:5173`).

---

## 🔌 Core API Documentation Endpoint Map

### `POST /api/upload`

Accepts a base64 encoded document payload stream. Translates binary elements to pure text strings, breaks segments down into structural document components, and saves them to the database.

### `GET /api/documents`

Queries metadata fields from MongoDB Atlas, fetching an ultra-lightweight index file array feed (`_id`, `name`, `uploadedAt`) specifically engineered to keep sidebar loading transitions fast.

### `DELETE /api/documents/:id`

Purges a matching primary document reference record and its nested dependent text chunks directly from the database cluster.

### `POST /api/chat`

Takes user queries, evaluates content scores across target document chunks, structures system instructions with strict context boundaries, and returns formatted completions from the text extraction engine.
