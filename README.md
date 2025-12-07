# 🌟 Echodocs — AI Powered Collaborative Document Editor



---

## 📌 Live Deployment Links

| Service | URL |
|--------|-----|
| **Frontend (Vercel)** | 🔗 https://echodocs.vercel.app |
| **Backend (Render)** | 🔗 https://echodocs-1-pi2z.onrender.com |
| **GitHub Repository** | 🔗 https://github.com/Rohith2601/Echodocs |

The backend root returns: **“Echodocs backend is running ✅”**

---

## 🎯 Project Overview

Echodocs is a **full AI-powered writing assistant + live collaborative editor**, featuring:

### ✨ **Key Features**
- 📝 **Personal documents** (private, offline-first, local storage)
- 🔗 **Shareable Live View links** (read-only)
- 🔄 **Convert personal → shared collaborative docs**
- 👥 **Real-time collaboration using Socket.IO**
- ✏️ **Rich text editing with React-Quill**
- 🧠 **AI document analysis** (TODO detection, repetition, contradiction, clarity issues)
- 🕒 Document History (Timeline)
- 🔥 Heatmap view of contributions
- 🎥 Replay timeline of edits
- 🎨 Colored live cursors
- 🧩 Consistent architecture ready for extension

---

## 🖼️ Screenshots (Add your images here later)

You can replace these placeholders with your real screenshots.

### 🌐 Dashboard  
![Dashboard](https://via.placeholder.com/900x400?text=Dashboard+Preview)

### ✍️ Personal Editor  
![Personal Doc](https://via.placeholder.com/900x400?text=Personal+Editor)

### 🤝 Shared Collaborative Editor  
![Shared Editing](https://via.placeholder.com/900x400?text=Collaborative+Editor)

### 🤖 AI Analysis  
![AI Analysis](https://via.placeholder.com/900x400?text=AI+Analysis)

---

## 🧱 Architecture

scss

                     ┌────────────────────────────────┐
                     │          Frontend              │
                     │     React + Vercel (client)    │
                     └───────────────┬────────────────┘
                                     │ REST + WebSockets
                                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│ Backend (Render) │
│ Node.js + Express + Socket.IO + In-memory DB │
└─────────────────────────────────┬────────────────────────────────────┘
│ axios (AI request)
▼
┌──────────────────────────┐
│ AI Service (Render) │
│ FastAPI + spaCy + ML/NLP │
└──────────────────────────┘

markdown


---

# 🧪 Tech Stack

### **Frontend – React (Vercel)**
- React + TypeScript
- React Router
- Vite
- ReactQuill (Rich text editor)
- Socket.IO client
- Axios
- Tailwind-like layout + custom CSS

### **Backend – Node.js (Render)**
- Express REST API
- Socket.IO (real-time editing)
- In-memory documents
- Version history tracking
- Contribution metrics
- AI orchestrator (calls FastAPI)

### **AI Service – FastAPI (Render)**
- Python 3.10+
- FastAPI
- spaCy
- SBERT (semantic similarity)
- BART-MNLI (contradiction detection)
- Custom TODO/highlight extractors

---

# 🚀 Getting Started (Local Setup)

## 1️⃣ Clone the repo
git clone https://github.com/Rohith2601/Echodocs
cd Echodocs
2️⃣ Start AI Service (FastAPI)

cd ai_service
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate # Linux/macOS

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
Runs at:
➡ http://127.0.0.1:8000

3️⃣ Start Backend (Node.js)


cd ../server
npm install
Create .env:

ini

PORT=5000
AI_SERVICE_URL=http://127.0.0.1:8000/analyze-document
Run server:



node server.js
Backend runs at:
➡ http://localhost:5000

4️⃣ Start Frontend


cd ../client
npm install
Add .env:

ini

REACT_APP_BACKEND_URL=http://localhost:5000
Run:



npm run dev
Opens:
➡ http://localhost:5173

🌍 Production Deployment Guide
Frontend (Vercel)
mathematica

Root Directory: client
Build Command: npm run build
Output Directory: dist
Environment Variables:
  REACT_APP_BACKEND_URL = https://echodocs-1-pi2z.onrender.com
Backend (Render - Node Web Service)
mathematica

Root Directory: server
Start Command: node server.js
Environment Variables:
  AI_SERVICE_URL = https://<your-ai-service>.onrender.com/analyze-document
Backend Live:
🔗 https://echodocs-1-pi2z.onrender.com

AI Service (Render - Python Web Service)
nginx

Root Directory: ai_service
Start Command:
uvicorn app.main:app --host 0.0.0.0 --port $PORT
📂 Project Structure


Echodocs/
│
├── client/            # React frontend
│   ├── src/
│   └── public/
│
├── server/            # Node.js Backend
│   ├── server.js
│   └── routes/
│
└── ai_service/        # FastAPI AI server
    ├── app/main.py
    └── requirements.txt
🧠 How Major Features Work
▶ Personal → Share Link


POST /api/share-personal
Backend creates read-only doc → returns link.

▶ Personal → Shared doc
sql

POST /api/create-shared-from-personal
▶ AI Analysis

PUT /api/documents/:id/content
POST /api/documents/:id/analyze
AI returns structured “zones” → highlighted inside editor.

▶ Real-time Collaboration
Socket.IO rooms per document

Deltas sent via "send-changes"

Cursor broadcasting

Auto-save every 2.5 seconds

⭐ Future Enhancements
Move from in-memory → MongoDB/Postgres

User login/auth

Full document permissions system

Export PDFs

Better AI summarization + rewrite suggestions

👤 Author
Rohith Puchakayala
⭐ GitHub: https://github.com/Rohith2601

If this project helps you or inspires you — please star ⭐ the
