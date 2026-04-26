# 📄 AI Chat with Documents (PDF Q&A System)

## 🚀 Project Overview

This project is an **AI-powered document question-answering system** that allows users to upload a PDF and ask questions based on its content.

Instead of manually reading long documents, the system intelligently retrieves the most relevant information using semantic search and returns accurate answers.

---

## 🎯 Key Features

* 📤 Upload PDF documents
* ✂️ Automatic text chunking
* 🔍 Semantic search using embeddings
* 🤖 Ask questions in natural language
* 💬 Chat-like interface for interaction
* ⚡ Retrieval using cosine similarity (Top 3 chunks)

---

## 🛠️ Tech Stack

### Backend

* Node.js
* Express.js
* Multer (for file uploads)

### AI / Logic

* Embeddings (vector representation of text)
* Cosine similarity (for semantic matching)

### Frontend

* HTML
* CSS
* JavaScript (Vanilla)

---

## ⚙️ How the System Works (Step-by-Step)

### 1. File Upload

* User uploads a PDF file
* Backend receives file via `/upload` route
* Multer stores it in the `uploads/` folder

---

### 2. Text Processing

* PDF content is extracted
* Text is split into smaller chunks
  👉 This improves efficiency and retrieval accuracy

---

### 3. Embedding Generation

* Each chunk is converted into a **vector (embedding)**
* Embeddings capture the semantic meaning of text

---

### 4. User Query Handling

* User asks a question via chat interface
* The question is also converted into an embedding

---

### 5. Similarity Search

* System compares question embedding with all chunk embeddings
* Uses cosine similarity to find the **top 3 most relevant chunks**

---

### 6. Response Generation

* Top **3 most relevant chunks** are selected
* These chunks are combined to form better context
* Answer is generated based on these chunks
* Response is sent back to frontend

---

## 🧠 Core Concepts Used

### 🔹 Embeddings

Embeddings convert text into numerical vectors so that semantic meaning can be compared mathematically instead of relying on keywords.

---

### 🔹 Cosine Similarity

Measures similarity between two vectors.

* Value close to **1 → highly similar**
* Value close to **0 → not similar**

---

### 🔹 Chunking

Large documents are broken into smaller parts to:

* Improve accuracy
* Reduce computation
* Enable better semantic matching

---

## 📂 Project Structure

```bash
project-root/
│
├── uploads/            # Stored PDF files
├── server.js           # Main backend server
├── routes/             # API routes (upload + chat)
├── utils/              # Embedding & similarity logic
├── public/             # Frontend files
│   ├── index.html
│   ├── style.css
│   └── script.js
```

---

## 🔌 API Endpoints

### 1. Upload PDF

```bash
POST /upload
```

* Accepts PDF file
* Processes and stores document chunks

---

### 2. Ask Question

```bash
POST /chat
```

* Input: user question
* Output: answer generated from top 3 relevant chunks

---

## 💡 Design Decisions

* ❌ No database used
  → Data is stored in memory (keeps system simple for interview-level project)

* ✅ Retrieval-based approach
  → Focus on embeddings + similarity instead of heavy LLM integration

* ✅ Use of Top 3 chunks
  → Improves answer quality by providing better context

* ✅ Lightweight architecture
  → Easy to understand, explain, and debug

---

## ⚠️ Limitations

* Data is not persistent (resets when server restarts)
* Only one document handled at a time
* Basic UI (can be improved further)
* Does not use advanced LLM for reasoning (retrieval-based system)

---

## 📸 UI Overview

* Simple chat interface
* File upload section
* Question input + response display

---

## 🧪 How to Run Locally

```bash
# Install dependencies
npm install

# Start server
node server.js
```

Open in browser:

```
http://localhost:5000
```

---

## 🧠 What I Learned

* How semantic search works using embeddings
* Importance of chunking in document processing
* How cosine similarity enables meaning-based retrieval
* Backend API design using Express
* Handling file uploads using Multer
* Building a complete end-to-end AI system

---

## 🎯 Future Improvements (Optional)

* Add database (MongoDB) for persistence
* Support multiple documents
* Improve UI/UX
* Integrate LLM for advanced answer generation

---

## 📌 Conclusion

This project demonstrates a **complete pipeline of document-based question answering using semantic search**.

It focuses on strong fundamentals like embeddings, similarity search, and system design, making it a solid **interview-ready AI project**.

---
