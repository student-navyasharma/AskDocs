const BASE_URL = "http://localhost:5000"

// Upload PDF
async function uploadPDF() {
  const fileInput = document.getElementById("pdfFile")
  const file = fileInput.files[0]

  if (!file) {
    alert("Please select a PDF")
    return
  }

  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData
  })

  const data = await res.json()
  alert("PDF uploaded successfully!")
  console.log(data)
}

// Ask Question
async function askQuestion() {
  const input = document.getElementById("question")
  const question = input.value

  if (!question) return

  addMessage("You: " + question, "user")

  const res = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ question })
  })

  const data = await res.json()

  addMessage("Bot: " + data.answer, "bot")

  input.value = ""
}

// Add message to chat
function addMessage(text, className) {
  const chatBox = document.getElementById("chatBox")

  const div = document.createElement("div")
  div.classList.add("message", className)
  div.innerText = text

  chatBox.appendChild(div)
  chatBox.scrollTop = chatBox.scrollHeight
}