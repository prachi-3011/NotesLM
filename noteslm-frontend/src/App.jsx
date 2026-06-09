import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
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
    if (e) e.preventDefault();
    if (!inputValue.trim() || isChatLoading) return;

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
    <div className="app-container">
      <Sidebar 
        documents={documents} 
        activeDocId={activeDocId} 
        setActiveDocId={setActiveDocId} 
        onFileUpload={handleFileUpload} 
        onFileDelete={handleFileDelete} 
      />
      <ChatArea 
        messages={messages} 
        inputValue={inputValue}
        setInputValue={setInputValue}
        isChatLoading={isChatLoading}
        onSubmit={handleSendMessage}
        chatEndRef={chatEndRef}
        activeDocId={activeDocId} 
        documents={documents} 
      />
    </div>
  );
}

export default App;