import React, { useState, useEffect, useRef } from 'react';
import './App.css'; // Add or edit style properties matching your framework layout classes

function App() {
  const [documents, setDocuments] = useState([]);
  const [activeDocId, setActiveDocId] = useState(null);
  const [messages, setMessages] = useState([
    { sender: 'assistant', text: 'Hello! Upload a document and select it from the sidebar to begin our conversation.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Initial Lifecyle Setup: Fetch file directory lists from database
  useEffect(() => {
    fetchDocumentsList();
  }, []);

  // Structural UI Scrolling Behavior
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchDocumentsList = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/documents');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error("Failed to read server index feed directory list:", err);
    }
  };

  // --- CONTROLLER A: SANITIZED BINARY TO BASE64 FILE INGESTION PIPE ---
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const dataUrl = e.target.result;
        const base64Data = dataUrl.split(',')[1]; // Capture clean Base64 data chunks only

        console.log(`📤 Dispatching "${file.name}" to backend node server...`);

        const response = await fetch("http://localhost:5000/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name: file.name, 
            base64Data: base64Data, 
            fileType: file.type 
          })
        });

        const responseData = await response.json();

        if (response.ok) {
          console.log("✅ Server accepted document storage:", responseData);
          setDocuments(prev => [...prev, { _id: responseData.docId, name: responseData.name }]);
          setActiveDocId(responseData.docId);
          alert(`Successfully uploaded and parsed: ${file.name}`);
        } else {
          console.error("❌ Backend processing error details:", responseData);
          alert(`Server Error: ${responseData.details || responseData.error}`);
        }
      } catch (err) {
        console.error("❌ Transmission network connection failure:", err);
        alert("Network Error: Could not connect to the backend server pipeline.");
      }
    };
    reader.readAsDataURL(file); // Safe binary translation handler layer
  };

  // --- CONTROLLER B: CLOUD ATLAS PERMANENT DELETION METHOD ---
  const handleFileDelete = async (docId, event) => {
    event.stopPropagation(); // Avoid choosing the item while triggering delete
    
    if (!window.confirm("Are you sure you want to permanently delete this document from cloud storage?")) return;

    try {
      console.log(`🗑️ Dispatching removal request for Document ID: ${docId}`);
      
      const response = await fetch(`http://localhost:5000/api/documents/${docId}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc._id !== docId));
        if (activeDocId === docId) {
          setActiveDocId(null); // Reset focus view context if target matches open document
        }
        console.log("✅ File removed successfully from cloud storage arrays:", data);
      } else {
        console.error("❌ Database removal failure response metrics:", data);
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error("❌ Network error connecting to delete pipeline router:", err);
      alert("Network error: Could not reach the server to purge the target reference record.");
    }
  };

  // --- CONTROLLER C: CHAT MESSAGE EXECUTION ENGINE ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { sender: 'user', text: inputValue };
    const updatedHistory = [...messages, userMessage];
    
    setMessages(updatedHistory);
    setInputValue('');
    setIsChatLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory.filter(m => m.sender !== 'assistant' || updatedHistory.indexOf(m) !== 0), // Skip greeting string from API history payloads
          activeDocId: activeDocId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { sender: 'assistant', text: data.answer }]);
      } else {
        const errData = await response.json();
        setMessages(prev => [...prev, { sender: 'assistant', text: `Error: ${errData.error || 'Failed generating inference.'}` }]);
      }
    } catch (err) {
      console.error("Chat dispatch router error:", err);
      setMessages(prev => [...prev, { sender: 'assistant', text: 'Network connection dropped. Verify node hosting ports are operational.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* SIDEBAR PANEL LAYOUT SECTION */}
      <div className="sidebar" style={{ width: '300px', background: '#f5f5f5', borderRight: '1px solid #ddd', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>NotesLM Storage</h2>
        
        <label style={{ display: 'block', padding: '10px', background: '#007bff', color: '#fff', textAlign: 'center', borderRadius: '4px', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}>
          ➕ Upload Document
          <input type="file" accept=".pdf,.docx,.txt,.md" onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>

        <h3 style={{ fontSize: '14px', color: '#666', textTransform: 'uppercase', marginBottom: '10px' }}>Active Sources</h3>
        <div className="documents-list" style={{ flexGrow: 1, overflowY: 'auto' }}>
          {documents.length === 0 ? (
            <p style={{ color: '#999', fontSize: '13px' }}>No documents uploaded yet.</p>
          ) : (
            documents.map((doc) => (
              <div 
                key={doc._id} 
                onClick={() => setActiveDocId(doc._id)}
                className={`document-item ${activeDocId === doc._id ? 'active' : ''}`}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  cursor: 'pointer', 
                  padding: '10px', 
                  marginBottom: '8px', 
                  borderRadius: '4px',
                  background: activeDocId === doc._id ? '#e3f2fd' : '#fff',
                  border: activeDocId === doc._id ? '1px solid #90caf9' : '1px solid #ddd'
                }}
              >
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '80%', fontSize: '14px' }}>
                  📄 {doc.name}
                </span>
                
                <button 
                  onClick={(e) => handleFileDelete(doc._id, e)}
                  style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '16px', padding: '0 5px' }}
                  title="Permanently Delete File"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CONVERSATIONAL CHAT SCREEN LAYOUT SECTION */}
      <div className="chat-area" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
        <div className="chat-header" style={{ padding: '20px', borderBottom: '1px solid #ddd', background: '#fafafa' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>
            {activeDocId 
              ? `Exploring: ${documents.find(d => d._id === activeDocId)?.name || 'Selected File'}` 
              : 'General Exploration Workspace (No Active Source Selected)'}
          </h2>
        </div>

        <div className="messages-container" style={{ flexGrow: 1, padding: '20px', overflowY: 'auto', background: '#fcfcfc' }}>
          {messages.map((msg, index) => (
            <div 
              key={index} 
              style={{ 
                display: 'flex', 
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', 
                marginBottom: '15px' 
              }}
            >
              <div style={{ 
                maxWidth: '70%', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                fontSize: '15px',
                lineHeight: '1.5',
                background: msg.sender === 'user' ? '#007bff' : '#f1f1f1', 
                color: msg.sender === 'user' ? '#fff' : '#333' 
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          {isChatLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }}>
              <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#f1f1f1', color: '#777', fontSize: '14px', fontStyle: 'italic' }}>
                Thinking and referencing document context matrices...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSendMessage} style={{ padding: '20px', borderTop: '1px solid #ddd', display: 'flex' }}>
          <input 
            type="text" 
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)} 
            placeholder={activeDocId ? "Ask a question focused on this source..." : "Select an active document source in the sidebar to chat..."}
            style={{ flexGrow: 1, padding: '12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '15px', marginRight: '10px', outline: 'none' }}
          />
          <button type="submit" style={{ padding: '12px 24px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            Send
          </button>
        </form>
      </div>

    </div>
  );
}

export default App;