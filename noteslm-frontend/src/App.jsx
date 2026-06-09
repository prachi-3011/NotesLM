import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [documents, setDocuments] = useState([]);
  const [activeDocId, setActiveDocId] = useState(null);
  const [messages, setMessages] = useState([
    { sender: 'assistant', text: 'System Online. Select an active document source to begin context-grounded analysis.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchDocumentsList();
  }, []);

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
      console.error("Failed to read server index list:", err);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const dataUrl = e.target.result;
        const base64Data = dataUrl.split(',')[1];

        const response = await fetch("http://localhost:5000/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: file.name, base64Data: base64Data, fileType: file.type })
        });

        const responseData = await response.json();

        if (response.ok) {
          setDocuments(prev => [...prev, { _id: responseData.docId, name: responseData.name }]);
          setActiveDocId(responseData.docId);
        } else {
          alert(`Server Error: ${responseData.error}`);
        }
      } catch (err) {
        alert("Network Error: Connection failed.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileDelete = async (docId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/documents/${docId}`, { method: "DELETE" });
      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc._id !== docId));
        if (activeDocId === docId) setActiveDocId(null);
      }
    } catch (err) {
      console.error("Removal failure:", err);
    }
  };

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
          messages: updatedHistory.filter(m => m.sender !== 'assistant' || updatedHistory.indexOf(m) !== 0),
          activeDocId: activeDocId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { sender: 'assistant', text: data.answer }]);
      } else {
        const errorData = await response.json();
        setMessages(prev => [...prev, { sender: 'assistant', text: `Pipeline Error: ${errorData.error || "Failed execution."}` }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'assistant', text: "Error connecting to server pipeline." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'row', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#050b14' }}>

      {/* SIDEBAR COMPONENT */}
      <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#0b132b', borderRight: '1px solid rgba(204, 255, 0, 0.2)', height: '100vh', width: '260px', flexShrink: 0 }}>
        <div className="sidebar-header" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '20px 15px 15px 15px', borderBottom: '1px solid #1c2541' }}>
          <h2 className="sidebar-title" style={{ margin: 0, fontSize: '18px', color: '#ffffff', fontWeight: '600' }} onClick={() => setActiveDocId(null)}>
            📚 Sources
          </h2>
          {/* 🌟 REPLACED: Ultra-clean, modern thin neon plus icon setup */}
          <label
            className="upload-icon-button"
            title="Upload Document"
            style={{
              color: '#ccff00',
              fontSize: '28px',          /* Slightly bigger so the thin line stands out */
              fontWeight: '200',         /* Forces a sleek, elegant thin line */
              cursor: 'pointer',
              textShadow: '0 0 8px rgba(204, 255, 0, 0.4)', /* Subtle, modern neon glow */
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
              e.currentTarget.style.textShadow = '0 0 15px rgba(204, 255, 0, 0.8)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.textShadow = '0 0 8px rgba(204, 255, 0, 0.4)';
            }}
          >
            +
            <input type="file" accept=".pdf,.docx,.txt,.md" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>

        <div className="documents-list" style={{ flex: 1, overflowY: 'auto', padding: '15px 10px' }}>
          {documents.length === 0 ? (
            <p className="no-docs" style={{ color: '#5f6c7d', fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>No documents vectorized.</p>
          ) : (
            documents.map((doc) => (
              <div
                key={doc._id}
                onClick={() => setActiveDocId(doc._id)}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '6px',
                  backgroundColor: activeDocId === doc._id ? 'rgba(204, 255, 0, 0.1)' : 'transparent',
                  border: activeDocId === doc._id ? '1px solid rgba(204, 255, 0, 0.3)' : '1px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <span className="doc-name" style={{ color: activeDocId === doc._id ? '#ccff00' : '#e0e1dd', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                  📄 {doc.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileDelete(doc._id);
                  }}
                  style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', opacity: 0.6 }}
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CHAT DISPLAY INTERFACE */}
      <div className="chat-area" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100vh', backgroundColor: '#060b19', overflow: 'hidden' }}>
        <div className="chat-header" style={{ display: 'flex', alignItems: 'center', padding: '15px 40px', backgroundColor: '#0b132b', borderBottom: '2px solid #1c2541', height: '60px', boxSizing: 'border-box' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: '#ffffff' }}>Notes</span>
            <span style={{ color: '#ccff00', textShadow: '0 0 8px rgba(204, 255, 0, 0.3)' }}>LM</span>
            {activeDocId ? (
              <span style={{ fontSize: '12px', color: '#ccff00', marginLeft: '15px', padding: '4px 10px', backgroundColor: '#1c2541', border: '1px solid rgba(204, 255, 0, 0.3)', borderRadius: '4px', fontWeight: '400' }}>
                📍 Focus Source: {documents.find(d => d._id === activeDocId)?.name}
              </span>
            ) : (
              <span style={{ fontSize: '12px', color: '#8ecae6', marginLeft: '15px', padding: '4px 10px', backgroundColor: '#1c2541', borderRadius: '4px', fontWeight: '400' }}>
                🌐 Global Context Mode
              </span>
            )}
          </h2>
        </div>

        <div className="messages-container" style={{ flex: 1, overflowY: 'auto', padding: '30px 40px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {messages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={index} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', width: '100%' }}>
                <div style={{
                  maxWidth: '65%',
                  padding: '14px 18px',
                  borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  backgroundColor: isUser ? '#ccff00' : '#1c2541',
                  border: isUser ? 'none' : '1px solid #3a506b',
                  color: isUser ? '#050b14' : '#f4f6f9',
                  fontSize: '15px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          {isChatLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
              <p style={{ color: '#ccff00', fontSize: '13px', fontStyle: 'italic' }}>⚡ Querying context matrices...</p>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="chat-input-wrapper" style={{ padding: '25px 40px 30px 40px', backgroundColor: '#0b132b', borderTop: '2px solid #1c2541' }}>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%', maxWidth: '900px', margin: '0 auto', height: '54px', backgroundColor: '#050b14', border: '2px solid #3a506b', borderRadius: '27px', padding: '0 6px 0 22px', boxSizing: 'border-box' }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={activeDocId ? "Ask a question focused on this source..." : "Ask a general question or pick a source to ground..."}
              style={{ flex: 1, height: '100%', backgroundColor: 'transparent', color: '#f4f6f9', border: 'none', outline: 'none', fontSize: '15px' }}
            />
            <button type="submit" style={{ backgroundColor: '#ccff00', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: '#050b14', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ➔
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}

export default App;