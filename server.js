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


// 🔹 Function: Split large text into chunks
function splitText(text, chunkSize = 500) {
  const chunks = []

  for (let i = 0; i < text.length; i += chunkSize) {
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

    // Step 3: Chunking
    const chunks = splitText(data.text)
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


//Ask question → find relevant part of PDF → generate answer
app.post('/chat',async(req,res)=>{
  try{
    const { question } = req.body

    if(!question){
      return res.status(400).json({error:"Question is required"})
    }

    if(!global.documentData){
      return res.status(400).json({error:"No document uploaded yet"})
    }

    //convert question to embedding
    const qEmbedding=await openai.embeddings.create({
       model: "text-embedding-3-small",
      input: question
    })

     const questionVector = qEmbedding.data[0].embedding

     // 🔹 Step 2: Find most similar chunk
    function cosineSimilarity(a, b) {
      return a.reduce((sum, val, i) => sum + val * b[i], 0)
    }

    let bestMatch = null
    let maxScore = -Infinity

    for (let item of global.documentData) {
      const score = cosineSimilarity(item.embedding, questionVector)

      if (score > maxScore) {
        maxScore = score
        bestMatch = item.text
      }
    }

     // 🔹 Step 3: Ask GPT using that chunk
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Answer only from the given context."
        },
        {
          role: "user",
          content: `Context: ${bestMatch}\n\nQuestion: ${question}`
        }
      ]
    })

     // 🔹 Step 4: Send answer
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



// PROJECT FLOW – AI CHAT WITH DOCUMENTS (STEP 1)

// 1. Client (Postman / Frontend) sends a POST request to the server with a PDF file

// 2. The request hits the "/upload" route on the Express server running on port 5000

// 3. Multer middleware handles the file upload and stores it in the "uploads/" folder

// 4. The server reads the uploaded file using the File System (fs) module

// 5. pdf-parse processes the file and extracts the text content from the PDF

// 6. The extracted text is printed in the server console for verification

// 7. The server sends a JSON response back to the client containing:

//    * Success message
//    * First 500 characters of extracted text

// 8. If any error occurs, the server returns an error response (status 500)

// This forms the base for RAG pipeline where extracted text will later be converted into embeddings.

// Type	Meaning
// GET	Get data
// POST	Send data

//chunking done to convert large text into smaller pieces for better processing in later stages of the RAG pipeline.


// ===== SIMPLE SUMMARY =====

// API KEY:
// Secret key used to access OpenAI services.
// It tells OpenAI "this request is from me".

// WHY .env:
// To keep API key safe (not in code / GitHub).

// EMBEDDINGS:
// Convert text → numbers (vectors)
// Helps machine understand meaning, not just words.

// FLOW:
// PDF → text → chunks
// chunks → embeddings (using OpenAI + API key)
// store embeddings

// Later:
// question → embedding
// compare with stored embeddings
// get best chunk → send to GPT → answer

// ONE LINE:
// API key = access
// embeddings = understanding





// ================= CHAT API LOGIC =================

// 1. Take question from user (req.body)

// 2. Convert question → embedding (vector)
//    So it can be compared with document chunks

// 3. Loop through all stored chunks (global.documentData)

// 4. For each chunk:
//    Compare its embedding with question embedding
//    using cosine similarity (measures meaning similarity)

// 5. Find the chunk with highest similarity
//    → this is the most relevant part of the PDF

// 6. Send this chunk as "context" to GPT along with question

// 7. GPT generates answer using only that context

// 8. Send final answer back to user

// ================= ONE LINE =================
// Question → embedding → find best chunk → send to GPT → get answer
// ===============================================================

//RAG flow in chat API
// PDF → chunks → embeddings → store
//                       ↓
// User question → embedding
//                       ↓
// Find similar chunk  ← (Retrieval)
//                       ↓
// Send chunk + question ← (Augmentation)
//                       ↓
// GPT generates answer  ← (Generation)