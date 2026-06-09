import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import 'dotenv/config';
import { Groq } from 'groq-sdk';
import mammoth from 'mammoth';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// MongoDB Schemas
const DocumentSchema = new mongoose.Schema({ name: String, uploadedAt: { type: Date, default: Date.now } });
const ChunkSchema = new mongoose.Schema({ documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' }, text: String });

const Document = mongoose.model('Document', DocumentSchema);
const Chunk = mongoose.model('Chunk', ChunkSchema);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/noteslm')
  .then(() => console.log("Connected to MongoDB Database Matrix"))
  .catch(err => console.error("Database connection failure:", err));

// GET ALL DOCUMENTS
app.get('/api/documents', async (req, res) => {
  try {
    const docs = await Document.find().sort({ uploadedAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPLOAD & VECTORIZE DOCUMENT
app.post('/api/upload', async (req, res) => {
  try {
    const { name, base64Data, fileType } = req.body;
    if (!base64Data) return res.status(400).json({ error: "Missing raw data stream blocks." });

    const fileBuffer = Buffer.from(base64Data, 'base64');
    let extractedText = "";

    if (fileType === "application/pdf" || name.endsWith('.pdf')) {
      const parsedPdf = await pdfParse(fileBuffer);
      extractedText = parsedPdf.text;
    } else if (name.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      extractedText = result.value;
    } else {
      extractedText = fileBuffer.toString('utf-8');
    }

    if (!extractedText.trim()) return res.status(400).json({ error: "No text layers parsed successfully." });

    const newDoc = await Document.create({ name });
    
    // Chunking text layers (Roughly every 800 characters)
    const chunkSize = 800;
    const chunkPromises = [];
    for (let i = 0; i < extractedText.length; i += chunkSize) {
      const textSlice = extractedText.substring(i, i + chunkSize);
      chunkPromises.push(Chunk.create({ documentId: newDoc._id, text: textSlice }));
    }
    await Promise.all(chunkPromises);

    res.json({ docId: newDoc._id, name: newDoc.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE DOCUMENT
app.delete('/api/documents/:id', async (req, res) => {
  try {
    const docId = new mongoose.Types.ObjectId(req.params.id);
    await Document.findByIdAndDelete(docId);
    await Chunk.deleteMany({ documentId: docId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CHAT PIPELINE WITH CONTEXT MATCHING
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, activeDocId } = req.body;
    if (!messages || messages.length === 0) return res.status(400).json({ error: "No conversation history provided." });

    const lastMessage = messages[messages.length - 1];
    const userPrompt = lastMessage && lastMessage.text ? String(lastMessage.text) : "";
    let databaseContext = "";

    if (activeDocId && activeDocId !== "null" && activeDocId !== "" && userPrompt) {
      const targetDocObjectId = new mongoose.Types.ObjectId(activeDocId);
      const allChunks = await Chunk.find({ documentId: targetDocObjectId });

      const cleanSearchWords = userPrompt
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
        .split(/\s+/)
        .filter(word => word.length > 2);

      const matchedChunks = allChunks
        .map(chunk => {
          let score = 0;
          if (!chunk || !chunk.text) return { text: "", score: 0 };
          const chunkTextLower = chunk.text.toLowerCase();
          cleanSearchWords.forEach(word => {
            if (chunkTextLower.includes(word)) score += 2;
          });
          return { text: chunk.text, score };
        })
        .filter(c => c.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);

      if (matchedChunks.length === 0 && allChunks.length > 0) {
        databaseContext = allChunks.slice(0, 4).map(c => c.text).join("\n\n");
      } else {
        databaseContext = matchedChunks.map(c => c.text).join("\n\n");
      }
    }

    const systemInstruction = {
      role: "system",
      content: `You are an advanced document assistant. Use ONLY the provided context source facts to answer questions. If the answer cannot be found, say "I cannot find information on that topic in the source."
      
      --- START CONTEXT SOURCE ---
      ${databaseContext || "No source focus chosen. Speak generally using historical data metrics."}
      --- END CONTEXT SOURCE ---`
    };

    const apiMessagesArray = [
      systemInstruction,
      ...messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text || m.content || ""
      }))
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: apiMessagesArray,
      model: "llama-3.3-70b-versatile",
      temperature: 0.2
    });

    res.json({ answer: chatCompletion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log("NotesLM Backend operating on port 5000"));