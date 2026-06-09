import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import docxParser from 'docx-parser';
import { Buffer } from 'buffer';

dotenv.config();
const app = express();

// --- HIGH CAPACITY MIDDLEWARE SCHEMAS ---
app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 1. Establish MongoDB Atlas Cloud Connection Hook
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB database successfully..."))
  .catch(err => console.error("Database connection failure:", err));

// 2. Define the Structured JSON Schema for Chunk-Aware Storage
const DocumentSchema = new mongoose.Schema({
  name: String,
  uploadedAt: { type: Date, default: Date.now },
  chunks: [{ chunkIndex: Number, text: String }]
});
const Document = mongoose.model('Document', DocumentSchema);

// 3. Helper Function: Splitting Raw Text into Overlapping JSON Chunks
function splitIntoChunks(text, chunkSize = 1000, overlap = 200) {
  if (!text) return [];
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    chunks.push(text.slice(i, end));
    i += (chunkSize - overlap);
  }
  return chunks;
}

// --- ROUTE 1: UPLOAD, AUTOMATICALLY DETECT PDF VERSION, EXTRACT TEXT, CHUNK, AND SAVE ---
app.post('/api/upload', async (req, res) => {
  try {
    const { name, base64Data, fileType } = req.body;

    if (!base64Data || !name) {
      console.error("❌ Incoming upload payload missing data vectors.");
      return res.status(400).json({ error: "Missing required payload parameters." });
    }

    // Defensive Sanitization: Strip out browser Data-URI schema headers if present
    const cleanBase64 = base64Data.replace(/^data:.*;base64,/, "");
    const fileBuffer = Buffer.from(cleanBase64, 'base64');
    let rawText = "";

    console.log(`📥 Ingesting file: "${name}" | Type: ${fileType} | Bytes: ${fileBuffer.length}`);

    // Route processing based on file configuration type
    if (fileType === "application/pdf" || name.endsWith(".pdf")) {
      const pdfModule = await import('pdf-parse');
      
      // --- UNIVERSAL PDF INTERFACE ADAPTER ---
      if (pdfModule.PDFParse || (pdfModule.default && pdfModule.default.PDFParse)) {
        // Mode A: Handles Modern Class-Based Node Implementations
        console.log("⚡ Utilizing modern class-based PDF parser engine...");
        const TargetClass = pdfModule.PDFParse || pdfModule.default.PDFParse;
        const parser = new TargetClass({ data: fileBuffer });
        const pdfData = await parser.getText();
        rawText = pdfData.text || "";
        
        if (typeof parser.destroy === 'function') {
          await parser.destroy();
        }
      } else {
        // Mode B: Fallback for Legacy Functional Exports
        console.log("⚡ Utilizing classic function-based PDF parser engine...");
        let legacyParse = pdfModule.default || pdfModule;
        if (typeof legacyParse !== 'function' && legacyParse.default) {
          legacyParse = legacyParse.default;
        }
        
        if (typeof legacyParse !== 'function') {
          throw new Error("Target package exports neither a valid module constructor class nor a callable extraction pipeline.");
        }
        
        const pdfData = await legacyParse(fileBuffer);
        rawText = pdfData.text || "";
      }
    } else if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
      name.endsWith(".docx")
    ) {
      rawText = await new Promise((resolve, reject) => {
        docxParser.parseBuffer(fileBuffer, (err, text) => {
          if (err) return reject(err);
          resolve(text || "");
        });
      });
    } else {
      // Fallback text transformation layout for plain text types (.txt, .md)
      rawText = fileBuffer.toString('utf-8');
    }

    if (!rawText || rawText.trim().length === 0) {
      console.warn("⚠️ Text parsing completed but returned an empty document context.");
      return res.status(422).json({ error: "Extraction failed: Document contains no extractable raw alphanumeric strings." });
    }

    // Process extraction results through the sliding chunk system
    const textStrings = splitIntoChunks(rawText);
    const chunkArray = textStrings.map((text, index) => ({ chunkIndex: index, text }));

    // Assemble document array model entry
    const newDoc = new Document({ name, chunks: chunkArray });
    await newDoc.save();

    console.log(`✅ File "${name}" processed and stored inside database collection with ID: ${newDoc._id}`);
    res.status(201).json({ message: "Processed successfully", docId: newDoc._id, name: newDoc.name });
    
  } catch (error) {
    console.error("❌ CRITICAL FILE PROCESSING PIPELINE FAILURE:", error);
    res.status(500).json({ error: "Parsing engine extraction failure.", details: error.message });
  }
});

// --- ROUTE 2: LIST FILE METADATA ONLY (For Sidebar Feed) ---
app.get('/api/documents', async (req, res) => {
  try {
    const docs = await Document.find({}, 'name uploadedAt'); 
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ROUTE 2B: DELETE AN EXISTING DOCUMENT BY ID ---
app.delete('/api/documents/:id', async (req, res) => {
  try {
    const docId = req.params.id;
    const deletedDoc = await Document.findByIdAndDelete(docId);
    
    if (!deletedDoc) {
      console.warn(`⚠️ Warning: Delete requested for non-existent document ID: ${docId}`);
      return res.status(404).json({ error: "Target document could not be found." });
    }

    console.log(`🗑️ File "${deletedDoc.name}" has been successfully deleted from your database.`);
    res.json({ message: "Document removed successfully", docId: docId });
  } catch (error) {
    console.error("❌ CRITICAL DELETE ROUTE PIPELINE FAILURE:", error);
    res.status(500).json({ error: "Database removal failure.", details: error.message });
  }
});

// --- ROUTE 3: INTERACTIVE CHAT ROUTER WITH KEYWORD CHUNK FILTERS ---
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, activeDocId } = req.body;
    const userQuery = messages[messages.length - 1].text;
    
    let relevantContext = "";

    if (activeDocId) {
      const doc = await Document.findById(activeDocId);
      if (doc) {
        const keywords = userQuery.toLowerCase().split(' ').filter(w => w.length > 3);
        const scoredChunks = doc.chunks
          .map(c => {
            let score = 0;
            keywords.forEach(w => { if (c.text.toLowerCase().includes(w)) score++; });
            return { chunk: c, score };
          })
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map(item => item.chunk.text);

        relevantContext = scoredChunks.length > 0 
          ? scoredChunks.join("\n\n") 
          : doc.chunks.slice(0, 2).map(c => c.text).join("\n\n");
      }
    }

    const systemPrompt = {
      role: "system",
      content: `You are an advanced conversational research assistant modeled after NotesLM.
You maintain conversation context history. Answer questions building cleanly upon past replies and using ONLY the document chunks below.

### RETRIEVED DOCUMENT DATA CHUNKS ###
${relevantContext || "No reference document focus has been selected yet."}
### END CHUNKS ###

Strict Grounding Rule: If the answers cannot be clearly derived from the blocks above, reply: 'I cannot find that information in the active source document.'`
    };

    const formattedHistory = messages.map(msg => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text
    }));

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [systemPrompt, ...formattedHistory],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1
      })
    });

    const data = await groqResponse.json();
    res.json({ answer: data.choices[0]?.message?.content || "No output matched from model." });
  } catch (error) {
    console.error("AI Generation routing error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`NotesLM Backend operating on port ${PORT}`));