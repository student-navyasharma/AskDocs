const express=require('express')
const multer=require('multer')
const pdfParse=require('pdf-parse')
const fs= require('fs')
const cors=require('cors')
const app=express()
app.use(cors())
const upload=multer({dest:'uploads/'})


//This function breaks a large text into smaller pieces (chunks)
function splitText(text,chunkSize=500){
    const chunks=[]
    for(let i=0;i<text.length; i+=chunkSize){              //Basically jumping in steps of 500
        chunks.push(text.slice(i,i+chubkSize))
    }
    return chunks
}


app.post('/upload',upload.single('file'),async(req,res)=>{
  try{
    const filePath=req.file.path

    const dataBuffer=fs.readFileSync(filePath)
    const data=await(pdfParse(dataBuffer))
    console.log("PDF text:\n", data.text)
    
    //chunking
     const chunks = splitText(data.text)

    console.log("Total chunks:", chunks.length)
    console.log("First chunk:", chunks[0])

    res.json({
        message:"PDF processed successfully",
        text:data.text.substring(0,500), // Return first 500 characters for preview
        totalChunks: chunks.length,
      previewChunk: chunks[0]
    });
}catch(error){
    console.error(error)
    res.status(500).send('Error processing PDF')
}
    });

 app.listen(5000, () => {
  console.log("Server running on port 5000");
});




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