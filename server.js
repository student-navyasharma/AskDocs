const express = require('express')
const multer = require('multer')
const pdfParse = require('pdf-parse')
const fs = require('fs')
const cors = require('cors')
require('dotenv').config()

const OpenAI = require("openai")

const app = express()
app.use(cors())
app.use(express.json())

const upload = multer({ dest: 'uploads/' })

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})


// 🔹 Function: Split large text into chunks WITH OVERLAP
function splitText(text, chunkSize = 500, overlap = 100) {
  const chunks = []

  for (let i = 0; i < text.length; i += (chunkSize - overlap)) {
    chunks.push(text.slice(i, i + chunkSize))
  }

  return chunks
}


// 🔹 Upload + Process + Embeddings
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path

    // Step 1: Read PDF
    const dataBuffer = fs.readFileSync(filePath)

    // Step 2: Extract text
    const data = await pdfParse(dataBuffer)
    console.log("PDF text extracted")

    // Step 3: Chunking (UPDATED)
    const chunks = splitText(data.text, 500, 100)
    console.log("Total chunks:", chunks.length)

    // Step 4: Create embeddings
    const embeddings = []

    for (let chunk of chunks) {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk
      })

      embeddings.push({
        text: chunk,
        embedding: response.data[0].embedding
      })
    }

    // Step 5: Store globally (temporary)
    global.documentData = embeddings

    // Step 6: Send response
    res.json({
      message: "Embeddings created successfully",
      totalChunks: chunks.length,
      sampleChunk: chunks[0],
      embeddingSize: embeddings[0].embedding.length
    })

  } catch (error) {
    console.error(error)
    res.status(500).send('Error processing PDF')
  }
})


// 🔹 Ask question → find relevant part → generate answer
app.post('/chat', async (req, res) => {
  try {
    const { question } = req.body

    if (!question) {
      return res.status(400).json({ error: "Question is required" })
    }

    if (!global.documentData) {
      return res.status(400).json({ error: "No document uploaded yet" })
    }

    // 🔹 Step 1: Question embedding
    const qEmbedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question
    })

    const questionVector = qEmbedding.data[0].embedding

    // 🔹 Step 2: Cosine similarity
    function cosineSimilarity(a, b) {
      return a.reduce((sum, val, i) => sum + val * b[i], 0)
    }

    // 🔹 Step 3: Score all chunks
    let scores = []

    for (let item of global.documentData) {
      const score = cosineSimilarity(item.embedding, questionVector)
      scores.push({ text: item.text, score })
    }

    // 🔹 Step 4: Sort by similarity
    scores.sort((a, b) => b.score - a.score)

    // 🔹 Debug (optional but useful)
    console.log("Top 3 scores:", scores.slice(0, 3))

    // 🔹 Step 5: Fallback check
    if (scores[0].score < 0.2) {
      return res.json({
        answer: "I could not find relevant information in the document."
      })
    }

    // 🔹 Step 6: Top 3 chunks
    const topChunks = scores.slice(0, 3)

    // 🔹 Step 7: Combine context
    const context = topChunks.map(c => c.text).join("\n\n")

    // 🔹 Step 8: LLM call
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a helpful assistant.

Answer the question ONLY using the provided context.
If the answer is not present in the context, say:
"I could not find the answer in the document."

Be clear, concise, and structured.
`
        },
        {
          role: "user",
          content: `
Context:
${context}

Question:
${question}

Answer:
`
        }
      ]
    })

    // 🔹 Step 9: Send response
    res.json({
      answer: completion.choices[0].message.content
    })

  } catch (error) {
    console.error(error)
    res.status(500).send("Error in chat API")
  }
})


// 🔹 Start server
app.listen(5000, () => {
  console.log("Server running on port 5000")
})



// ================= PROJECT FLOW – AI CHAT WITH DOCUMENTS =================

// 1. Client (Postman / Frontend) sends a POST request with a PDF file

// 2. Request hits "/upload" route on Express server (port 5000)

// 3. Multer middleware uploads and stores file in "uploads/" folder

// 4. Server reads file using fs module

// 5. pdf-parse extracts text from PDF

// 6. Extracted text is logged for verification

// 7. Text is split into smaller chunks using chunking

//    🔥 UPDATED: Overlapping Chunking
//    - Each chunk overlaps with previous one
//    - Prevents context loss at boundaries
//    - Improves retrieval accuracy

// 8. Each chunk is converted into embeddings using OpenAI API

// 9. Embeddings are stored in memory (global.documentData)

// 10. Server responds with success message + metadata

// ===============================================================


// ================= KEY CONCEPTS =================

// API KEY:
// Secret key to access OpenAI services

// WHY .env:
// Keeps API key secure (not exposed in code)

// EMBEDDINGS:
// Convert text → numerical vectors
// Helps compare meaning instead of exact words

// CHUNKING:
// Splitting large text into smaller parts

// OVERLAPPING CHUNKING (NEW):
// Each chunk shares some part with previous chunk
// Ensures important context is not lost


// ================= FLOW SUMMARY =================

// PDF → text → chunks (with overlap)
// chunks → embeddings → stored

// Later:
// question → embedding
// compare with stored embeddings
// get best chunks → send to GPT → answer


// ================= CHAT API LOGIC (RAG) =================

// 1. Take question from user

// 2. Convert question → embedding

// 3. Loop through all stored chunks

// 4. Compute cosine similarity with each chunk

// 5. Store similarity scores

// 6. Sort chunks (highest similarity first)

// 7. Select TOP 3 most relevant chunks
//    (better than top 1 → richer context)

// 8. Combine top chunks into a single "context"

// 9. Fallback check:
//    If similarity score is too low → no relevant data

// 10. Send context + question to GPT

// 11. GPT generates answer using ONLY provided context

// 12. Return final answer to user


// ================= ONE LINE =================

// Question → embedding → top 3 chunks → combine → GPT → answer


// ================= FULL RAG FLOW =================

// PDF → chunks (overlap) → embeddings → store
//                             ↓
// User question → embedding
//                             ↓
// Find top 3 similar chunks  ← Retrieval
//                             ↓
// Combine chunks as context  ← Augmentation
//                             ↓
// GPT generates answer       ← Generation